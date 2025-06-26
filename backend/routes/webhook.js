const express = require('express');
const router = express.Router();
const { webhookSuscripcion } = require('../controllers/mercadoPagoControllers');

router.post('/', webhookSuscripcion);


module.exports = router;
