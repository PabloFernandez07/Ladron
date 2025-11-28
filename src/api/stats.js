// ==========================================
// src/api/stats.js
// API de Estadísticas Generales - CORREGIDO
// ==========================================
const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const logger = require('../utils/logger');

/**
 * GET /api/stats
 * Estadísticas generales de la semana actual
 */
router.get('/stats', async (req, res) => {
  try {
    // Robos de la semana
    const robos = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    // Ventas de la semana
    const ventas = await query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(precio_total), 0) as ingresos
      FROM ventas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    // ✅ CORREGIDO: Top 5 ladrones usando participantes_robos
    // Primero verificamos si existe la tabla participantes_robos
    let topLadrones = [];
    
    try {
      // Intentar con la tabla participantes_robos (nueva estructura)
      topLadrones = await query(`
        SELECT 
          pr.usuario_id,
          COUNT(*) as total_robos,
          SUM(CASE WHEN r.exito = 1 THEN 1 ELSE 0 END) as exitosos
        FROM participantes_robos pr
        INNER JOIN robos r ON pr.robo_id = r.id
        WHERE r.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY pr.usuario_id
        ORDER BY total_robos DESC
        LIMIT 5
      `);
    } catch (tableError) {
      // Si falla, puede que la tabla no exista aún
      // Intentar extraer de JSON en la tabla robos
      logger.warn('Tabla participantes_robos no encontrada, usando fallback');
      
      try {
        const robosConParticipantes = await query(`
          SELECT participantes, exito
          FROM robos 
          WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND participantes IS NOT NULL
        `);
        
        // Contar participaciones manualmente
        const conteo = {};
        
        for (const robo of robosConParticipantes) {
          try {
            const participantes = JSON.parse(robo.participantes || '[]');
            for (const oderId of participantes) {
              if (!conteo[oderId]) {
                conteo[oderId] = { total: 0, exitosos: 0 };
              }
              conteo[oderId].total++;
              if (robo.exito) conteo[oderId].exitosos++;
            }
          } catch (parseError) {
            // Ignorar errores de parse
          }
        }
        
        // Convertir a array y ordenar
        topLadrones = Object.entries(conteo)
          .map(([oderId, stats]) => ({
            usuario_id: oderId,
            total_robos: stats.total,
            exitosos: stats.exitosos
          }))
          .sort((a, b) => b.total_robos - a.total_robos)
          .slice(0, 5);
          
      } catch (fallbackError) {
        logger.error('Error en fallback de topLadrones:', fallbackError);
        topLadrones = [];
      }
    }
    
    const roboData = robos[0] || { total: 0, exitosos: 0, fallidos: 0 };
    const ventaData = ventas[0] || { total: 0, ingresos: 0 };
    
    // Obtener nombres de usuario de Discord
    const client = global.discordClient;
    
    const topLadronesConNombres = await Promise.all(
      topLadrones.map(async (l) => {
        let username = l.usuario_id; // Por defecto el ID
        
        try {
          if (client && client.isReady()) {
            const user = await client.users.fetch(l.usuario_id).catch(() => null);
            
            if (user) {
              username = user.username || user.tag;
            } else {
              // Intentar buscar en miembros de servidores
              for (const [guildId, guild] of client.guilds.cache) {
                try {
                  const member = await guild.members.fetch(l.usuario_id).catch(() => null);
                  if (member) {
                    username = member.user.username || member.user.tag;
                    break;
                  }
                } catch (err) {
                  // Continuar con el siguiente servidor
                }
              }
            }
          }
        } catch (error) {
          logger.debug(`Error obteniendo nombre de usuario ${l.usuario_id}:`, error.message);
        }
        
        return {
          userId: l.usuario_id,
          username: username,
          totalRobos: parseInt(l.total_robos),
          exitosos: parseInt(l.exitosos),
          tasaExito: l.total_robos > 0 
            ? ((l.exitosos / l.total_robos) * 100).toFixed(1)
            : '0.0'
        };
      })
    );
    
    res.json({
      robos: {
        total: parseInt(roboData.total) || 0,
        exitosos: parseInt(roboData.exitosos) || 0,
        fallidos: parseInt(roboData.fallidos) || 0,
        tasaExito: roboData.total > 0 
          ? ((roboData.exitosos / roboData.total) * 100).toFixed(1) 
          : '0.0'
      },
      ventas: {
        total: parseInt(ventaData.total) || 0,
        ingresos: parseFloat(ventaData.ingresos) || 0
      },
      topLadrones: topLadronesConNombres
    });
    
    logger.info('Estadísticas solicitadas vía API');
    
  } catch (error) {
    logger.error('Error en GET /api/stats:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      message: error.message 
    });
  }
});

/**
 * GET /api/stats/resumen
 * Resumen rápido para cards del dashboard
 */
router.get('/stats/resumen', async (req, res) => {
  try {
    const hoy = await query(`
      SELECT COUNT(*) as robos_hoy
      FROM robos
      WHERE DATE(fecha) = CURDATE()
    `);
    
    const semana = await query(`
      SELECT 
        COUNT(*) as robos_semana
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    const ingresosSemana = await query(`
      SELECT COALESCE(SUM(precio_total), 0) as ingresos_semana
      FROM ventas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    const mes = await query(`
      SELECT COUNT(*) as robos_mes
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    res.json({
      robosHoy: parseInt(hoy[0]?.robos_hoy) || 0,
      robosSemana: parseInt(semana[0]?.robos_semana) || 0,
      robosMes: parseInt(mes[0]?.robos_mes) || 0,
      ingresosSemana: parseFloat(ingresosSemana[0]?.ingresos_semana) || 0
    });
    
  } catch (error) {
    logger.error('Error en GET /api/stats/resumen:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;