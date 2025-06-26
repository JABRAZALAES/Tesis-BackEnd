const { dbGestionNovedades } = require('../config/db');

const obtenerUsuariosBD = () => {
  return dbGestionNovedades.query('SELECT * FROM usuarios ORDER BY nombre ASC');
};

const crearUsuarioBD = (correo, nombre, contrasena, rol = 'normal') => {
  return dbGestionNovedades.query(
    'INSERT INTO usuarios (correo, nombre, contrasena, rol) VALUES (?, ?, ?, ?)',
    [correo, nombre, contrasena, rol]
  );
};

module.exports = { obtenerUsuariosBD, crearUsuarioBD };