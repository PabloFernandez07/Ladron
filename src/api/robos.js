// ==========================================
// src/api/robos.js
// API de Robos
// ==========================================
const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const logger = require('../utils/logger');

/**
 * GET /api/robos
 * Lista de robos con filtros opcionales
 */
router.get('/robos', async (req, res) => {
  try {
    const { 
      tipo, 
      exito, 
      usuario, 
      fecha_desde, 
      fecha_hasta, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let sql = `
      SELECT 
        id,
        establecimiento,
        tipo,
        exito,
        usuario_id,
        guild_id,
        imagen_url,
        participantes,
        fecha
      FROM robos
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filtros opcionales
    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    
    if (exito !== undefined) {
      sql += ' AND exito = ?';
      params.push(exito === 'true' ? 1 : 0);
    }
    
    if (usuario) {
      sql += ' AND usuario_id = ?';
      params.push(usuario);
    }
    
    if (fecha_desde) {
      sql += ' AND fecha >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      sql += ' AND fecha <= ?';
      params.push(fecha_hasta);
    }
    
    sql += ' ORDER BY fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const robos = await query(sql, params);
    
    // Parsear participantes de JSON
    const robosParsed = robos.map(r => ({
      ...r,
      exito: Boolean(r.exito),
      participantes: JSON.parse(r.participantes || '[]')
    }));
    
    res.json({
      robos: robosParsed,
      count: robosParsed.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    logger.info(`API: ${robosParsed.length} robos solicitados`);
    
  } catch (error) {
    logger.error('Error en GET /api/robos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/robos/por-dia
 * Robos agrupados por día (para gráficas)
 */
router.get('/robos/por-dia', async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const rows = await query(`
      SELECT 
        DATE(fecha) as dia,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos,
        COUNT(*) as total
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(fecha)
      ORDER BY dia ASC
    `, [parseInt(dias)]);
    
    res.json({
      labels: rows.map(r => r.dia),
      exitosos: rows.map(r => parseInt(r.exitosos)),
      fallidos: rows.map(r => parseInt(r.fallidos)),
      total: rows.map(r => parseInt(r.total))
    });
    
  } catch (error) {
    logger.error('Error en GET /api/robos/por-dia:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/robos/por-tipo
 * Robos agrupados por tipo (para gráfica circular)
 */
router.get('/robos/por-tipo', async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    
    const rows = await query(`
      SELECT 
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY tipo
    `, [parseInt(dias)]);
    
    res.json({
      labels: rows.map(r => r.tipo),
      totales: rows.map(r => parseInt(r.total)),
      exitosos: rows.map(r => parseInt(r.exitosos))
    });
    
  } catch (error) {
    logger.error('Error en GET /api/robos/por-tipo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/robos/por-establecimiento
 * Estadísticas por establecimiento
 */
router.get('/robos/por-establecimiento', async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    
    const rows = await query(`
      SELECT 
        establecimiento,
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY establecimiento, tipo
      ORDER BY total DESC
    `, [parseInt(dias)]);
    
    const resultado = rows.map(r => ({
      establecimiento: r.establecimiento,
      tipo: r.tipo,
      total: parseInt(r.total),
      exitosos: parseInt(r.exitosos),
      fallidos: parseInt(r.fallidos),
      tasaExito: r.total > 0 ? ((r.exitosos / r.total) * 100).toFixed(1) : 0
    }));
    
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error en GET /api/robos/por-establecimiento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/robos/top-usuarios
 * Top usuarios por robos
 */
router.get('/robos/top-usuarios', async (req, res) => {
  try {
    const { dias = 7, limit = 10 } = req.query;
    
    const rows = await query(`
      SELECT 
        usuario_id,
        COUNT(*) as total_robos,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY usuario_id
      ORDER BY total_robos DESC
      LIMIT ?
    `, [parseInt(dias), parseInt(limit)]);
    
    const resultado = rows.map(r => ({
      userId: r.usuario_id,
      totalRobos: parseInt(r.total_robos),
      exitosos: parseInt(r.exitosos),
      fallidos: parseInt(r.fallidos),
      tasaExito: ((r.exitosos / r.total_robos) * 100).toFixed(1)
    }));
    
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error en GET /api/robos/top-usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/robos/heatmap
 * Mapa de calor por día de la semana y hora
 */
router.get('/robos/heatmap', async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const rows = await query(`
      SELECT 
        DAYOFWEEK(fecha) as dia_semana,
        HOUR(fecha) as hora,
        COUNT(*) as total
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DAYOFWEEK(fecha), HOUR(fecha)
      ORDER BY dia_semana, hora
    `, [parseInt(dias)]);
    
    res.json(rows.map(r => ({
      diaSemana: parseInt(r.dia_semana),
      hora: parseInt(r.hora),
      total: parseInt(r.total)
    })));
    
  } catch (error) {
    logger.error('Error en GET /api/robos/heatmap:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;