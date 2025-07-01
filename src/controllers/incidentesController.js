const { dbGestionNovedades } = require('../config/db');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');


const crearIncidente = async (req, res) => {
  try {
    const { descripcion, fechaReporte, horaReporte, laboratorio_id, computadora_id, estadoId, inconveniente_id, inconveniente_personalizado } = req.body;
    const usuarioId = req.user.id;
    let urlFoto = null;
    let inconvenienteIdFinal = inconveniente_id;

    if (req.file) {
      urlFoto = `/uploads/${req.file.filename}`;
    }

    // Si hay inconveniente personalizado, lo insertamos como general
    if (inconveniente_personalizado && inconveniente_personalizado.trim() !== '') {
      const [result] = await dbGestionNovedades.query(
        'INSERT INTO inconvenientes (tipo, descripcion) VALUES (?, ?)',
        ['general', inconveniente_personalizado.trim()]
      );
      inconvenienteIdFinal = result.insertId;
    }

    // Buscar el periodo académico correspondiente a la fechaReporte
    const [periodoRows] = await dbGestionNovedades.query(
      'SELECT id FROM periodos_academicos WHERE ? BETWEEN fecha_inicio AND fecha_fin LIMIT 1',
      [fechaReporte]
    );
    const periodo_academico_id = periodoRows.length > 0 ? periodoRows[0].id : null;

    const [resultIncidente] = await dbGestionNovedades.query(
      'INSERT INTO incidentes (descripcion, fecha_reporte, hora_reporte, laboratorio_id, computadora_id, urlFoto, estadoId, usuarioId, inconveniente_id, periodo_academico_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [descripcion, fechaReporte, horaReporte, laboratorio_id, computadora_id, urlFoto, estadoId, usuarioId, inconvenienteIdFinal, periodo_academico_id]
    );

    // --- Notificación por correo ---
    // Obtener datos del usuario
    const [usuarioRows] = await dbGestionNovedades.query(
      'SELECT nombre, correo FROM usuarios WHERE id = ?',
      [usuarioId]
    );
    const usuario = usuarioRows[0];

    // Leer plantilla y reemplazar marcadores
    const templatePath = path.join(__dirname, '../templates/incidenteCreado.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html
      .replace('{{nombre}}', usuario.nombre)
      .replace('{{descripcion}}', descripcion)
      .replace('{{fecha}}', fechaReporte)
      .replace('{{hora}}', horaReporte)
      .replace('{{laboratorio}}', laboratorio_id);

    // Enviar correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: usuario.correo,
      subject: 'Incidente registrado',
      html
    });

    res.status(201).json({
      success: true,
      message: 'Incidente creado correctamente',
      data: {
        id: resultIncidente.insertId,
        descripcion,
        fechaReporte,
        horaReporte,
        laboratorio_id,
        computadora_id,
        urlFoto,
        estadoId,
        usuarioId,
        inconveniente_id: inconvenienteIdFinal,
        periodo_academico_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear incidente', error: error.message });
  }
};

// ...existing code...

// Obtener todos los incidentes (con nombre de estado y usuario opcional)
const obtenerIncidentes = async (req, res) => {
  try {
    const [rows] = await dbGestionNovedades.query(
      `SELECT i.*, e.nombre AS estado, u.nombre AS usuario
        FROM incidentes i
        LEFT JOIN estados e ON i.estadoId = e.id
        LEFT JOIN usuarios u ON i.usuarioId = u.id
        ORDER BY i.fecha_reporte DESC, i.hora_reporte DESC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes',
      error: error.message
    });
  }
};

// Obtener incidentes del usuario autenticado
const obtenerMisIncidentes = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const [rows] = await dbGestionNovedades.query(
      `SELECT i.*, e.nombre AS estado
        FROM incidentes i
        LEFT JOIN estados e ON i.estadoId = e.id
        WHERE i.usuarioId = ?
        ORDER BY i.fecha_reporte DESC, i.hora_reporte DESC`,
      [usuarioId]
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener tus incidentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus incidentes',
      error: error.message
    });
  }
};

// Actualizar estado de incidente (solo jefe o admin)

const actualizarEstadoIncidente = async (req, res) => {
  try {
    if (!['admin', 'tecnico', 'jefe'].includes(req.user.rol.toLowerCase())) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { id } = req.params;
    const { estadoId, detalle_resolucion } = req.body;

    if (
      ['EST_APROBADO', 'EST_ANULADO','EST_ESCALADO', 'EST_MANTENIMIENTO'].includes(estadoId) &&
      !['tecnico', 'jefe'].includes(req.user.rol.toLowerCase())
    ) {
      return res.status(403).json({ message: 'Solo jefe o técnico pueden aprobar o anular' });
    }

    let query, params;
    if (estadoId !== 'EST_PENDIENTE') {
      const [periodoRows] = await dbGestionNovedades.query(
        'SELECT id FROM periodos_academicos WHERE CURDATE() BETWEEN fecha_inicio AND fecha_fin LIMIT 1'
      );
      const periodo_academico_id = periodoRows.length > 0 ? periodoRows[0].id : null;

      query = `UPDATE incidentes 
               SET estadoId = ?, 
                   detalle_resolucion = ?, 
                   periodo_academico_id = ?
               WHERE id = ?`;
      params = [estadoId, detalle_resolucion || null, periodo_academico_id, id];
    } else {
      query = `UPDATE incidentes 
               SET estadoId = ?, 
                   detalle_resolucion = ?
               WHERE id = ?`;
      params = [estadoId, detalle_resolucion || null, id];
    }

    const [result] = await dbGestionNovedades.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado' });
    }

    // --- Notificación por correo ---
    // Obtener correo y nombre del usuario dueño del incidente
    const [usuarioRows] = await dbGestionNovedades.query(
      `SELECT u.correo, u.nombre 
       FROM usuarios u 
       JOIN incidentes i ON u.id = i.usuarioId 
       WHERE i.id = ?`,
      [id]
    );
    const usuario = usuarioRows[0];

    // Obtener nombre del estado
    const [estadoRows] = await dbGestionNovedades.query(
      'SELECT nombre FROM estados WHERE id = ?',
      [estadoId]
    );
    const estadoNombre = estadoRows.length > 0 ? estadoRows[0].nombre : estadoId;

    // Leer plantilla y reemplazar marcadores
    const templatePath = path.join(__dirname, '../templates/incidenteEstado.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html
      .replace('{{nombre}}', usuario.nombre)
      .replace('{{estado}}', estadoNombre)
      .replace('{{detalle}}', detalle_resolucion || 'Sin detalles adicionales.');

    // Enviar correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: usuario.correo,
      subject: 'Actualización de estado de tu incidente',
      html
    });

    res.json({ message: 'Estado y detalle actualizados correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};


// Borrar incidente (solo el dueño, admin, tecnico o jefe)
const borrarIncidente = async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener el incidente para verificar permisos
    const [rows] = await dbGestionNovedades.query(
      'SELECT usuarioId FROM incidentes WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado' });
    }
    const incidente = rows[0];

    // Permitir solo si es admin, tecnico, jefe o el dueño
    if (
      !['admin', 'tecnico', 'jefe'].includes(req.user.rol.toLowerCase()) &&
      req.user.id !== incidente.usuarioId
    ) {
      return res.status(403).json({ message: 'No autorizado para borrar este incidente' });
    }

    // Eliminar el incidente
    const [result] = await dbGestionNovedades.query(
      'DELETE FROM incidentes WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado' });
    }
    res.json({ message: 'Incidente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar incidente', error: error.message });
  }
};


module.exports = {
  crearIncidente,
  obtenerIncidentes,
  obtenerMisIncidentes,
  actualizarEstadoIncidente,
  borrarIncidente
};

