// backend/models/Usuario.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
  static async crear(datos) {
    const { nombre, apellido, email, password, telefono, documento, tipo_documento } = datos;
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      `INSERT INTO usuarios (nombre, apellido, email, password, telefono, documento, tipo_documento, token_verificacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, email, hash, telefono || null, documento || null, tipo_documento || 'CC', datos.token_verificacion || null]
    );
    return result.insertId;
  }

  static async buscarPorEmail(email) {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async buscarPorId(id) {
    const [rows] = await db.execute(
      'SELECT id, nombre, apellido, email, telefono, documento, tipo_documento, rol, activo, email_verificado, created_at FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async buscarPorToken(token, tipo = 'verificacion') {
    const campo = tipo === 'recuperacion' ? 'token_recuperacion' : 'token_verificacion';
    const [rows] = await db.execute(`SELECT * FROM usuarios WHERE ${campo} = ?`, [token]);
    return rows[0] || null;
  }

  static async verificarEmail(id) {
    await db.execute(
      'UPDATE usuarios SET email_verificado = TRUE, token_verificacion = NULL WHERE id = ?', [id]
    );
  }

  static async setTokenRecuperacion(id, token, expira) {
    await db.execute(
      'UPDATE usuarios SET token_recuperacion = ?, token_recuperacion_expira = ? WHERE id = ?',
      [token, expira, id]
    );
  }

  static async actualizarPassword(id, password) {
    const hash = await bcrypt.hash(password, 12);
    await db.execute(
      'UPDATE usuarios SET password = ?, token_recuperacion = NULL, token_recuperacion_expira = NULL WHERE id = ?',
      [hash, id]
    );
  }

  static async listar(pagina = 1, limite = 20) {
    const offset = (pagina - 1) * limite;
    const [rows] = await db.execute(
      'SELECT id, nombre, apellido, email, telefono, documento, rol, activo, email_verificado, created_at FROM usuarios ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limite, offset]
    );
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM usuarios');
    return { usuarios: rows, total, paginas: Math.ceil(total / limite) };
  }

  static async actualizar(id, datos) {
    const { nombre, apellido, telefono, documento, tipo_documento, activo } = datos;
    await db.execute(
      'UPDATE usuarios SET nombre=?, apellido=?, telefono=?, documento=?, tipo_documento=?, activo=?, updated_at=NOW() WHERE id=?',
      [nombre, apellido, telefono, documento, tipo_documento, activo, id]
    );
  }

  static async verificarPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
}

module.exports = Usuario;
