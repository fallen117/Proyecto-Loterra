// backend/models/SolicitudCompra.js
const db = require('../config/database');

class SolicitudCompra {

  static async crear(datos) {
    const { usuario_id, lote_id, numero_cuotas_solicitadas, mensaje } = datos;
    const [result] = await db.execute(
      `INSERT INTO solicitudes_compra (usuario_id, lote_id, numero_cuotas_solicitadas, mensaje)
       VALUES (?, ?, ?, ?)`,
      [usuario_id, lote_id, numero_cuotas_solicitadas || 12, mensaje || null]
    );
    return result.insertId;
  }

  static async listarTodas(pagina = 1, limite = 20) {
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const limiteInt = parseInt(limite);
    const [rows] = await db.query(
      `SELECT s.*,
              u.nombre, u.apellido, u.email, u.telefono, u.documento,
              l.codigo AS lote_codigo, l.area AS lote_area,
              l.ubicacion AS lote_ubicacion, l.valor AS lote_valor
       FROM solicitudes_compra s
       JOIN usuarios u ON s.usuario_id = u.id
       JOIN lotes l ON s.lote_id = l.id
       ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [limiteInt, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM solicitudes_compra');
    return { solicitudes: rows, total, paginas: Math.ceil(total / limiteInt) };
  }

  static async listarPorUsuario(usuario_id) {
    const [rows] = await db.execute(
      `SELECT s.*,
              l.codigo AS lote_codigo, l.area AS lote_area,
              l.ubicacion AS lote_ubicacion, l.valor AS lote_valor
       FROM solicitudes_compra s
       JOIN lotes l ON s.lote_id = l.id
       WHERE s.usuario_id = ?
       ORDER BY s.created_at DESC`,
      [usuario_id]
    );
    return rows;
  }

  static async buscarPorId(id) {
    const [rows] = await db.execute(
      `SELECT s.*,
              u.nombre, u.apellido, u.email, u.telefono, u.documento, u.tipo_documento,
              l.codigo AS lote_codigo, l.area AS lote_area,
              l.ubicacion AS lote_ubicacion, l.valor AS lote_valor
       FROM solicitudes_compra s
       JOIN usuarios u ON s.usuario_id = u.id
       JOIN lotes l ON s.lote_id = l.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async aprobar(id, { numero_cuotas_aprobadas, fecha_inicio_pagos, notas_admin, compra_id }) {
    await db.execute(
      `UPDATE solicitudes_compra
       SET estado = 'aprobada',
           numero_cuotas_aprobadas = ?,
           fecha_inicio_pagos = ?,
           notas_admin = ?,
           compra_id = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [numero_cuotas_aprobadas, fecha_inicio_pagos, notas_admin || null, compra_id, id]
    );
  }

  static async rechazar(id, notas_admin) {
    await db.execute(
      `UPDATE solicitudes_compra
       SET estado = 'rechazada',
           notas_admin = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [notas_admin || null, id]
    );
  }

  static async tieneSolicitudPendiente(usuario_id, lote_id) {
    const [rows] = await db.execute(
      `SELECT id FROM solicitudes_compra
       WHERE usuario_id = ? AND lote_id = ? AND estado = 'pendiente'`,
      [usuario_id, lote_id]
    );
    return rows.length > 0;
  }
}

module.exports = SolicitudCompra;
