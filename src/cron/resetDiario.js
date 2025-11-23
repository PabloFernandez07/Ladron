// ==========================================
// src/cron/resetDiario.js
// ==========================================
const cron = require('node-cron');
const logger = require('../utils/logger');
const roboService = require('../services/roboService');
const config = require('../config');

module.exports = {
  iniciar(client) {
    // Cada 15 minutos para limpiar límites diarios expirados
    cron.schedule('*/15 * * * *', async () => {
      try {
        const ahora = Date.now();
        const ms24h = 24 * 60 * 60 * 1000;
        const limites = roboService.limitesDiarios;
        
        let eliminados = 0;
        
        for (const [userId, datos] of limites.entries()) {
          if (ahora - datos.primerRobo >= ms24h) {
            limites.delete(userId);
            eliminados++;
          }
        }
        
        if (eliminados > 0) {
          logger.cron('resetDiario', `${eliminados} límites diarios expirados eliminados`);
          
          // Opcional: avisar a canal si alguien se resetea
          const guild = client.guilds.cache.get(config.servidores.principal);
          if (guild) {
            // Aquí podrías enviar un resumen actualizado
          }
        }
        
      } catch (error) {
        logger.error('Error en cron resetDiario:', error);
      }
    }, {
      timezone: 'Europe/Madrid'
    });
    
    logger.info('Cron job resetDiario programado');
  }
};