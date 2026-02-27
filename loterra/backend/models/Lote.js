// backend/models/Lote.js
const db = require('../config/database');

class Lote {
  static async listar({ estado, etapa_id, pagina = 1, limite = 20 } = {}) {
    let where = [];
    let params = [];
    if (estado) { where.push('l.estado = ?'); params.push(estado); }
    if (etapa_id) { where.push('l.etapa_id = ?'); params.push(etapa_id); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const limiteInt = parseInt(limite);

    const [rows] = await db.query(
      `SELECT l.*, e.nombre AS etapa_nombre FROM lotes l
       LEFT JOIN etapas_proyecto e ON l.etapa_id = e.id
       ${whereClause} ORDER BY l.codigo ASC LIMIT ? OFFSET ?`,
      [...params, limiteInt, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM lotes l ${whereClause}`, params
    );
    return { lotes: rows, total, paginas: Math.ceil(total / limite) };
  }

  static async buscarPorId(id) {
    const [rows] = await db.execute(
      `SELECT l.*, e.nombre AS etapa_nombre FROM lotes l
       LEFT JOIN etapas_proyecto e ON l.etapa_id = e.id WHERE l.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async crear(datos) {
    const { codigo, area, ubicacion, manzana, numero_lote, valor, estado, etapa_id, descripcion, imagen_url } = datos;
    const [result] = await db.execute(
      `INSERT INTO lotes (codigo, area, ubicacion, manzana, numero_lote, valor, estado, etapa_id, descripcion, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, area, ubicacion, manzana || null, numero_lote || null, valor, estado || 'disponible', etapa_id || null, descripcion || null, imagen_url || null]
    );
    return result.insertId;
  }

  // static async actualizar(id, datos) {
  //   const { codigo, area, ubicacion, manzana, numero_lote, valor, estado, etapa_id, descripcion, imagen_url } = datos;
  //   await db.execute(
  //     `UPDATE lotes SET codigo=?, area=?, ubicacion=?, manzana=?, numero_lote=?, valor=?, estado=?, etapa_id=?, descripcion=?, imagen_url=?, updated_at=NOW() WHERE id=?`,
  //     [codigo, area, ubicacion, manzana, numero_lote, valor, estado, etapa_id, descripcion, imagen_url, id]
  //   );
  // }
  static async actualizar(id, datos) {
  const { codigo, area, ubicacion, manzana, numero_lote, valor, estado, etapa_id, descripcion, imagen_url } = datos;
  await db.execute(
    `UPDATE lotes SET codigo=?, area=?, ubicacion=?, manzana=?, numero_lote=?, valor=?, estado=?, etapa_id=?, descripcion=?, imagen_url=?, updated_at=NOW() WHERE id=?`,
    [codigo, area, ubicacion, manzana || null, numero_lote || null, valor, estado, etapa_id || null, descripcion || null, imagen_url || null, id]
  );
}

  static async cambiarEstado(id, estado) {
    await db.execute('UPDATE lotes SET estado=?, updated_at=NOW() WHERE id=?', [estado, id]);
  }

  static async eliminar(id) {
    await db.execute('DELETE FROM lotes WHERE id=?', [id]);
  }

  static async estadisticas() {
    const [rows] = await db.execute(
      `SELECT estado, COUNT(*) as total, SUM(valor) as valor_total FROM lotes GROUP BY estado`
    );
    return rows;
  }
}

module.exports = Lote;