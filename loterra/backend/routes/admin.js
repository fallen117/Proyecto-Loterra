// backend/routes/admin.js
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.use(verificarToken, soloAdmin);

router.get('/dashboard', ctrl.dashboard);
router.get('/usuarios', ctrl.listarUsuarios);
router.get('/usuarios/:id', ctrl.obtenerUsuario);
router.put('/usuarios/:id', ctrl.actualizarUsuario);

module.exports = router;
