// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { verificarEstadoExplorador } = require('../controllers/publicController');

router.get('/estado-explorador', verificarEstadoExplorador);

module.exports = router;
