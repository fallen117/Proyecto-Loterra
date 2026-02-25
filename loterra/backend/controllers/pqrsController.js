// backend/controllers/pqrsController.js
const PQRS = require('../models/PQRS');

/**
 * CU-06: Crear solicitud PQRS
 */
async function crear(req, res) {
  try {
    const { nombre_solicitante, email_solicitante, telefono_solicitante, tipo, asunto, descripcion } = req.body;
    const numero_radicado = await PQRS.generarNumeroRadicado();
    const usuario_id = req.usuario ? req.usuario.id : null;

    const id = await PQRS.crear({
      usuario_id, nombre_solicitante, email_solicitante, telefono_solicitante, tipo, asunto, descripcion, numero_radicado
    });

    res.status(201).json({
      message: 'PQRS radicada exitosamente.',
      id, numero_radicado,
      info: `Guarda tu número de radicado para hacer seguimiento: ${numero_radicado}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la PQRS.' });
  }
}

async function listar(req, res) {
  try {
    const { tipo, estado, pagina = 1, limite = 20 } = req.query;
    const result = await PQRS.listar({ tipo, estado, pagina: parseInt(pagina), limite: parseInt(limite) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar PQRS.' });
  }
}

async function misPQRS(req, res) {
  try {
    const pqrs = await PQRS.listarPorUsuario(req.usuario.id);
    res.json(pqrs);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener PQRS.' });
  }
}

async function obtener(req, res) {
  try {
    const pqrs = await PQRS.buscarPorId(req.params.id);
    if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada.' });
    // Solo admin o el propietario puede ver
    if (req.usuario && req.usuario.rol !== 'admin' && pqrs.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }
    res.json(pqrs);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener PQRS.' });
  }
}

async function buscarPorRadicado(req, res) {
  try {
    const pqrs = await PQRS.buscarPorRadicado(req.params.radicado);
    if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada con ese número de radicado.' });
    // Ocultar datos sensibles en consulta pública
    const { descripcion, respuesta, asunto, tipo, estado, numero_radicado, nombre_solicitante, fecha_respuesta, created_at, updated_at } = pqrs;
    res.json({ numero_radicado, nombre_solicitante, tipo, asunto, estado, descripcion, respuesta, fecha_respuesta, created_at, updated_at });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar PQRS.' });
  }
}

async function responder(req, res) {
  try {
    const { estado, respuesta } = req.body;
    const pqrs = await PQRS.buscarPorId(req.params.id);
    if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada.' });
    await PQRS.actualizarEstado(req.params.id, estado, respuesta, req.usuario.id);
    res.json({ message: 'PQRS actualizada exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar PQRS.' });
  }
}

module.exports = { crear, listar, misPQRS, obtener, buscarPorRadicado, responder };
