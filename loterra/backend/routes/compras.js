// backend/routes/compras.js
const router = require('express').Router();
const ctrl = require('../controllers/compraController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Cliente autenticado
router.get('/mis-compras', verificarToken, ctrl.listarMias);
router.get('/mi-historial-pagos', verificarToken, ctrl.historialPagos);

// Admin
router.get('/', verificarToken, soloAdmin, ctrl.listarTodas);
router.post('/', verificarToken, soloAdmin, ctrl.crear);
router.post('/pagos', verificarToken, soloAdmin, ctrl.registrarPago);

// Ambos con validación interna
router.get('/:id', verificarToken, ctrl.obtener);

module.exports = router;
