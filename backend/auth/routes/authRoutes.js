const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../authController/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { registerAdmin } = require('../authController/authController');

// Ruta de login
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);

// Ruta protegida de ejemplo
router.get('/verify', verifyToken, (req, res) => {
  res.json({ message: 'Acceso autorizado', admin: req.admin });
});

module.exports = router;