const express = require('express');
const router = express.Router();
const {
  registrarVentaManual,
  obtenerVentas,
  borrarTodasLasVentas
} = require('../controllers/adminController');
const { exportarVentasAGoogleSheets } = require('../controllers/exportController');

// Obtener todas las ventas
router.get('/ventas', obtenerVentas);

// Registrar una venta manual desde el panel
router.post('/venta-manual', registrarVentaManual);

// Exportar ventas a Google Sheets
router.post('/exportar-a-sheets', exportarVentasAGoogleSheets);

// Vaciar todas las ventas de la base de datos
router.delete('/ventas', borrarTodasLasVentas);

module.exports = router;
