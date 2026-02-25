// backend/models/PQRS.js
const db = require('../config/database');

class PQRS {
  static async crear(datos) {
    const { usuario_id, nombre_solicitante, email_solicitante, telefono_solicitante, tipo, asunto, descripcion, numero_radicado } = datos;
    const [result] = await db.execute(
      `INSERT INTO pqrs (numero_radicado, usuario_id, nombre_solicitante, email_solicitante, telefono_solicitante, tipo, asunto, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_radicado, usuario_id || null, nombre_solicitante, email_solicitante, telefono_solicitante || null, tipo, asunto, descripcion]
    );
    return result.insertId;
  }

  static async listar({ tipo, estado, pagina = 1, limite = 20 } = {}) {
    let where = [];
    let params = [];
    if (tipo) { where.push('tipo = ?'); params.push(tipo); }
    if (estado) { where.push('estado = ?'); params.push(estado); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (pagina - 1) * limite;
    const [rows] = await db.execute(
      `SELECT * FROM pqrs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );
    const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM pqrs ${whereClause}`, params);
    return { pqrs: rows, total, paginas: Math.ceil(total / limite) };
  }

  static async listarPorUsuario(usuario_id) {
    const [rows] = await db.execute(
      'SELECT * FROM pqrs WHERE usuario_id = ? ORDER BY created_at DESC', [usuario_id]
    );
    return rows;
  }

  static async buscarPorId(id) {
    const [rows] = await db.execute('SELECT * FROM pqrs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async buscarPorRadicado(numero) {
    const [rows] = await db.execute('SELECT * FROM pqrs WHERE numero_radicado = ?', [numero]);
    return rows[0] || null;
  }

  static async actualizarEstado(id, estado, respuesta, respondido_por) {
    await db.execute(
      'UPDATE pqrs SET estado=?, respuesta=?, fecha_respuesta=NOW(), respondido_por=?, updated_at=NOW() WHERE id=?',
      [estado, respuesta || null, respondido_por || null, id]
    );
  }

  static async generarNumeroRadicado() {
    const fecha = new Date();
    const stamp = `${fecha.getFullYear()}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}`;
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM pqrs WHERE DATE(created_at) = CURDATE()');
    const num = String(total + 1).padStart(3, '0');
    return `PQRS-${stamp}-${num}`;
  }
}

module.exports = PQRS;
