const express = require('express');
const incidentesController = require('../controllers/incidentesController');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../../middleware/verifyToken');

const router = express.Router();

// Configuración de multer específica para esta ruta
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Crear incidente (requiere autenticación)
router.post('/', verifyToken, upload.single('urlFoto'), incidentesController.crearIncidente);

// Obtener todos los incidentes
router.get('/', incidentesController.obtenerIncidentes);

// Obtener incidentes del usuario autenticado
router.get('/mios', verifyToken, incidentesController.obtenerMisIncidentes);
// Actualizar incidente (requiere autenticación)
router.patch('/:id/estado', verifyToken, incidentesController.actualizarEstadoIncidente);
// ...existing code...

// Borrar incidente (requiere autenticación)
router.delete('/:id', verifyToken, incidentesController.borrarIncidente);

// ...existing code...

module.exports = router;