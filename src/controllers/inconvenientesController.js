const { dbGestionNovedades } = require('../config/db');

const obtenerInconvenientes = async (req, res) => {
  try {
    const [rows] = await dbGestionNovedades.query('SELECT * FROM inconvenientes');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener inconvenientes', error: error.message });
  }
};

module.exports = { obtenerInconvenientes };