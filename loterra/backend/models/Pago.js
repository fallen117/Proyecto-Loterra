// backend/models/Pago.js
const db = require('../config/database');

class Pago {
  static async crear(datos) {
    const {
      numero_comprobante, compra_id, numero_cuota, valor_pagado,
      fecha_pago, metodo_pago, referencia_pago, saldo_anterior,
      saldo_despues, registrado_por, notas
    } = datos;
    const [result] = await db.execute(
      `INSERT INTO pagos (numero_comprobante, compra_id, numero_cuota, valor_pagado, fecha_pago, metodo_pago, referencia_pago, saldo_anterior, saldo_despues, registrado_por, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero_comprobante, compra_id, numero_cuota, valor_pagado, fecha_pago, metodo_pago, referencia_pago || null, saldo_anterior, saldo_despues, registrado_por || null, notas || null]
    );
    return result.insertId;
  }

  static async buscarPorId(id) {
    const [rows] = await db.execute(
      `SELECT p.*, c.numero_contrato, c.cliente_id, c.numero_cuotas,
              u.nombre, u.apellido, u.email, u.telefono, u.documento, u.tipo_documento,
              l.codigo AS lote_codigo, l.area AS lote_area, l.ubicacion AS lote_ubicacion
       FROM pagos p
       JOIN compras c ON p.compra_id = c.id
       JOIN usuarios u ON c.cliente_id = u.id
       JOIN lotes l ON c.lote_id = l.id
       WHERE p.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async listarPorCompra(compra_id) {
    const [rows] = await db.execute(
      `SELECT p.*, u.nombre AS registrado_nombre FROM pagos p
       LEFT JOIN usuarios u ON p.registrado_por = u.id
       WHERE p.compra_id = ? ORDER BY p.numero_cuota ASC`, [compra_id]
    );
    return rows;
  }

  static async listarPorCliente(cliente_id) {
    const [rows] = await db.execute(
      `SELECT p.*, c.numero_contrato, l.codigo AS lote_codigo, l.ubicacion AS lote_ubicacion
       FROM pagos p
       JOIN compras c ON p.compra_id = c.id
       JOIN lotes l ON c.lote_id = l.id
       WHERE c.cliente_id = ? ORDER BY p.fecha_pago DESC`, [cliente_id]
    );
    return rows;
  }

  static async marcarCorreoEnviado(id) {
    await db.execute('UPDATE pagos SET correo_enviado = TRUE WHERE id=?', [id]);
  }

  static async generarNumeroComprobante() {
    const year = new Date().getFullYear();
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM pagos WHERE YEAR(created_at) = ?', [year]
    );
    const num = String(total + 1).padStart(5, '0');
    return `CPG-${year}-${num}`;
  }
}

module.exports = Pago;
