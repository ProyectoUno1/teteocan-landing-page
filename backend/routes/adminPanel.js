// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { registrarVentaManual, obtenerVentas } = require('../controllers/adminController');

// Ruta POST para registrar venta manual desde el panel
router.post('/venta-manual', registrarVentaManual);

// Ruta GET para obtener todas las ventas
router.get('/ventas', obtenerVentas);

module.exports = router;
