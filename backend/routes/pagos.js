const express = require('express');
const router = express.Router();

// importa solo la función para crear suscripciones
const { crearSuscripcionDinamica } = require('../controllers/mercadoPagoControllers');
const { ordenGratuita } = require('../controllers/ordenGratuitaController');



/**
 * ruta POST para crear una suscripción.
 * recibe en el body clienteEmail y orderData.
 * responde con init_point para redirigir a Mercado Pago.
 */
router.post('/suscripcion', crearSuscripcionDinamica);
router.post('/orden-gratis', ordenGratuita);


module.exports = router;
