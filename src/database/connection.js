// ==========================================
// src/database/connection.js
// ==========================================
const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool(config.database);
      
      // Probar conexión
      const connection = await pool.getConnection();
      logger.info('✅ Conexión a base de datos establecida');
      connection.release();
    } catch (error) {
      logger.error('❌ Error conectando a base de datos:', error);
      throw error;
    }
  }
  
  return pool;
}

async function query(sql, params = []) {
  try {
    const pool = await getPool();
    logger.db(sql, params);
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    logger.error('Error en query:', { sql, params, error: error.message });
    throw error;
  }
}

async function transaction(callback) {
  const pool = await getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getPool, query, transaction };