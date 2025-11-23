// ==========================================
// src/database/migrate.js - CORREGIDO
// ==========================================
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Intentar cargar config, si falla usar valores mínimos
let config;
try {
  config = require('../config');
} catch (error) {
  console.error('⚠️  No se pudo cargar config, usando variables de entorno directamente');
  require('dotenv').config();
  config = {
    database: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    }
  };
}

// Logger simple para migración
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  error: (msg, err) => console.error(`❌ ${msg}`, err?.message || ''),
  warn: (msg) => console.warn(`⚠️  ${msg}`)
};

async function migrate() {
  let connection;
  
  try {
    log.info('Iniciando migración de base de datos...');
    
    // Validar configuración
    if (!config.database.host || !config.database.user || !config.database.password) {
      throw new Error('Faltan credenciales de base de datos. Verifica tu archivo .env');
    }
    
    // Conectar sin especificar base de datos
    connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      multipleStatements: true
    });
    
    log.info('✅ Conexión establecida');
    
    // Leer archivo SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo schema.sql en: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    log.info('📄 Ejecutando script SQL...');
    
    // Ejecutar script
    await connection.query(schema);
    
    log.info('✅ Base de datos creada/actualizada correctamente');
    console.log('');
    log.info('📊 Tablas creadas:');
    console.log('  - robos');
    console.log('  - ventas');
    console.log('  - venta_productos');
    console.log('  - limites_diarios');
    console.log('');
    log.info('📈 Vistas creadas:');
    console.log('  - v_robos_semana_actual');
    console.log('  - v_ventas_semana_actual');
    console.log('  - v_top_ladrones');
    console.log('');
    log.info('🎉 Migración completada exitosamente');
    
  } catch (error) {
    log.error('Error durante la migración:', error);
    console.error('\n💡 Sugerencias:');
    console.error('  1. Verifica que MySQL esté corriendo');
    console.error('  2. Verifica las credenciales en .env');
    console.error('  3. Asegúrate de que el usuario tenga permisos para crear bases de datos\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  migrate()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      log.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrate };