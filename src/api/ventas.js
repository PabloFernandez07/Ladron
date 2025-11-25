// ==========================================
// src/api/ventas.js
// API de Ventas
// ==========================================
const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const logger = require('../utils/logger');

/**
 * GET /api/ventas
 * Lista de ventas con filtros opcionales
 */
router.get('/ventas', async (req, res) => {
  try {
    const { 
      banda, 
      fecha_desde, 
      fecha_hasta, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let sql = `
      SELECT 
        v.id,
        v.banda_id,
        v.usuario_id,
        v.precio_total,
        v.fecha,
        GROUP_CONCAT(
          CONCAT(vp.producto_id, ':', vp.cantidad)
          SEPARATOR ','
        ) as productos
      FROM ventas v
      LEFT JOIN venta_productos vp ON v.id = vp.venta_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (banda) {
      sql += ' AND v.banda_id = ?';
      params.push(banda);
    }
    
    if (fecha_desde) {
      sql += ' AND v.fecha >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      sql += ' AND v.fecha <= ?';
      params.push(fecha_hasta);
    }
    
    sql += ' GROUP BY v.id ORDER BY v.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const ventas = await query(sql, params);
    
    const ventasParsed = ventas.map(v => ({
      ...v,
      precio_total: parseFloat(v.precio_total),
      productos: v.productos 
        ? v.productos.split(',').map(p => {
            const [id, cantidad] = p.split(':');
            return { producto_id: id, cantidad: parseInt(cantidad) };
          })
        : []
    }));
    
    res.json({
      ventas: ventasParsed,
      count: ventasParsed.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    logger.info(`API: ${ventasParsed.length} ventas solicitadas`);
    
  } catch (error) {
    logger.error('Error en GET /api/ventas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ventas/por-banda
 * Ventas agrupadas por banda (para gráfica de barras)
 * FORMATO CORRECTO: Array de objetos
 */
router.get('/ventas/por-banda', async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    
    const rows = await query(`
      SELECT 
        banda_id,
        COUNT(*) as total_ventas,
        SUM(precio_total) as ingresos_totales
      FROM ventas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY banda_id
      ORDER BY ingresos_totales DESC
    `, [parseInt(dias)]);
    
    // FORMATO CORRECTO: Array de objetos
    res.json(rows.map(r => ({
      banda: r.banda_id,
      total: parseInt(r.total_ventas),
      ingresos: parseFloat(r.ingresos_totales)
    })));
    
  } catch (error) {
    logger.error('Error en GET /api/ventas/por-banda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ventas/productos-top
 * Productos más vendidos
 */
router.get('/ventas/productos-top', async (req, res) => {
  try {
    const { dias = 7, limit = 10 } = req.query;
    
    const rows = await query(`
      SELECT 
        vp.producto_id,
        SUM(vp.cantidad) as total_vendido,
        COUNT(DISTINCT v.banda_id) as bandas_diferentes
      FROM venta_productos vp
      JOIN ventas v ON vp.venta_id = v.id
      WHERE v.fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY vp.producto_id
      ORDER BY total_vendido DESC
      LIMIT ?
    `, [parseInt(dias), parseInt(limit)]);
    
    res.json(rows.map(r => ({
      productoId: r.producto_id,
      totalVendido: parseInt(r.total_vendido),
      bandasDiferentes: parseInt(r.bandas_diferentes)
    })));
    
  } catch (error) {
    logger.error('Error en GET /api/ventas/productos-top:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ventas/timeline
 * Ventas a lo largo del tiempo (gráfica de línea)
 */
router.get('/ventas/timeline', async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const rows = await query(`
      SELECT 
        DATE(fecha) as dia,
        COUNT(*) as total_ventas,
        SUM(precio_total) as ingresos
      FROM ventas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(fecha)
      ORDER BY dia ASC
    `, [parseInt(dias)]);
    
    res.json({
      labels: rows.map(r => r.dia),
      ventas: rows.map(r => parseInt(r.total_ventas)),
      ingresos: rows.map(r => parseFloat(r.ingresos))
    });
    
  } catch (error) {
    logger.error('Error en GET /api/ventas/timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ventas/limites
 * Productos cercanos al límite semanal
 */
router.get('/ventas/limites', async (req, res) => {
  try {
    const { caches } = require('../services/cacheService');
    
    const productos = caches.productos.get() || {};
    const registro = caches.registroSemanal.get() || {};
    
    const alertas = [];
    
    for (const [bandaId, productosVendidos] of Object.entries(registro)) {
      for (const [productoId, cantidad] of Object.entries(productosVendidos)) {
        if (productoId === 'preciototal') continue;
        
        const producto = productos[productoId];
        if (!producto) continue;
        
        const limite = producto.limite_semanal;
        const porcentaje = (cantidad / limite) * 100;
        
        if (porcentaje >= 70) {
          alertas.push({
            bandaId,
            productoId,
            nombreProducto: producto.nombre,
            cantidad,
            limite,
            porcentaje: porcentaje.toFixed(1),
            estado: porcentaje >= 100 ? 'EXCEDIDO' : porcentaje >= 90 ? 'CRÍTICO' : 'ALERTA'
          });
        }
      }
    }
    
    alertas.sort((a, b) => b.porcentaje - a.porcentaje);
    
    res.json(alertas);
    
  } catch (error) {
    logger.error('Error en GET /api/ventas/limites:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;