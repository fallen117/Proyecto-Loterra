// backend/controllers/compraController.js
const Compra = require('../models/Compra');
const Pago = require('../models/Pago');
const Lote = require('../models/Lote');
const Usuario = require('../models/Usuario');
const { generarComprobantePDF } = require('../utils/pdf');
const { enviarComprobante } = require('../utils/email');

/**
 * CU-03: Crear compra (registrar venta de lote)
 */
async function crear(req, res) {
  try {
    const { lote_id, cliente_id, numero_cuotas, fecha_inicio_pagos, notas } = req.body;

    // Validar lote disponible
    const lote = await Lote.buscarPorId(lote_id);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
    if (lote.estado !== 'disponible') return res.status(400).json({ error: `El lote no está disponible (estado: ${lote.estado}).` });

    // Validar cliente
    const cliente = await Usuario.buscarPorId(cliente_id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    const num_cuotas = parseInt(numero_cuotas) || 1;
    const valor_cuota = parseFloat((lote.valor / num_cuotas).toFixed(2));
    const numero_contrato = await Compra.generarNumeroContrato();

    const id = await Compra.crear({
      numero_contrato, cliente_id, lote_id, valor_total: lote.valor,
      valor_cuota, numero_cuotas: num_cuotas,
      fecha_compra: new Date().toISOString().split('T')[0],
      fecha_inicio_pagos: fecha_inicio_pagos || new Date().toISOString().split('T')[0],
      notas
    });

    // Marcar lote como vendido
    await Lote.cambiarEstado(lote_id, 'vendido');

    res.status(201).json({ message: 'Compra registrada exitosamente.', id, numero_contrato });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la compra.' });
  }
}

async function obtener(req, res) {
  try {
    const compra = await Compra.buscarPorId(req.params.id);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada.' });
    // Verificar acceso: solo el cliente dueño o admin
    if (req.usuario.rol !== 'admin' && compra.cliente_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }
    const pagos = await Pago.listarPorCompra(req.params.id);
    res.json({ ...compra, pagos });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener compra.' });
  }
}

async function listarMias(req, res) {
  try {
    const compras = await Compra.listarPorCliente(req.usuario.id);
    res.json(compras);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar compras.' });
  }
}

async function listarTodas(req, res) {
  try {
    const { pagina = 1, limite = 20 } = req.query;
    const result = await Compra.listarTodas(parseInt(pagina), parseInt(limite));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar compras.' });
  }
}

/**
 * CU-04: Registrar pago y enviar comprobante
 */
async function registrarPago(req, res) {
  try {
    const { compra_id, valor_pagado, metodo_pago, referencia_pago, fecha_pago, notas } = req.body;

    const compra = await Compra.buscarPorId(compra_id);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada.' });
    if (compra.estado === 'completada') return res.status(400).json({ error: 'Esta compra ya está completada.' });
    if (compra.estado === 'cancelada') return res.status(400).json({ error: 'Esta compra está cancelada.' });

    const valor = parseFloat(valor_pagado);
    if (valor <= 0) return res.status(400).json({ error: 'El valor pagado debe ser mayor a cero.' });

    const saldo_anterior = parseFloat(compra.saldo_pendiente);
    const saldo_despues = Math.max(0, saldo_anterior - valor);
    const numero_cuota = compra.cuotas_pagadas + 1;
    const numero_comprobante = await Pago.generarNumeroComprobante();

    const pagoId = await Pago.crear({
      numero_comprobante, compra_id, numero_cuota, valor_pagado: valor,
      fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
      metodo_pago, referencia_pago, saldo_anterior, saldo_despues,
      registrado_por: req.usuario.id, notas
    });

    await Compra.actualizarSaldo(compra_id, saldo_despues, numero_cuota);

    // Generar y enviar PDF
    const pagoCompleto = await Pago.buscarPorId(pagoId);
    try {
      const pdfBuffer = await generarComprobantePDF({
        numeroComprobante: numero_comprobante,
        numeroContrato: compra.numero_contrato,
        fechaPago: pagoCompleto.fecha_pago,
        cliente: {
          nombre: pagoCompleto.nombre,
          apellido: pagoCompleto.apellido,
          email: pagoCompleto.email,
          telefono: pagoCompleto.telefono,
          documento: pagoCompleto.documento,
          tipo_doc: pagoCompleto.tipo_documento
        },
        lote: {
          codigo: pagoCompleto.lote_codigo,
          area: pagoCompleto.lote_area,
          ubicacion: pagoCompleto.lote_ubicacion
        },
        numeroCuota: numero_cuota,
        totalCuotas: compra.numero_cuotas,
        valorPagado: valor,
        saldoAnterior: saldo_anterior,
        saldoDespues: saldo_despues,
        metodoPago: metodo_pago,
        referencia: referencia_pago
      });

      await enviarComprobante(pagoCompleto.email, pagoCompleto.nombre, pdfBuffer, numero_cuota, compra.numero_contrato);
      await Pago.marcarCorreoEnviado(pagoId);
    } catch (e) {
      console.warn('Error generando/enviando PDF:', e.message);
    }

    res.status(201).json({
      message: 'Pago registrado exitosamente. Se envió el comprobante al correo.',
      pago_id: pagoId, numero_comprobante, saldo_pendiente: saldo_despues
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el pago.' });
  }
}

/**
 * CU-05: Historial de pagos del cliente autenticado
 */
async function historialPagos(req, res) {
  try {
    const clienteId = req.usuario.rol === 'admin' && req.query.cliente_id
      ? parseInt(req.query.cliente_id)
      : req.usuario.id;
    const pagos = await Pago.listarPorCliente(clienteId);
    res.json(pagos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial de pagos.' });
  }
}

module.exports = { crear, obtener, listarMias, listarTodas, registrarPago, historialPagos };
