// src/controllers/computadorasController.js
const { dbGestionNovedades } = require('../config/db');

const obtenerComputadorasPorLaboratorio = async (req, res) => {
  const { laboratorio_id } = req.query;
  try {
    const [rows] = await dbGestionNovedades.query(
      'SELECT id, nombre FROM computadoras WHERE laboratorio_id = ?',
      [laboratorio_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener computadoras', error: error.message });
  }
};

module.exports = { obtenerComputadorasPorLaboratorio };