const express = require('express');
const router = express.Router();


const { 
  crearSuscripcionDinamica, 
  webhookSuscripcion 
} = require('../controllers/mercadoPagoControllers');

console.log('crearSuscripcionDinamica:', crearSuscripcionDinamica);
console.log('webhookSuscripcion:', webhookSuscripcion);

// Ruta para crear la suscripción dinámica
router.post('/suscripcion', crearSuscripcionDinamica);


module.exports = router;
