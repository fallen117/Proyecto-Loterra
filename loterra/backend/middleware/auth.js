// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware: Verificar token JWT
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
}

/**
 * Middleware: Solo administradores
 */
function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
}

/**
 * Middleware: Verificar que el usuario accede a sus propios recursos o es admin
 */
function propioUsuarioOAdmin(req, res, next) {
  const idParam = parseInt(req.params.userId || req.params.id);
  if (req.usuario.rol === 'admin' || req.usuario.id === idParam) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado' });
}

module.exports = { verificarToken, soloAdmin, propioUsuarioOAdmin };
