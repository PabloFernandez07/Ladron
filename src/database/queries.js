// ==========================================
// src/database/queries.js
// ==========================================
const db = require('./connection');

class RoboQueries {
  static async registrarRobo(data) {
    const sql = `
      INSERT INTO robos 
      (establecimiento, tipo, exito, usuario_id, guild_id, imagen_url, participantes, fecha)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    return await db.query(sql, [
      data.establecimiento,
      data.tipo,
      data.exito,
      data.userId,
      data.guildId,
      data.imagenUrl,
      JSON.stringify(data.participantes)
    ]);
  }
  
  static async obtenerRobosSemana(guildId) {
    const sql = `
      SELECT tipo, establecimiento, 
             SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
             SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos
      FROM robos
      WHERE guild_id = ? 
        AND fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY tipo, establecimiento
    `;
    
    return await db.query(sql, [guildId]);
  }
  
  static async obtenerRobosDiarios(userId) {
    const sql = `
      SELECT COUNT(*) as total
      FROM robos
      WHERE usuario_id = ?
        AND fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    
    const [result] = await db.query(sql, [userId]);
    return result.total;
  }
}

class VentaQueries {
  static async registrarVenta(venta) {
    return await db.transaction(async (connection) => {
      const [result] = await connection.query(
        'INSERT INTO ventas (banda_id, usuario_id, precio_total, fecha) VALUES (?, ?, ?, NOW())',
        [venta.banda, venta.userId, venta.precio]
      );
      
      const ventaId = result.insertId;
      
      for (const producto of venta.productos) {
        await connection.query(
          'INSERT INTO venta_productos (venta_id, producto_id, cantidad) VALUES (?, ?, ?)',
          [ventaId, producto.id, producto.cantidad]
        );
      }
      
      return ventaId;
    });
  }
  
  static async obtenerVentasSemana(bandaId = null) {
    let sql = `
      SELECT v.banda_id, vp.producto_id, SUM(vp.cantidad) as total,
             SUM(v.precio_total) as precio_total
      FROM ventas v
      JOIN venta_productos vp ON v.id = vp.venta_id
      WHERE v.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    
    const params = [];
    
    if (bandaId) {
      sql += ' AND v.banda_id = ?';
      params.push(bandaId);
    }
    
    sql += ' GROUP BY v.banda_id, vp.producto_id';
    
    return await db.query(sql, params);
  }
}

module.exports = { RoboQueries, VentaQueries };