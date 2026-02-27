// backend/controllers/compraController.js
const Compra = require('../models/Compra');
const Pago = require('../models/Pago');
const Lote = require('../models/Lote');
const Usuario = require('../models/Usuario');
const SolicitudCompra = require('../models/SolicitudCompra');
const { generarComprobantePDF } = require('../utils/pdf');
const { enviarComprobante } = require('../utils/email');

/**
 * CU-03: Crear compra (registrar venta de lote) — solo admin
 */
async function crear(req, res) {
  try {
    const { lote_id, cliente_id, numero_cuotas, fecha_inicio_pagos, notas } = req.body;

    const lote = await Lote.buscarPorId(lote_id);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
    if (lote.estado !== 'disponible') return res.status(400).json({ error: `El lote no está disponible (estado: ${lote.estado}).` });

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

    // Validar que el cliente solo pueda pagar sus propias compras
    if (req.usuario.rol !== 'admin' && compra.cliente_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

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

// ── SOLICITUDES DE COMPRA ─────────────────────────────────

/**
 * Cliente crea una solicitud de compra
 */
async function crearSolicitud(req, res) {
  try {
    const { lote_id, numero_cuotas_solicitadas, mensaje } = req.body;
    const usuario_id = req.usuario.id;

    const lote = await Lote.buscarPorId(lote_id);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
    if (lote.estado !== 'disponible') return res.status(400).json({ error: 'El lote no está disponible.' });

    // Verificar que no tenga una solicitud pendiente para el mismo lote
    const tienePendiente = await SolicitudCompra.tieneSolicitudPendiente(usuario_id, lote_id);
    if (tienePendiente) return res.status(400).json({ error: 'Ya tienes una solicitud pendiente para este lote.' });

    const id = await SolicitudCompra.crear({
      usuario_id,
      lote_id,
      numero_cuotas_solicitadas: parseInt(numero_cuotas_solicitadas) || 12,
      mensaje
    });

    // Marcar el lote como reservado mientras se procesa la solicitud
    await Lote.cambiarEstado(lote_id, 'reservado');

    res.status(201).json({ message: 'Solicitud de compra enviada exitosamente. El administrador la revisará pronto.', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la solicitud.' });
  }
}

/**
 * Cliente ve sus propias solicitudes
 */
async function misSolicitudes(req, res) {
  try {
    const solicitudes = await SolicitudCompra.listarPorUsuario(req.usuario.id);
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener solicitudes.' });
  }
}

/**
 * Admin lista todas las solicitudes
 */
async function listarSolicitudesAdmin(req, res) {
  try {
    const { pagina = 1, limite = 20 } = req.query;
    const result = await SolicitudCompra.listarTodas(parseInt(pagina), parseInt(limite));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar solicitudes.' });
  }
}

/**
 * Admin aprueba o rechaza una solicitud
 */
async function gestionarSolicitud(req, res) {
  try {
    const { accion, numero_cuotas_aprobadas, fecha_inicio_pagos, notas_admin } = req.body;
    const solicitud = await SolicitudCompra.buscarPorId(req.params.id);

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    if (solicitud.estado !== 'pendiente') return res.status(400).json({ error: 'Esta solicitud ya fue procesada.' });

    if (accion === 'rechazar') {
      // Liberar el lote de vuelta a disponible
      await Lote.cambiarEstado(solicitud.lote_id, 'disponible');
      await SolicitudCompra.rechazar(solicitud.id, notas_admin);
      return res.json({ message: 'Solicitud rechazada. El lote vuelve a estar disponible.' });
    }

    if (accion === 'aprobar') {
      // Verificar que el lote siga reservado o disponible
      const lote = await Lote.buscarPorId(solicitud.lote_id);
      if (!lote || lote.estado === 'vendido') {
        return res.status(400).json({ error: 'El lote ya no está disponible.' });
      }

      const num_cuotas = parseInt(numero_cuotas_aprobadas) || solicitud.numero_cuotas_solicitadas;
      const valor_cuota = parseFloat((lote.valor / num_cuotas).toFixed(2));
      const numero_contrato = await Compra.generarNumeroContrato();
      const fecha_inicio = fecha_inicio_pagos || new Date().toISOString().split('T')[0];

      // Crear la compra formal
      const compra_id = await Compra.crear({
        numero_contrato,
        cliente_id: solicitud.usuario_id,
        lote_id: solicitud.lote_id,
        valor_total: lote.valor,
        valor_cuota,
        numero_cuotas: num_cuotas,
        fecha_compra: new Date().toISOString().split('T')[0],
        fecha_inicio_pagos: fecha_inicio,
        notas: notas_admin || null
      });

      // Marcar lote como vendido
      await Lote.cambiarEstado(solicitud.lote_id, 'vendido');

      // Actualizar solicitud como aprobada
      await SolicitudCompra.aprobar(solicitud.id, {
        numero_cuotas_aprobadas: num_cuotas,
        fecha_inicio_pagos: fecha_inicio,
        notas_admin,
        compra_id
      });

      return res.json({ message: 'Solicitud aprobada. Compra creada exitosamente.', compra_id, numero_contrato });
    }

    return res.status(400).json({ error: 'Acción no válida. Usa "aprobar" o "rechazar".' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al gestionar la solicitud.' });
  }
}

module.exports = {
  crear, obtener, listarMias, listarTodas, registrarPago, historialPagos,
  crearSolicitud, misSolicitudes, listarSolicitudesAdmin, gestionarSolicitud
};