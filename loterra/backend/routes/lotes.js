// backend/routes/lotes.js
const router = require('express').Router();
const ctrl = require('../controllers/loteController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Públicas
router.get('/', ctrl.listar);
router.get('/etapas', ctrl.etapas);
router.get('/planos', ctrl.planos);
router.get('/estadisticas', verificarToken, soloAdmin, ctrl.estadisticas);
router.get('/:id', ctrl.obtener);

// Solo admin
router.post('/', verificarToken, soloAdmin, ctrl.crear);
router.put('/:id', verificarToken, soloAdmin, ctrl.actualizar);
router.delete('/:id', verificarToken, soloAdmin, ctrl.eliminar);

module.exports = router;
