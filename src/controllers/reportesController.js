const { dbGestionNovedades } = require('../config/db');

// Utilidad para manejo de fechas
const buildDateFilter = (fechaInicio, fechaFin, campoFecha = 'fecha_reporte') => {
  if (!fechaInicio && !fechaFin) return { whereClause: '', params: [] };

  if (fechaInicio && fechaFin) {
    return {
      whereClause: `AND ${campoFecha} BETWEEN ? AND ?`,
      params: [fechaInicio, fechaFin]
    };
  }

  if (fechaInicio) {
    return {
      whereClause: `AND ${campoFecha} >= ?`,
      params: [fechaInicio]
    };
  }

  return {
    whereClause: `AND ${campoFecha} <= ?`,
    params: [fechaFin]
  };
};

// 1. Incidentes por laboratorio
const incidentesPorLaboratorio = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limite = 10, laboratorio } = req.query;
    const { whereClause, params } = buildDateFilter(fechaInicio, fechaFin, 'i.fecha_reporte');

    let laboratorioFilter = '';
    if (laboratorio) {
      laboratorioFilter = 'AND l.nombre = ?';
      params.push(laboratorio);
    }

    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        l.nombre AS laboratorio,
        COUNT(i.id) AS total_incidentes,
        COUNT(CASE WHEN i.estadoId IN ('EST_PENDIENTE', 'EST_ABIERTO', 'EST_EN_PROCESO') THEN 1 END) AS incidentes_activos,
        COUNT(CASE WHEN i.estadoId = 'EST_APROBADO' THEN 1 END) AS incidentes_aprobados,
        COUNT(CASE WHEN i.estadoId = 'EST_ANULADO' THEN 1 END) AS incidentes_anulados,
        COUNT(CASE WHEN i.estadoId = 'EST_ESCALADO' THEN 1 END) AS incidentes_escalados
      FROM laboratorios l
      LEFT JOIN incidentes i ON i.laboratorio_id = l.nombre
      WHERE 1=1 ${whereClause} ${laboratorioFilter}
      GROUP BY l.nombre
      ORDER BY total_incidentes DESC
      LIMIT ?
    `, [...params, parseInt(limite)]);

    res.json({
      success: true,
      data: rows,
      metadata: {
        total_registros: rows.length,
        fecha_consulta: new Date().toISOString(),
        filtros_aplicados: { fechaInicio, fechaFin, limite, laboratorio }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes por laboratorio',
      error: error.message
    });
  }
};
// 2. Incidentes por estado (solo estados de incidentes)
const incidentesPorEstado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const { whereClause, params } = buildDateFilter(fechaInicio, fechaFin, 'i.fecha_reporte');

    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        e.nombre AS estado,
        COUNT(i.id) AS total_incidentes
      FROM estados e
      LEFT JOIN incidentes i ON i.estadoId = e.id
      WHERE e.id NOT IN ('EST_RECLAMADO', 'EST_EN_CUSTODIA', 'EST_DEVUELTO')
      GROUP BY e.id, e.nombre
      ORDER BY total_incidentes DESC
    `, params);

    res.json({
      success: true,
      data: rows,
      metadata: {
        total_registros: rows.length,
        fecha_consulta: new Date().toISOString(),
        filtros_aplicados: { fechaInicio, fechaFin }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes por estado',
      error: error.message
    });
  }
};

// 3. Incidentes por periodo académico (muestra todos los incidentes con datos completos)
const incidentesPorPeriodo = async (req, res) => {
  try {
    const { periodoId } = req.query;
    let whereClause = '';
    let params = [];
    if (periodoId) {
      whereClause = 'WHERE i.periodo_academico_id = ?';
      params = [periodoId];
    }
    const [rows] = await dbGestionNovedades.query(`
      SELECT i.*, p.nombre AS periodo_academico
      FROM incidentes i
      JOIN periodos_academicos p ON i.periodo_academico_id = p.id
      ${whereClause}
      ORDER BY p.nombre DESC, i.id DESC
    `, params);

    res.json({
      success: true,
      data: rows,
      metadata: {
        total_registros: rows.length,
        fecha_consulta: new Date().toISOString(),
        filtros_aplicados: { periodoId }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes por periodo académico',
      error: error.message
    });
  }
};

// 4. Incidentes por tipo de inconveniente
const incidentesPorInconveniente = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limite = 10, laboratorio } = req.query;
    const { whereClause, params } = buildDateFilter(fechaInicio, fechaFin, 'i.fecha_reporte');

    let laboratorioFilter = '';
    if (laboratorio) {
      laboratorioFilter = 'AND i.laboratorio_id = ?';
      params.push(laboratorio);
    }

    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        inc.descripcion AS inconveniente,
        COUNT(i.id) AS total_incidentes
      FROM inconvenientes inc
      LEFT JOIN incidentes i ON i.inconveniente_id = inc.id
      WHERE 1=1 ${whereClause} ${laboratorioFilter}
      GROUP BY inc.id, inc.descripcion
      ORDER BY total_incidentes DESC
      LIMIT ?
    `, [...params, parseInt(limite)]);

    res.json({
      success: true,
      data: rows,
      metadata: {
        total_registros: rows.length,
        fecha_consulta: new Date().toISOString(),
        filtros_aplicados: { fechaInicio, fechaFin, limite, laboratorio }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes por inconveniente',
      error: error.message
    });
  }
};
// 5. Objetos perdidos por laboratorio
const objetosPerdidosPorLaboratorio = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limite = 10 } = req.query;
    const { whereClause, params } = buildDateFilter(fechaInicio, fechaFin, 'o.fecha_perdida');

    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        o.laboratorio,
        COUNT(o.id) AS total_objetos_perdidos
      FROM objetos_perdidos o
      WHERE 1=1 ${whereClause}
      GROUP BY o.laboratorio
      ORDER BY total_objetos_perdidos DESC
      LIMIT ?
    `, [...params, parseInt(limite)]);

    res.json({
      success: true,
      data: rows,
      metadata: {
        total_registros: rows.length,
        fecha_consulta: new Date().toISOString(),
        filtros_aplicados: { fechaInicio, fechaFin, limite }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener objetos perdidos por laboratorio',
      error: error.message
    });
  }
};

// 6. Objetos perdidos por estado (solo estados de objetos perdidos)
const objetosPerdidosPorEstado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const { whereClause, params } = buildDateFilter(fechaInicio, fechaFin, 'o.fecha_perdida');

    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        e.nombre AS estado,
        COUNT(o.id) AS total_objetos
      FROM estados e
      LEFT JOIN objetos_perdidos o ON o.estadoId = e.id
      WHERE e.id IN ('EST_RECLAMADO', 'EST_EN_CUSTODIA', 'EST_DEVUELTO', 'EST_DISPONIBLE')
      GROUP BY e.id, e.nombre
      ORDER BY total_objetos DESC
    `, params);

    res.json({
      success: true,
      data: rows,
      metadata: {
        total_registros: rows.length,
        fecha_consulta: new Date().toISOString(),
        filtros_aplicados: { fechaInicio, fechaFin }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener objetos perdidos por estado',
      error: error.message
    });
  }
};

module.exports = {
  incidentesPorLaboratorio,
  incidentesPorEstado,
  incidentesPorPeriodo,
  incidentesPorInconveniente,
  objetosPerdidosPorLaboratorio,
  objetosPerdidosPorEstado
};