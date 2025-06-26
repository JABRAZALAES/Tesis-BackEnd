const usuariosRepository = require('../repositories/usuariosRepository');

const obtenerUsuarioActual = async (req, res) => {
  try {
    // Verificar que req.user existe
    if (!req.user) {
      console.error("Error: req.user es undefined");
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar que uid existe
    const uid = req.user.uid;
    if (!uid) {
      console.error("Error: UID no encontrado en req.user:", req.user);
      return res.status(400).json({ message: 'UID no encontrado en la información del usuario' });
    }

    console.log("Buscando usuario con UID:", uid);
    let usuario = await usuariosRepository.obtenerPorUID(uid);

    // Si no existe, créalo
    if (!usuario) {
      console.log("Usuario no encontrado, creando uno nuevo");
      const nuevoUsuario = {
        uid,
        email: req.user.email || '',
        nombre: req.user.name || '',
      };
      console.log("Datos para nuevo usuario:", nuevoUsuario);
      usuario = await usuariosRepository.crearUsuario(nuevoUsuario);
    }

    res.json(usuario);
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ 
      message: 'Error al obtener o crear el usuario actual', 
      error: error.message 
    });
  }
};

module.exports = {
  obtenerUsuarioActual,
  
};