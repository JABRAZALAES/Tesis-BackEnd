const express = require('express');
const router = express.Router();
const { obtenerLaboratorios } = require('../controllers/laboratoriosController');

router.get('/', obtenerLaboratorios);

module.exports = router;