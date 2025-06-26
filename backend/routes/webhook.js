const express = require('express');
const router = express.Router();
const { webhookSuscripcion } = require('../controllers/mercadoPagoControllers');

router.post('/', webhookSuscripcion);

console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));
console.log('Buscando orden con ID:', preapproval_id);


module.exports = router;
