// ==========================================
// src/events/error.js
// ==========================================
// Manejo de errores del cliente de Discord
const logger = require('../utils/logger');

module.exports = {
  name: 'error',
  
  execute(error, client) {
    logger.error('Error del cliente de Discord:', error);
  }
};