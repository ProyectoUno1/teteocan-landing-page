const express = require('express');
const router = express.Router();

const {
  crearSuscripcionStripe,
  webhookStripe,
  obtenerSuscripcionesCliente,
  cancelarSuscripcion,
  crearPagoUnicoStripe
} = require('../controllers/stripe/stripeControllers');


const webhookMiddleware = express.raw({ type: 'application/json' });

// Rutas para suscripciones
router.post('/crear-suscripcion', crearSuscripcionStripe);
router.post('/pago-unico', crearPagoUnicoStripe); 

// Webhook de Stripe
router.post('/webhook', webhookMiddleware, webhookStripe);

// Gestión de suscripciones
router.get('/suscripciones/:clienteEmail', obtenerSuscripcionesCliente);
router.delete('/suscripciones/:subscriptionId', cancelarSuscripcion);

module.exports = router;
