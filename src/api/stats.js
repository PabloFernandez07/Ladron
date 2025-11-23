// ==========================================
// src/api/stats.js
// API de Estadísticas Generales
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
    logger.info('========================================');
    logger.info('🔍 INICIANDO OBTENCIÓN DE ESTADÍSTICAS');
    logger.info('========================================');
    
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
        SUM(precio_total) as ingresos
      FROM ventas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    // Top 5 ladrones de la semana
    const topLadrones = await query(`
      SELECT 
        usuario_id,
        COUNT(*) as total_robos,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos
      FROM robos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY usuario_id
      ORDER BY total_robos DESC
      LIMIT 5
    `);
    
    logger.info(`📊 Top ladrones encontrados en BD: ${topLadrones.length}`);
    
    const roboData = robos[0] || { total: 0, exitosos: 0, fallidos: 0 };
    const ventaData = ventas[0] || { total: 0, ingresos: 0 };
    
    // Obtener nombres de usuario de Discord
    logger.info('');
    logger.info('👤 INICIANDO BÚSQUEDA DE NOMBRES DE DISCORD:');
    logger.info('='.repeat(60));
    
    // Verificar cliente de Discord
    const client = global.discordClient;
    
    if (!client) {
      logger.error('❌ ERROR: global.discordClient NO está definido');
      logger.error('   → Añade "global.discordClient = client;" en src/index.js');
    } else {
      logger.info('✅ Cliente de Discord encontrado en global');
      logger.info(`   → Bot conectado: ${client.user ? client.user.tag : 'NO'}`);
      logger.info(`   → Bot listo: ${client.isReady() ? 'SÍ' : 'NO'}`);
      logger.info(`   → Usuarios en caché: ${client.users.cache.size}`);
      logger.info(`   → Servidores: ${client.guilds.cache.size}`);
    }
    
    logger.info('');
    
    const topLadronesConNombres = await Promise.all(
      topLadrones.map(async (l, index) => {
        logger.info(`[${index + 1}/${topLadrones.length}] Procesando usuario: ${l.usuario_id}`);
        
        let username = l.usuario_id; // Por defecto el ID
        let encontrado = false;
        
        try {
          if (!client) {
            logger.warn(`   └─ ❌ Cliente no disponible`);
          } else if (!client.isReady()) {
            logger.warn(`   └─ ❌ Cliente no está listo`);
          } else {
            logger.info(`   ├─ 🔍 Intentando fetch de usuario...`);
            
            // Intentar buscar el usuario
            const user = await client.users.fetch(l.usuario_id).catch((err) => {
              logger.warn(`   ├─ ⚠️  Fetch falló: ${err.message}`);
              return null;
            });
            
            if (user) {
              // Discord nuevo (sin discriminador) o antiguo (con discriminador)
              const displayName = user.username || user.tag || user.id;
              username = displayName;
              encontrado = true;
              
              logger.info(`   ├─ ✅ Usuario encontrado!`);
              logger.info(`   ├─ 📝 Username: ${user.username}`);
              logger.info(`   ├─ 🏷️  Tag: ${user.tag}`);
              logger.info(`   ├─ 🆔 Display: ${displayName}`);
              logger.info(`   └─ ➡️  Resultado final: "${username}"`);
            } else {
              logger.warn(`   └─ ❌ Usuario NO encontrado (null)`);
              
              // Intentar buscar en miembros de servidores
              logger.info(`   └─ 🔄 Intentando buscar en servidores...`);
              
              for (const [guildId, guild] of client.guilds.cache) {
                try {
                  const member = await guild.members.fetch(l.usuario_id).catch(() => null);
                  if (member) {
                    username = member.user.username || member.user.tag;
                    encontrado = true;
                    logger.info(`   └─ ✅ Encontrado en servidor: ${guild.name}`);
                    logger.info(`      └─ Nombre: ${username}`);
                    break;
                  }
                } catch (err) {
                  // Continuar con el siguiente servidor
                }
              }
              
              if (!encontrado) {
                logger.warn(`   └─ ❌ No encontrado en ningún servidor`);
              }
            }
          }
        } catch (error) {
          logger.error(`   └─ ❌ ERROR CRÍTICO: ${error.message}`);
          logger.error(`      Stack: ${error.stack}`);
        }
        
        logger.info('');
        
        return {
          userId: l.usuario_id,
          username: username,
          encontrado: encontrado,
          totalRobos: parseInt(l.total_robos),
          exitosos: parseInt(l.exitosos),
          tasaExito: ((l.exitosos / l.total_robos) * 100).toFixed(1)
        };
      })
    );
    
    // Resumen final
    logger.info('='.repeat(60));
    logger.info('📋 RESUMEN DE BÚSQUEDA:');
    const encontrados = topLadronesConNombres.filter(u => u.encontrado).length;
    logger.info(`   ✅ Encontrados: ${encontrados}/${topLadronesConNombres.length}`);
    logger.info(`   ❌ No encontrados: ${topLadronesConNombres.length - encontrados}/${topLadronesConNombres.length}`);
    logger.info('');
    logger.info('📤 DATOS QUE SE ENVIARÁN AL FRONTEND:');
    topLadronesConNombres.forEach((u, i) => {
      logger.info(`   ${i + 1}. ID: ${u.userId} → Username: "${u.username}" (${u.encontrado ? '✅' : '❌'})`);
    });
    logger.info('='.repeat(60));
    logger.info('');
    
    res.json({
      robos: {
        total: parseInt(roboData.total),
        exitosos: parseInt(roboData.exitosos),
        fallidos: parseInt(roboData.fallidos),
        tasaExito: roboData.total > 0 
          ? ((roboData.exitosos / roboData.total) * 100).toFixed(1) 
          : 0
      },
      ventas: {
        total: parseInt(ventaData.total),
        ingresos: parseFloat(ventaData.ingresos) || 0
      },
      topLadrones: topLadronesConNombres.map(u => ({
        userId: u.userId,
        username: u.username,
        totalRobos: u.totalRobos,
        exitosos: u.exitosos,
        tasaExito: u.tasaExito
      }))
    });
    
    logger.info('✅ Respuesta enviada al frontend correctamente');
    
  } catch (error) {
    logger.error('❌ ERROR FATAL EN /api/stats:', error);
    logger.error('Stack completo:', error.stack);
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
        COUNT(*) as robos_semana,
        SUM(precio_total) as ingresos_semana
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
      ingresosSemana: parseFloat(semana[0]?.ingresos_semana) || 0
    });
    
  } catch (error) {
    logger.error('Error en GET /api/stats/resumen:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;