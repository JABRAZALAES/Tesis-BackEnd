const express = require('express');
const objetosPerdidosController = require('../controllers/objetosPerdidosController');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../../middleware/verifyToken');


const router = express.Router();

// Configuración de multer para subir imágenes
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

// Crear objeto perdido (requiere autenticación)
router.post('/', verifyToken, upload.single('urlFoto'), objetosPerdidosController.crearObjetoPerdido);

// Obtener todos los objetos perdidos
router.get('/', objetosPerdidosController.obtenerObjetosPerdidos);

// Cambiar estado de objeto perdido (solo jefe/admin/tecnico, requiere autenticación)
router.patch('/:id/estado', verifyToken, objetosPerdidosController.actualizarEstadoObjetoPerdido);
// Obtener objeto perdido por ID (requiere autenticación)

router.post('/:id/reclamar', verifyToken, objetosPerdidosController.reclamarObjetoPerdido);

router.delete('/:id', verifyToken, objetosPerdidosController.borrarObjetoPerdido);

module.exports = router;
