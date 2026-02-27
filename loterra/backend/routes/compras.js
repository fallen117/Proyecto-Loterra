// backend/routes/compras.js
const router = require('express').Router();
const ctrl = require('../controllers/compraController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Cliente autenticado
router.get('/mis-compras', verificarToken, ctrl.listarMias);
router.get('/mi-historial-pagos', verificarToken, ctrl.historialPagos);
router.get('/solicitudes/mias', verificarToken, ctrl.misSolicitudes);
router.post('/solicitudes', verificarToken, ctrl.crearSolicitud);

// Admin
router.get('/', verificarToken, soloAdmin, ctrl.listarTodas);
router.post('/', verificarToken, soloAdmin, ctrl.crear);

// Admin y cliente autenticado (validación de acceso interna en el controller)
router.post('/pagos', verificarToken, ctrl.registrarPago);

// Ambos con validación interna
router.get('/:id', verificarToken, ctrl.obtener);

module.exports = router;