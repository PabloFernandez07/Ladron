// ==========================================
// src/events/warn.js
// ==========================================
// Advertencias del cliente de Discord
const logger = require('../utils/logger');

module.exports = {
  name: 'warn',
  
  execute(warning, client) {
    logger.warn('Advertencia de Discord:', warning);
  }
};