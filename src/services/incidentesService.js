const incidentesRepository = require('../repositories/incidentesRepository');

async function crearIncidenteService(
  titulo,
  descripcion,
  fechaReporte,
  horaReporte,
  laboratorio,
  urlFoto,
  estadoId,      // <-- ahora recibe estadoId
  usuarioId      // <-- ahora recibe usuarioId
) {
  try {
    const incidenteId = await incidentesRepository.crearIncidente(
      titulo,
      descripcion,
      fechaReporte,
      horaReporte,
      laboratorio,
      urlFoto,
      estadoId,   // <-- pasa estadoId
      usuarioId   // <-- pasa usuarioId
    );
    return incidenteId;
  } catch (error) {
    throw new Error('Error al crear el incidente: ' + error.message);
  }
}

module.exports = {
  crearIncidenteService,
};