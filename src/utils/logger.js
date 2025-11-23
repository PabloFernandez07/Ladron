// ==========================================
// src/utils/logger.js - VERSIÓN CORREGIDA
// ==========================================
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configurar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Errores en archivo separado
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Todos los logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    
    // Consola con colores
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  ]
});

// Agregar métodos personalizados DESPUÉS de crear el logger
logger.command = function(commandName, user, guild) {
  this.info(`Comando ejecutado: /${commandName}`, {
    user: user?.tag || 'Unknown',
    userId: user?.id || 'Unknown',
    guild: guild?.name || 'Unknown',
    guildId: guild?.id || 'Unknown'
  });
};

logger.interaction = function(type, customId, user) {
  this.info(`Interacción: ${type} - ${customId}`, {
    user: user?.tag || 'Unknown',
    userId: user?.id || 'Unknown'
  });
};

logger.cron = function(jobName, message) {
  this.info(`[CRON] ${jobName}: ${message}`);
};

logger.db = function(query, params) {
  this.debug('Query ejecutada', { query, params });
};

module.exports = logger;