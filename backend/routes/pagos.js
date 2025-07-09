
const express = require('express');
const router = express.Router();

const { ordenGratuita } = require('../controllers/ordenGratuitaController');
const { obtenerVentas } = require('../controllers/adminController');
const { registrarVentaManual } = require('../controllers/adminController');  

// Rutas de pago y ventas (MercadoPago removido - ahora solo Stripe)
router.post('/orden-gratis', ordenGratuita);
router.get('/ventas', obtenerVentas);
router.post('/venta-manual', registrarVentaManual);

module.exports = router;
