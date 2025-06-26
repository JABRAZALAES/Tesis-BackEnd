const ObjetosPerdidoosRepository = require('../repositories/ObjetosPerdidoosRepository');
const objetosPerdidosService = require('../services/objetosPerdidosService'); // Importa el servicio


// Crear objeto perdido
const crearObjetoPerdido = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const {
      nombre_objeto,
      descripcion,
      fecha_perdida,
      hora_perdida, // Si se usa, debe venir del body
      lugar,
      laboratorio,
      estadoId // Debe venir del body, por ejemplo: 1 = pendiente
    } = req.body;

    let urlFoto = null;
    if (req.file) {
      urlFoto = `/uploads/${req.file.filename}`;
    }

    const id = await ObjetosPerdidoosRepository.crearObjetoPerdido(
      nombre_objeto,
      descripcion,
      fecha_perdida,
      hora_perdida, // Si se usa, debe venir del body
      lugar,
      laboratorio,
      urlFoto,
      estadoId,
      usuarioId
    );

    res.status(201).json({
      success: true,
      message: 'Objeto perdido reportado correctamente',
      data: {
        id,
        nombre_objeto,
        descripcion,
        fecha_perdida,
        hora_perdida, // Si se usa, debe venir del body
        lugar,
        laboratorio,
        urlFoto,
        estadoId,
        usuarioId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al reportar objeto perdido',
      error: error.message
    });
  }
};

// Obtener todos los objetos perdidos
const obtenerObjetosPerdidos = async (req, res) => {
  try {
    const objetos = await ObjetosPerdidoosRepository.obtenerObjetosPerdidos();
    res.status(200).json({
      success: true,
      data: objetos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener objetos perdidos',
      error: error.message
    });
  }
};

// Cambiar estado de objeto perdido (solo jefe)
const actualizarEstadoObjetoPerdido = async (req, res) => {
  try {
    // Solo permitir si el usuario es jefe
    if (!['jefe', 'admin', 'tecnico'].includes(req.user.rol.toLowerCase())) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const { id } = req.params;
    const { estadoId } = req.body;
    const affectedRows = await ObjetosPerdidoosRepository.actualizarEstadoObjetoPerdido(id, estadoId);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Objeto perdido no encontrado' });
    }
    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};
// Obtener objetos perdidos con estado aprobado
const obtenerObjetosAprobados = async (req, res) => {
  try {
    const estadoAprobadoId = 'EST_APROBADO'; // Cambia este valor si el estado "aprobado" tiene otro ID
    const objetos = await ObjetosPerdidoosRepository.obtenerObjetosPorEstado(estadoAprobadoId);
    res.status(200).json({
      success: true,
      data: objetos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener objetos aprobados',
      error: error.message
    });
  }
};



const ESTADO_RECLAMADO_ID = 'EST_RECLAMADO'; // Asegúrate de que este ID coincida con el de tu base de datos


const reclamarObjetoPerdido = async (req, res) => {
  try {
    // Asegúrate de que el usuario esté autenticado.
    // Esto debería ser manejado por un middleware de autenticación antes de llegar aquí.
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const objetoId = req.params.id;
    const usuarioReclamanteId = req.user.id; // Obtiene el ID del usuario autenticado

    // Llama al servicio para ejecutar la lógica de reclamo
    const success = await objetosPerdidosService.reclamarObjetoPerdido(
      objetoId,
      ESTADO_RECLAMADO_ID, // Pasa el ID del estado 'Reclamado'
      usuarioReclamanteId
    );

    if (success) {
      res.status(200).json({ message: 'Objeto reclamado exitosamente.' });
    } else {
      // Si affectedRows fue 0 en el repositorio/servicio, podría ser que el objeto no existe
      // o ya estaba en un estado que no permite reclamo (ej: ya reclamado o devuelto).
      // La validación más específica podría estar en el servicio o repositorio.
      // Aquí damos una respuesta genérica o podrías refinarla si el servicio retorna más detalles.
      res.status(400).json({ message: 'No se pudo reclamar el objeto. Podría no existir o ya ha sido reclamado.' });
    }

  } catch (error) {
    console.error('Error en el controlador al reclamar objeto perdido:', error); // Log del error
    res.status(500).json({
      message: 'Error interno del servidor al reclamar objeto perdido.',
      error: error.message
    });
  }
};
const borrarObjetoPerdido = async (req, res) => {
  try {
    // Solo permitir si el usuario es admin, jefe o tecnico
    if (!['admin', 'jefe', 'tecnico'].includes(req.user.rol.toLowerCase())) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const { id } = req.params;
    const affectedRows = await ObjetosPerdidoosRepository.borrarObjetoPerdido(id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Objeto perdido no encontrado' });
    }
    res.json({ message: 'Objeto perdido borrado correctamente' });
  } catch (error) {
    res.status(500).json({
      message: 'Error al borrar objeto perdido',
      error: error.message
    });
  }
};


module.exports = {
  crearObjetoPerdido,
  obtenerObjetosPerdidos,
  actualizarEstadoObjetoPerdido,
  obtenerObjetosAprobados,
  reclamarObjetoPerdido,
  borrarObjetoPerdido

};