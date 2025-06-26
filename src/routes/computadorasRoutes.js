const express = require('express');
const router = express.Router();
const { obtenerComputadorasPorLaboratorio } = require('../controllers/computadorasController');

router.get('/', obtenerComputadorasPorLaboratorio);

module.exports = router;