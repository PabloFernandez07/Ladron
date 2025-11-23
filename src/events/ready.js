// ==========================================
// src/events/ready.js
// ==========================================
const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  
  async execute(client) {
    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log(`✅ Bot conectado como: ${client.user.tag}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`👥 Usuarios: ${client.users.cache.size}`);
    console.log(`💬 Comandos cargados: ${client.commands.size}`);
    console.log('════════════════════════════════════════════════════');
    console.log('');
    
    // Establecer presencia/estado del bot
    try {
      client.user.setPresence({
        activities: [{ 
          name: 'robos y ventas 🎯', 
          type: 0 // 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching
        }],
        status: 'online' // online, idle, dnd, invisible
      });
      logger.info('✅ Presencia del bot configurada');
    } catch (error) {
      logger.error('Error configurando presencia:', error);
    }
    
    // Iniciar cron jobs
    try {
      logger.info('⏰ Iniciando cron jobs...');
      
      const resetRobos = require('../cron/resetRobos');
      resetRobos.iniciar(client);
      logger.info('  ✓ Reset robos semanales configurado');
      
      const resetVentas = require('../cron/resetVentas');
      resetVentas.iniciar(client);
      logger.info('  ✓ Reset ventas semanales configurado');
      
      const resetDiario = require('../cron/resetDiario');
      resetDiario.iniciar(client);
      logger.info('  ✓ Reset diario configurado');
      
      logger.info('✅ Todos los cron jobs iniciados correctamente');
    } catch (error) {
      logger.error('❌ Error iniciando cron jobs:', error);
      logger.warn('⚠️  El bot funcionará pero los resets automáticos no estarán disponibles');
    }
    
    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('🚀 Bot completamente operativo y listo para usar');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    
    // Log adicional para debugging
    logger.info('Comandos disponibles:', Array.from(client.commands.keys()).join(', '));
  }
};