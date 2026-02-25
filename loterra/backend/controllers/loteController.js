// backend/controllers/loteController.js
const Lote = require('../models/Lote');
const db = require('../config/database');

async function listar(req, res) {
  try {
    const { estado, etapa_id, pagina = 1, limite = 20 } = req.query;
    const result = await Lote.listar({ estado, etapa_id: etapa_id ? parseInt(etapa_id) : null, pagina: parseInt(pagina), limite: parseInt(limite) });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar lotes.' });
  }
}

async function obtener(req, res) {
  try {
    const lote = await Lote.buscarPorId(req.params.id);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
    res.json(lote);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener lote.' });
  }
}

async function crear(req, res) {
  try {
    const id = await Lote.crear(req.body);
    res.status(201).json({ message: 'Lote creado exitosamente.', id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El código del lote ya existe.' });
    console.error(err);
    res.status(500).json({ error: 'Error al crear lote.' });
  }
}

async function actualizar(req, res) {
  try {
    const lote = await Lote.buscarPorId(req.params.id);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
    await Lote.actualizar(req.params.id, req.body);
    res.json({ message: 'Lote actualizado exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar lote.' });
  }
}

async function eliminar(req, res) {
  try {
    const lote = await Lote.buscarPorId(req.params.id);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
    if (lote.estado !== 'disponible') return res.status(400).json({ error: 'No se puede eliminar un lote reservado o vendido.' });
    await Lote.eliminar(req.params.id);
    res.json({ message: 'Lote eliminado exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar lote.' });
  }
}

async function estadisticas(req, res) {
  try {
    const stats = await Lote.estadisticas();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
}

async function etapas(req, res) {
  try {
    const [rows] = await db.execute('SELECT * FROM etapas_proyecto ORDER BY orden');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener etapas.' });
  }
}

async function planos(req, res) {
  try {
    const [rows] = await db.execute('SELECT * FROM planos WHERE activo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener planos.' });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, estadisticas, etapas, planos };
