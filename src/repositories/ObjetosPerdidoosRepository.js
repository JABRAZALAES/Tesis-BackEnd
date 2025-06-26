const { dbGestionNovedades } = require('../config/db');

// Crear objeto perdido
async function crearObjetoPerdido(
  nombre_objeto,
  descripcion,
  fecha_perdida,
  hora_perdida,
  lugar,
  laboratorio,
  urlFoto,
  estadoId,
  usuarioId
) {
  const [result] = await dbGestionNovedades.query(
    `INSERT INTO objetos_perdidos 
      (nombre_objeto, descripcion, fecha_perdida, hora_perdida, lugar, laboratorio, urlFoto, estadoId, usuarioId) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`,
    [nombre_objeto, descripcion, fecha_perdida, hora_perdida, lugar, laboratorio, urlFoto, estadoId, usuarioId]
  );
  return result.insertId;
}

// Obtener todos los objetos perdidos
  async function obtenerObjetosPerdidos() {
    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        op.*,
        ur.nombre AS usuario_reporta_nombre,
        urc.nombre AS usuario_reclamante_nombre
      FROM objetos_perdidos op
      LEFT JOIN usuarios ur ON op.usuarioId = ur.id
      LEFT JOIN usuarios urc ON op.usuarioReclamanteId = urc.id
    `);
    return rows;
  }
  // Cambiar estado de objeto perdido
async function actualizarEstadoObjetoPerdido(id, estadoId) {
  const [result] = await dbGestionNovedades.query(
    'UPDATE objetos_perdidos SET estadoId = ? WHERE id = ?',
    [estadoId, id]
  );
  return result.affectedRows;
}
const obtenerObjetosPorEstado = async (estadoId) => {
  const [rows] = await pool.query(
    'SELECT * FROM objetos_perdidos WHERE estadoId = ?',
    [estadoId]
  );
  return rows;     
};

const reclamarObjetoPerdido = async (id, estadoReclamadoId, usuarioReclamanteId) => {
  if (!id || !estadoReclamadoId || !usuarioReclamanteId) {
    throw new Error('Faltan parámetros necesarios para reclamar el objeto perdido');
  }

  const [result] = await dbGestionNovedades.query(
    'UPDATE objetos_perdidos SET estadoId = ?, usuarioReclamanteId = ? WHERE id = ?',
    [estadoReclamadoId, usuarioReclamanteId, id]
  );

  return result.affectedRows;
};
async function borrarObjetoPerdido(id) {
  const [result] = await dbGestionNovedades.query(
    'DELETE FROM objetos_perdidos WHERE id = ?',
    [id]
  );
  return result.affectedRows;
}


// Asegúrate de exportar la nueva función
module.exports = {
  crearObjetoPerdido,
  obtenerObjetosPerdidos,
  actualizarEstadoObjetoPerdido,
  obtenerObjetosPorEstado,
  reclamarObjetoPerdido,
  borrarObjetoPerdido
};


