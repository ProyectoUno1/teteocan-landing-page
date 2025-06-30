const express = require('express');
const router = express.Router();

// importa la función que maneja las notificaciones webhook de Mercado Pago
const { webhookSuscripcion } = require('../controllers/webhookController');

/**
 * ruta POST para recibir notificaciones webhook desde Mercado Pago.
 * Procesa eventos de pago o autorización y envía correos.
 */
router.post('/', webhookSuscripcion);

module.exports = router;