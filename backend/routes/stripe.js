const express = require('express');
const router = express.Router();
const {
  crearSuscripcionStripe,
  crearPagoUnicoStripe,
  webhookStripe,
  obtenerSuscripcionesCliente,
  cancelarSuscripcion,obtenerExtrasPendientes,
  marcarExtrasCompletados,marcarExtrasCancelados
} = require('../controllers/stripe/stripeControllers');

// Middleware para webhook (raw body)
const webhookMiddleware = express.raw({ type: 'application/json' });

// Rutas para suscripciones
router.post('/crear-suscripcion', crearSuscripcionStripe);
router.post('/pago-unico', crearPagoUnicoStripe);

// Webhook de Stripe (debe usar raw body)
router.post('/webhook', webhookMiddleware, webhookStripe);

// Gestión de suscripciones
router.get('/suscripciones/:clienteEmail', obtenerSuscripcionesCliente);
router.delete('/suscripciones/:subscriptionId', cancelarSuscripcion);

router.get('/extras-pendientes/:sessionId', obtenerExtrasPendientes);
router.post('/extras/marcar-completado', marcarExtrasCompletados);
router.post('/extras/cancelar', marcarExtrasCancelados);


module.exports = router;