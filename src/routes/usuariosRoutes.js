const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const usuariosController = require('../controllers/usuarios.controller');
const authController = require('../controllers/auth.controller');

// Ruta para obtener el usuario actual (protegida)
router.get('/me', verifyToken, usuariosController.obtenerUsuarioActual);

// Ruta para registrar usuario
router.post('/register', authController.registrarUsuario);
// Ruta para login
router.post('/login', authController.loginUsuario);

module.exports = router;