const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../authController/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { registerAdmin } = require('../authController/authController');
const { forgotPassword } = require('../authController/authController');
const { resetPassword } = require('../authController/authController');

// Ruta de login, registro, recuperación y restablecimiento de contraseña
// Estas rutas manejan las operaciones de autenticación del administrador
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Ruta protegida de ejemplo
router.get('/verify', verifyToken, (req, res) => {
  res.json({ message: 'Acceso autorizado', admin: req.admin });
});

module.exports = router;