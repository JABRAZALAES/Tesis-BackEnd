const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../../middleware/verifyToken');

router.post('/recuperar-contrasena', authController.recuperarContrasena);
router.post('/cambiar-contrasena', verifyToken, authController.cambiarContrasena);

module.exports = router;