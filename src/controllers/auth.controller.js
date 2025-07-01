const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuariosRepository');
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const { dbGestionNovedades } = require('../config/db');




const recuperarContrasena = async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ message: 'Correo requerido' });

  const usuario = await usuariosRepository.obtenerPorCorreo(correo);
  if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

  // Genera una contraseña temporal
  const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 caracteres
  const hash = await bcrypt.hash(tempPassword, 10);

  // Actualiza la contraseña y marca que requiere cambio
  await dbGestionNovedades.query(
    'UPDATE usuarios SET contrasena = ?, requiere_cambio_contrasena = 1 WHERE id = ?',
    [hash, usuario.id]
  );

  // Lee la plantilla HTML y reemplaza el marcador
  const templatePath = path.join(__dirname, '../templates/plantillaCorreo.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace('{{tempPassword}}', tempPassword);

  // Envía la contraseña temporal por correo con HTML
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: correo,
    subject: 'Recuperación de contraseña',
    html: html
  });

  res.json({ message: 'Contraseña temporal enviada al correo.' });
};

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

    // Aquí agregas el flag requiereCambioContrasena
    res.json({
      token,
      usuario: { 
        id: usuario.id, 
        correo: usuario.correo, 
        nombre: usuario.nombre, 
        rol: usuario.rol 
      },
      requiereCambioContrasena: usuario.requiere_cambio_contrasena === 1 // o true/false según tu BD
    });

  } catch (error) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
// Cambiar contraseña (protegido)
const cambiarContrasena = async (req, res) => {
  const { nuevaContrasena } = req.body;
  const usuarioId = req.user.id; // El id del usuario autenticado

  if (!nuevaContrasena) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida' });
  }

  const hash = await bcrypt.hash(nuevaContrasena, 10);
  await usuariosRepository.actualizarContrasena(usuarioId, hash);

  res.json({ message: 'Contraseña actualizada correctamente' });
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  registrarUsuario,
  recuperarContrasena,
  cambiarContrasena,
};  