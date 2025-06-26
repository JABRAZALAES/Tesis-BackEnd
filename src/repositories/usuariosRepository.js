const { dbGestionNovedades } = require('../config/db');

// Buscar usuario por correo
const obtenerPorCorreo = async (correo) => {
  try {
    const [rows] = await dbGestionNovedades.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    return rows[0];
  } catch (error) {
    console.error("Error en obtenerPorCorreo:", error);
    throw error;
  }
};

// Buscar usuario por id
const obtenerPorId = async (id) => {
  try {
    const [rows] = await dbGestionNovedades.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error("Error en obtenerPorId:", error);
    throw error;
  }
};

// Crear usuario nuevo
const crearUsuario = async ({ correo, nombre, contrasena, rol = 'normal' }) => {
  try {
    const [result] = await dbGestionNovedades.query(
      'INSERT INTO usuarios (correo, nombre, contrasena, rol) VALUES (?, ?, ?, ?)',
      [correo, nombre, contrasena, rol]
    );
    return { id: result.insertId, correo, nombre, rol };
  } catch (error) {
    console.error("Error en crearUsuario:", error);
    throw error;
  }
};

module.exports = {
  obtenerPorCorreo,
  obtenerPorId,
  crearUsuario,
};