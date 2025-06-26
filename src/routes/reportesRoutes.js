const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Endpoints de reportes principales
router.get('/incidentes-por-laboratorio', reportesController.incidentesPorLaboratorio);
router.get('/incidentes-por-estado', reportesController.incidentesPorEstado);
router.get('/incidentes-por-periodo', reportesController.incidentesPorPeriodo);
router.get('/incidentes-por-inconveniente', reportesController.incidentesPorInconveniente);
router.get('/objetos-perdidos-por-laboratorio', reportesController.objetosPerdidosPorLaboratorio);
router.get('/objetos-perdidos-por-estado', reportesController.objetosPerdidosPorEstado);

module.exports = router;