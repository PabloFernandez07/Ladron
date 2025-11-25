// ==========================================
// src/database/queries.js - ACTUALIZADO
// ==========================================
const db = require('./connection');
const logger = require('../utils/logger');

class RoboQueries {
  
  // ✅ Registrar UN robo (evento) y MÚLTIPLES participantes
  static async registrarRobo(data) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
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
      
      // 2. Insertar un registro por cada participante
      const sqlParticipante = `
        INSERT INTO participantes_robos 
        (robo_id, usuario_id, guild_id, fecha)
        VALUES (?, ?, ?, NOW())
      `;
      
      for (const userId of data.participantes) {
        await connection.query(sqlParticipante, [
          roboId,
          userId,
          data.guildId
        ]);
      }
      
      await connection.commit();
      
      logger.info(`Robo registrado: ID ${roboId} con ${data.participantes.length} participantes`);
      
      return { roboId, participantesCount: data.participantes.length };
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error registrando robo:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // ✅ Top Ladrones (cuenta desde participantes_robos)
  static async getTopLadrones(guildId, limit = 10) {
    const sql = `
      SELECT 
        usuario_id,
        COUNT(*) as total_robos
      FROM participantes_robos
      WHERE guild_id = ?
      GROUP BY usuario_id
      ORDER BY total_robos DESC
      LIMIT ?
    `;
    
    const [rows] = await db.query(sql, [guildId, limit]);
    return rows;
  }
  
  // ✅ Historial de robos (muestra eventos únicos)
  static async getHistorialRobos(guildId, limit = 50) {
    const sql = `
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
    `;
    
    const [rows] = await db.query(sql, [guildId, limit]);
    
    // Parsear JSON de participantes
    return rows.map(row => ({
      ...row,
      participantes: JSON.parse(row.participantes)
    }));
  }
  
  // ✅ Estadísticas por tipo
  static async getEstadisticasPorTipo(guildId) {
    const sql = `
      SELECT 
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos
      FROM robos
      WHERE guild_id = ?
      GROUP BY tipo
    `;
    
    const [rows] = await db.query(sql, [guildId]);
    return rows;
  }
  
  // ✅ Robos de un usuario específico (desde participantes_robos)
  static async getRobosPorUsuario(userId, guildId) {
    const sql = `
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
    `;
    
    const [rows] = await db.query(sql, [userId, guildId]);
    
    return rows.map(row => ({
      ...row,
      participantes: JSON.parse(row.participantes)
    }));
  }
  
  // ✅ Heatmap (cuenta eventos únicos, no participantes)
  static async getHeatmapData(guildId) {
    const sql = `
      SELECT 
        DAYOFWEEK(fecha) as diaSemana,
        HOUR(fecha) as hora,
        COUNT(*) as total
      FROM robos
      WHERE guild_id = ?
      GROUP BY diaSemana, hora
      ORDER BY diaSemana, hora
    `;
    
    const [rows] = await db.query(sql, [guildId]);
    return rows;
  }
}

// ==========================================
// Queries de Ventas (sin cambios)
// ==========================================
class VentaQueries {
  static async registrarVenta(data) {
    const sql = `
      INSERT INTO ventas 
      (banda, cantidad, precio_unitario, precio_total, usuario_id, guild_id, fecha)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    return await db.query(sql, [
      data.banda,
      data.cantidad,
      data.precioUnitario,
      data.precioTotal,
      data.userId,
      data.guildId
    ]);
  }
  
  static async getVentasPorBanda(guildId) {
    const sql = `
      SELECT 
        banda,
        COUNT(*) as total_ventas,
        SUM(precio_total) as ingresos_totales
      FROM ventas
      WHERE guild_id = ?
      GROUP BY banda
      ORDER BY ingresos_totales DESC
    `;
    
    const [rows] = await db.query(sql, [guildId]);
    return rows;
  }
  
  static async getHistorialVentas(guildId, limit = 50) {
    const sql = `
      SELECT * FROM ventas
      WHERE guild_id = ?
      ORDER BY fecha DESC
      LIMIT ?
    `;
    
    const [rows] = await db.query(sql, [guildId, limit]);
    return rows;
  }
}

module.exports = {
  RoboQueries,
  VentaQueries
};