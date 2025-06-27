const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuariosRepository');

// Registro de usuario
const registrarUsuario = async (req, res) => {
  const { correo, nombre, contrasena, rol } = req.body;
  if (!correo.endsWith('@espe.edu.ec')) {
    return res.status(400).json({ message: 'Solo se permiten correos @espe.edu.ec' });
  }
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    // Usa el rol recibido o 'normal' por defecto
    const usuario = await usuariosRepository.crearUsuario({ correo, nombre, contrasena: hash, rol: rol || 'normal' });

    // Genera el token igual que en login
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(201).json({
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        rol: usuario.rol
      },
      token // <-- Devuelve el token aquí
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }
    res.status(400).json({ message: 'Error al registrar usuario', error: e.message });
  }
};
// Login de usuario
const loginUsuario = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const usuario = await usuariosRepository.obtenerPorCorreo(correo);

    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.contrasena) {
      return res.status(500).json({ message: 'El usuario no tiene contraseña registrada' });
    }

    const valido = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!valido) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre, rol: usuario.rol }
    });

  } catch (error) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};


module.exports = {
  registrarUsuario,
  loginUsuario,
};