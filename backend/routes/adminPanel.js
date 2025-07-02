const express = require('express');
const router = express.Router();
const {
  registrarVentaManual,
  obtenerVentas,
  borrarTodasLasVentas
} = require('../controllers/adminController');
const { exportarVentasAExcel } = require('../controllers/exportController');

// Obtener todas las ventas
router.get('/ventas', obtenerVentas);

// Registrar una venta manual desde el panel
router.post('/venta-manual', registrarVentaManual);

// Exportar ventas a excel
router.get('/exportar-a-excel', exportarVentasAExcel);

// Vaciar todas las ventas de la base de datos
router.delete('/ventas', borrarTodasLasVentas);

module.exports = router;
