const express = require('express');
const inconvenientesController = require('../controllers/inconvenientesController');
const router = express.Router();

router.get('/', inconvenientesController.obtenerInconvenientes);

module.exports = router;