// backend/models/Compra.js
const db = require('../config/database');

class Compra {
  static async crear(datos) {
    const {
      numero_contrato, cliente_id, lote_id, valor_total,
      valor_cuota, numero_cuotas, fecha_compra, fecha_inicio_pagos, notas
    } = datos;
    const [result] = await db.execute(
      `INSERT INTO compras (numero_contrato, cliente_id, lote_id, valor_total, valor_cuota, numero_cuotas, saldo_pendiente, fecha_compra, fecha_inicio_pagos, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_contrato, cliente_id, lote_id, valor_total, valor_cuota, numero_cuotas, valor_total, fecha_compra, fecha_inicio_pagos, notas || null]
    );
    return result.insertId;
  }

  static async buscarPorId(id) {
    const [rows] = await db.execute(
      `SELECT c.*, u.nombre, u.apellido, u.email, u.telefono, u.documento, u.tipo_documento,
              l.codigo AS lote_codigo, l.area AS lote_area, l.ubicacion AS lote_ubicacion, l.valor AS lote_valor
       FROM compras c
       JOIN usuarios u ON c.cliente_id = u.id
       JOIN lotes l ON c.lote_id = l.id
       WHERE c.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async listarPorCliente(cliente_id) {
    const [rows] = await db.execute(
      `SELECT c.*, l.codigo AS lote_codigo, l.area AS lote_area, l.ubicacion AS lote_ubicacion
       FROM compras c JOIN lotes l ON c.lote_id = l.id
       WHERE c.cliente_id = ? ORDER BY c.created_at DESC`, [cliente_id]
    );
    return rows;
  }

  static async listarTodas(pagina = 1, limite = 20) {
    const offset = (pagina - 1) * limite;
    const [rows] = await db.execute(
      `SELECT c.*, u.nombre, u.apellido, u.email, l.codigo AS lote_codigo, l.ubicacion AS lote_ubicacion
       FROM compras c JOIN usuarios u ON c.cliente_id = u.id JOIN lotes l ON c.lote_id = l.id
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`, [limite, offset]
    );
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM compras');
    return { compras: rows, total, paginas: Math.ceil(total / limite) };
  }

  static async actualizarSaldo(id, saldoDespues, cuotasPagadas) {
    const estado = saldoDespues <= 0 ? 'completada' : 'activa';
    await db.execute(
      'UPDATE compras SET saldo_pendiente=?, cuotas_pagadas=?, estado=?, updated_at=NOW() WHERE id=?',
      [Math.max(0, saldoDespues), cuotasPagadas, estado, id]
    );
  }

  static async generarNumeroContrato() {
    const year = new Date().getFullYear();
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM compras WHERE YEAR(created_at) = ?', [year]
    );
    const num = String(total + 1).padStart(4, '0');
    return `CTR-${year}-${num}`;
  }
}

module.exports = Compra;
