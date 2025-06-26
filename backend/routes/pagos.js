const express = require('express');
const router = express.Router();
const { 
  crearSuscripcionDinamica, 
  webhookSuscripcion 
} = require('../controllers/mercadoPagoControllers');

// Ruta para crear la suscripción dinámica
router.post('/suscripcion', crearSuscripcionDinamica);

// Ruta para recibir el webhook de Mercado Pago
router.post('/webhook', webhookSuscripcion); // Esta es la que Mercado Pago llamará automáticamente

module.exports = router;
