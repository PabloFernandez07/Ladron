// ==========================================
// src/database/queries.js - CORREGIDO v2
// ==========================================
const { getPool, query, transaction } = require('./connection');
const logger = require('../utils/logger');

class RoboQueries {
  
  // ✅ Registrar UN robo (evento) y MÚLTIPLES participantes
  static async registrarRobo(data) {
    // Usar la función transaction del connection.js
    return await transaction(async (connection) => {
      // 1. Insertar el robo (evento único)
      const sqlRobo = `
        INSERT INTO robos 
        (establecimiento, tipo, exito, guild_id, imagen_url, participantes, fecha)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const [resultRobo] = await connection.query(sqlRobo, [
        data.establecimiento,
        data.tipo,
        data.exito,
        data.guildId,
        data.imagenUrl,
        JSON.stringify(data.participantes)
      ]);
      
      const roboId = resultRobo.insertId;
      
      // 2. Insertar un registro por cada participante (si la tabla existe)
      try {
        const sqlParticipante = `
          INSERT INTO participantes_robos 
          (robo_id, usuario_id, guild_id, fecha)
          VALUES (?, ?, ?, NOW())
        `;
        
        for (const oderId of data.participantes) {
          await connection.query(sqlParticipante, [
            roboId,
            oderId,
            data.guildId
          ]);
        }
      } catch (partError) {
        // Si la tabla no existe, solo logueamos pero no fallamos
        if (partError.code === 'ER_NO_SUCH_TABLE') {
          logger.warn('Tabla participantes_robos no existe, saltando...');
        } else {
          throw partError;
        }
      }
      
      logger.info(`Robo registrado en BD: ID ${roboId} con ${data.participantes.length} participantes`);
      
      return { roboId, participantesCount: data.participantes.length };
    });
  }
  
  // ✅ Top Ladrones (intenta participantes_robos, fallback a JSON)
  static async getTopLadrones(guildId, limit = 10) {
    try {
      // Intentar con tabla participantes_robos
      const rows = await query(`
        SELECT 
          usuario_id,
          COUNT(*) as total_robos
        FROM participantes_robos
        WHERE guild_id = ?
        GROUP BY usuario_id
        ORDER BY total_robos DESC
        LIMIT ?
      `, [guildId, limit]);
      
      return rows;
    } catch (error) {
      // Fallback: extraer de JSON
      logger.warn('Usando fallback para getTopLadrones');
      
      const robos = await query(`
        SELECT participantes, exito
        FROM robos 
        WHERE guild_id = ?
      `, [guildId]);
      
      const conteo = {};
      
      for (const robo of robos) {
        try {
          const participantes = JSON.parse(robo.participantes || '[]');
          for (const oderId of participantes) {
            conteo[oderId] = (conteo[oderId] || 0) + 1;
          }
        } catch (e) {}
      }
      
      return Object.entries(conteo)
        .map(([oderId, total]) => ({ usuario_id: oderId, total_robos: total }))
        .sort((a, b) => b.total_robos - a.total_robos)
        .slice(0, limit);
    }
  }
  
  // ✅ Historial de robos (muestra eventos únicos)
  static async getHistorialRobos(guildId, limit = 50) {
    const rows = await query(`
      SELECT 
        id,
        establecimiento,
        tipo,
        exito,
        imagen_url,
        participantes,
        fecha
      FROM robos
      WHERE guild_id = ?
      ORDER BY fecha DESC
      LIMIT ?
    `, [guildId, limit]);
    
    // Parsear JSON de participantes
    return rows.map(row => ({
      ...row,
      participantes: JSON.parse(row.participantes || '[]')
    }));
  }
  
  // ✅ Estadísticas por tipo
  static async getEstadisticasPorTipo(guildId) {
    const rows = await query(`
      SELECT 
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos
      FROM robos
      WHERE guild_id = ?
      GROUP BY tipo
    `, [guildId]);
    
    return rows;
  }
  
  // ✅ Robos de un usuario específico
  static async getRobosPorUsuario(oderId, guildId) {
    try {
      // Intentar con tabla participantes_robos
      const rows = await query(`
        SELECT 
          r.id,
          r.establecimiento,
          r.tipo,
          r.exito,
          r.fecha,
          r.participantes
        FROM robos r
        INNER JOIN participantes_robos pr ON r.id = pr.robo_id
        WHERE pr.usuario_id = ? AND pr.guild_id = ?
        ORDER BY r.fecha DESC
      `, [oderId, guildId]);
      
      return rows.map(row => ({
        ...row,
        participantes: JSON.parse(row.participantes || '[]')
      }));
    } catch (error) {
      // Fallback: buscar en JSON
      const rows = await query(`
        SELECT 
          id,
          establecimiento,
          tipo,
          exito,
          fecha,
          participantes
        FROM robos
        WHERE guild_id = ?
        ORDER BY fecha DESC
      `, [guildId]);
      
      return rows
        .filter(row => {
          const participantes = JSON.parse(row.participantes || '[]');
          return participantes.includes(oderId);
        })
        .map(row => ({
          ...row,
          participantes: JSON.parse(row.participantes || '[]')
        }));
    }
  }
  
  // ✅ Heatmap (cuenta eventos únicos)
  static async getHeatmapData(guildId) {
    const rows = await query(`
      SELECT 
        DAYOFWEEK(fecha) as diaSemana,
        HOUR(fecha) as hora,
        COUNT(*) as total
      FROM robos
      WHERE guild_id = ?
      GROUP BY diaSemana, hora
      ORDER BY diaSemana, hora
    `, [guildId]);
    
    return rows;
  }
}

// ==========================================
// Queries de Ventas
// ==========================================
class VentaQueries {
  static async registrarVenta(data) {
    return await transaction(async (connection) => {
      // Insertar venta
      const [resultVenta] = await connection.query(`
        INSERT INTO ventas 
        (banda_id, usuario_id, precio_total, fecha)
        VALUES (?, ?, ?, NOW())
      `, [data.banda, data.userId, data.precioTotal]);
      
      const ventaId = resultVenta.insertId;
      
      // Insertar productos
      if (data.productos && data.productos.length > 0) {
        for (const producto of data.productos) {
          await connection.query(`
            INSERT INTO venta_productos (venta_id, producto_id, cantidad)
            VALUES (?, ?, ?)
          `, [ventaId, producto.id, producto.cantidad]);
        }
      }
      
      logger.info(`Venta registrada en BD: ID ${ventaId}`);
      
      return ventaId;
    });
  }
  
  static async getVentasPorBanda(guildId) {
    const rows = await query(`
      SELECT 
        banda_id as banda,
        COUNT(*) as total_ventas,
        SUM(precio_total) as ingresos_totales
      FROM ventas
      GROUP BY banda_id
      ORDER BY ingresos_totales DESC
    `);
    
    return rows;
  }
  
  static async getHistorialVentas(guildId, limit = 50) {
    const rows = await query(`
      SELECT * FROM ventas
      ORDER BY fecha DESC
      LIMIT ?
    `, [limit]);
    
    return rows;
  }
}

module.exports = {
  RoboQueries,
  VentaQueries
};