// backend/routes/auth.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/registrar', [
  body('nombre').notEmpty().trim(),
  body('apellido').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], validate, ctrl.registrar);

router.get('/verificar-email', ctrl.verificarEmail);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], validate, ctrl.login);

router.post('/recuperar-password', [
  body('email').isEmail().normalizeEmail()
], validate, ctrl.solicitarRecuperacion);

router.post('/restablecer-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], validate, ctrl.restablecerPassword);

router.get('/perfil', verificarToken, ctrl.perfil);

module.exports = router;
