// ==========================================
// src/events/guildDelete.js (OPCIONAL)
// ==========================================
// Se ejecuta cuando el bot es removido de un servidor
const logger = require('../utils/logger');

module.exports = {
  name: 'guildDelete',
  
  async execute(guild, client) {
    logger.info(`Bot removido del servidor: ${guild.name} (${guild.id})`);
    
    // Aquí podrías:
    // - Eliminar datos del servidor de tu base de datos
    // - Hacer backup antes de eliminar
    // - Notificar a administradores
  }
};