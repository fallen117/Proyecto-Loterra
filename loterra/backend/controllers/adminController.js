// backend/controllers/adminController.js
const Usuario = require('../models/Usuario');
const db = require('../config/database');

async function listarUsuarios(req, res) {
  try {
    const { pagina = 1, limite = 20 } = req.query;
    const result = await Usuario.listar(parseInt(pagina), parseInt(limite));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
}

async function obtenerUsuario(req, res) {
  try {
    const usuario = await Usuario.buscarPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario.' });
  }
}

async function actualizarUsuario(req, res) {
  try {
    await Usuario.actualizar(req.params.id, req.body);
    res.json({ message: 'Usuario actualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
}

async function dashboard(req, res) {
  try {
    const [[lotesStats]] = await db.execute(
      `SELECT
        SUM(CASE WHEN estado='disponible' THEN 1 ELSE 0 END) AS disponibles,
        SUM(CASE WHEN estado='reservado' THEN 1 ELSE 0 END) AS reservados,
        SUM(CASE WHEN estado='vendido' THEN 1 ELSE 0 END) AS vendidos,
        COUNT(*) AS total
       FROM lotes`
    );
    const [[comprasStats]] = await db.execute(
      `SELECT COUNT(*) AS total, SUM(valor_total) AS valor_total FROM compras WHERE estado != 'cancelada'`
    );
    const [[pagosStats]] = await db.execute(
      `SELECT COUNT(*) AS total_pagos, SUM(valor_pagado) AS total_recaudado FROM pagos`
    );
    const [[clientesStats]] = await db.execute(
      `SELECT COUNT(*) AS total FROM usuarios WHERE rol='cliente'`
    );
    const [[pqrsStats]] = await db.execute(
      `SELECT
        SUM(CASE WHEN estado='abierta' THEN 1 ELSE 0 END) AS abiertas,
        SUM(CASE WHEN estado='en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
        COUNT(*) AS total
       FROM pqrs`
    );

    res.json({
      lotes: lotesStats,
      compras: comprasStats,
      pagos: pagosStats,
      clientes: clientesStats,
      pqrs: pqrsStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
}

module.exports = { listarUsuarios, obtenerUsuario, actualizarUsuario, dashboard };
