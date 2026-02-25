// backend/routes/pqrs.js
const router = require('express').Router();
const ctrl = require('../controllers/pqrsController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Pública: crear y consultar por radicado
router.post('/', (req, res, next) => {
  // El usuario puede estar autenticado o no
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) { /* sin usuario */ }
  }
  next();
}, ctrl.crear);

router.get('/radicado/:radicado', ctrl.buscarPorRadicado);

// Autenticado
router.get('/mis-pqrs', verificarToken, ctrl.misPQRS);
router.get('/:id', verificarToken, ctrl.obtener);

// Admin
router.get('/', verificarToken, soloAdmin, ctrl.listar);
router.put('/:id/responder', verificarToken, soloAdmin, ctrl.responder);

module.exports = router;
