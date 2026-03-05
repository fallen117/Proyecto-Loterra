// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Usuario = require('../models/Usuario');
const { enviarVerificacion, enviarRecuperacion } = require('../utils/email');

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * CU-01: Registro de usuario
 */
async function registrar(req, res) {
  try {
    const { nombre, apellido, email, password, telefono, documento, tipo_documento } = req.body;

    const existe = await Usuario.buscarPorEmail(email);
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado.' });

    const token = uuidv4();
    const id = await Usuario.crear({ nombre, apellido, email, password, telefono, documento, tipo_documento, token_verificacion: token });

    // Responder inmediatamente sin esperar el correo
    res.status(201).json({ message: 'Usuario registrado exitosamente. Verifica tu correo electrónico.' });

    // Enviar correo en segundo plano (no bloquea la respuesta)
    enviarVerificacion(email, nombre, token).catch(e => console.warn('Email no enviado:', e.message));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error, el numero de documento ya está registrado.' });
  }
}

/**
 * Verificar email
 */
async function verificarEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token requerido.' });
    const usuario = await Usuario.buscarPorToken(token, 'verificacion');
    if (!usuario) return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
    await Usuario.verificarEmail(usuario.id);
    res.json({ message: 'Email verificado correctamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar email.' });
  }
}

/**
 * CU-02: Inicio de sesión
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.buscarPorEmail(email);

    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas.' });
    if (!usuario.activo) return res.status(401).json({ error: 'Cuenta desactivada. Contacta al administrador.' });

    const passwordOk = await Usuario.verificarPassword(password, usuario.password);
    if (!passwordOk) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const token = generarToken(usuario);
    res.json({
      token,
      usuario: {
        id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido,
        email: usuario.email, rol: usuario.rol, email_verificado: usuario.email_verificado
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
}

/**
 * Solicitar recuperación de contraseña
 */
async function solicitarRecuperacion(req, res) {
  try {
    const { email } = req.body;
    const usuario = await Usuario.buscarPorEmail(email);

    // Responder inmediatamente sin revelar si el correo existe o no
    res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });

    if (!usuario) return;

    // Enviar correo en segundo plano
    const token = uuidv4();
    const expira = new Date(Date.now() + 3600000); // 1 hora
    Usuario.setTokenRecuperacion(usuario.id, token, expira)
      .then(() => enviarRecuperacion(email, usuario.nombre, token))
      .catch(e => console.warn('Email recuperacion:', e.message));

  } catch (err) {
    res.status(500).json({ error: 'Error al procesar solicitud.' });
  }
}

/**
 * Restablecer contraseña
 */
async function restablecerPassword(req, res) {
  try {
    const { token, password } = req.body;
    const usuario = await Usuario.buscarPorToken(token, 'recuperacion');
    if (!usuario) return res.status(400).json({ error: 'Token inválido o expirado.' });

    const expirado = new Date(usuario.token_recuperacion_expira) < new Date();
    if (expirado) return res.status(400).json({ error: 'El enlace de recuperación ha expirado.' });

    await Usuario.actualizarPassword(usuario.id, password);
    res.json({ message: 'Contraseña restablecida correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al restablecer contraseña.' });
  }
}

/**
 * Obtener perfil del usuario autenticado
 */
async function perfil(req, res) {
  try {
    const usuario = await Usuario.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil.' });
  }
}

module.exports = { registrar, verificarEmail, login, solicitarRecuperacion, restablecerPassword, perfil };