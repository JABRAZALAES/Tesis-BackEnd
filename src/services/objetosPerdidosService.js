const { dbGestionNovedades } = require('../config/db');
const objetosPerdidosRepository = require('../repositories/ObjetosPerdidoosRepository'); // <-- ¡Esta línea es crucial!


// Crear objeto perdido
async function crearObjetoPerdido(
  nombre_objeto,
  descripcion,
  fecha_perdida,
  hora_perdida, // Si se usa, debe venir del body
  lugar,
  laboratorio,
  url_foto,
  estadoId,
  usuarioId
) {
  const [result] = await dbGestionNovedades.query(
    `INSERT INTO objetos_perdidos 
      (nombre_objeto, descripcion, fecha_perdida, lugar, laboratorio, url_foto, estadoId, usuarioId) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre_objeto, descripcion, fecha_perdida, hora_perdida, lugar, laboratorio, url_foto, estadoId, usuarioId]
  );
  return result.insertId;
}

// Obtener todos los objetos perdidos (puedes filtrar por aprobado si lo agregas)
async function obtenerObjetosPerdidos() {
  const [rows] = await dbGestionNovedades.query(
    `SELECT o.*, e.nombre AS estado, u.nombre AS usuario
     FROM objetos_perdidos o
     LEFT JOIN estados e ON o.estadoId = e.id
     LEFT JOIN usuarios u ON o.usuarioId = u.id
     ORDER BY o.fecha_perdida DESC`
  );
  return rows;
}

// Cambiar estado de objeto perdido (solo jefe)
async function actualizarEstadoObjetoPerdido(id, estadoId) {
  const [result] = await dbGestionNovedades.query(
    'UPDATE objetos_perdidos SET estadoId = ? WHERE id = ?',
    [estadoId, id]
  );
  return result.affectedRows;
}
/**
 * Lógica de negocio para reclamar un objeto perdido.
 * Llama al repositorio para actualizar el estado y el usuario reclamante.
 * @param {number} objetoId - El ID del objeto perdido a reclamar.
 * @param {number} estadoReclamadoId - El ID del estado 'Reclamado' (Estado 4).
 * @param {number} usuarioReclamanteId - El ID del usuario que reclama el objeto.
 * @returns {Promise<boolean>} - True si la actualización fue exitosa, false en caso contrario.
 */
async function reclamarObjetoPerdido(objetoId, estadoReclamadoId, usuarioReclamanteId) {
  // Aquí podrías añadir lógica de negocio adicional si fuera necesario,
  // por ejemplo, verificar si el objeto ya está reclamado, etc.
  // La validación de si el objeto existe o si ya está reclamado
  // podría hacerse aquí o en el controlador, pero hacerla aquí
  // mantiene la lógica de negocio centralizada.
  // Sin embargo, para simplificar y seguir la estructura de llamar al repo,
  // la validación más detallada podría estar en el controlador o el repositorio.

  // Llama a la función del repositorio para realizar la actualización en la BD
  const affectedRows = await objetosPerdidosRepository.reclamarObjetoPerdido(
    objetoId,
    estadoReclamadoId,
    usuarioReclamanteId
  );

  // Retorna true si al menos una fila fue afectada (indicando éxito)
  return affectedRows > 0;
}


module.exports = {
  crearObjetoPerdido,
  obtenerObjetosPerdidos,
  actualizarEstadoObjetoPerdido,
  reclamarObjetoPerdido
};





