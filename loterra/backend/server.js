// backend/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ── Trust proxy (necesario para Railway y otros proxies) ───
app.set('trust proxy', 1);

// ── Seguridad ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// ── Rate limiting ──────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Demasiadas solicitudes. Intenta en unos minutos.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Demasiados intentos. Espera 15 minutos.' } });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/registrar', authLimiter);

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Archivos estáticos (frontend) ──────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── Rutas API ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lotes', require('./routes/lotes'));
app.use('/api/compras', require('./routes/compras'));
app.use('/api/pqrs', require('./routes/pqrs'));
app.use('/api/admin', require('./routes/admin'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── SPA fallback ───────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Ruta no encontrada' });
  } else if (path.extname(req.path) !== '') {
    res.status(404).json({ error: 'Archivo no encontrado' });
  } else {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  }
});

// ── Manejo de errores global ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ── Iniciar servidor ───────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Loterra corriendo en http://localhost:${PORT}`);
  console.log(`📁 API disponible en http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend en http://localhost:${PORT}\n`);
});

module.exports = app;