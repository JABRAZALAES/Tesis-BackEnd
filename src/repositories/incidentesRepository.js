const dbGestionNovedades = require('../config/db').dbGestionNovedades;

async function crearIncidente(
  titulo,
  descripcion,
  fechaReporte,
  horaReporte,
  laboratorio,
  urlFoto,
  estadoId,    // ahora recibe estadoId
  usuarioId    // ahora recibe usuarioId
) {
  const [result] = await dbGestionNovedades.query(
    `INSERT INTO incidentes (titulo, descripcion, fecha_reporte, hora_reporte, laboratorio, urlFoto, estadoId, usuarioId) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descripcion, fechaReporte, horaReporte, laboratorio, urlFoto, estadoId, usuarioId]
  );
  return result.insertId;Z
}

module.exports = {
  crearIncidente,
};