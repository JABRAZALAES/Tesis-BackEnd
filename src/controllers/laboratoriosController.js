// src/controllers/laboratoriosController.js
const { dbGestionNovedades } = require('../config/db');

const obtenerLaboratorios = async (req, res) => {
  try {
    const [rows] = await dbGestionNovedades.query('SELECT nombre FROM laboratorios');
    res.json(rows.map(row => row.nombre));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener laboratorios', error: error.message });
  }
};

module.exports = { obtenerLaboratorios };