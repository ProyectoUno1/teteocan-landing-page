const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../authController/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Ruta de login
router.post('/login', loginAdmin);

// Ruta protegida de ejemplo
router.get('/verify', verifyToken, (req, res) => {
  res.json({ message: 'Acceso autorizado', admin: req.admin });
});

module.exports = router;