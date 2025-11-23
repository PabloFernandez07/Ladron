// ==========================================
// src/events/guildCreate.js (OPCIONAL)
// ==========================================
// Se ejecuta cuando el bot se une a un servidor nuevo
const logger = require('../utils/logger');

module.exports = {
  name: 'guildCreate',
  
  async execute(guild, client) {
    logger.info(`Bot añadido a nuevo servidor: ${guild.name} (${guild.id})`, {
      memberCount: guild.memberCount,
      owner: guild.ownerId
    });
    
    // Aquí podrías:
    // - Enviar un mensaje de bienvenida al owner
    // - Registrar el servidor en tu base de datos
    // - Desplegar comandos automáticamente en el nuevo servidor
    
    try {
      // Buscar un canal donde enviar mensaje de bienvenida
      const channel = guild.systemChannel || 
                     guild.channels.cache.find(ch => 
                       ch.type === 0 && // GUILD_TEXT
                       ch.permissionsFor(guild.members.me).has('SendMessages')
                     );
      
      if (channel) {
        await channel.send({
          content: `👋 ¡Hola! Gracias por agregarme al servidor.\n\n` +
                  `🤖 Usa \`/\` para ver todos mis comandos.\n` +
                  `📚 Para ayuda, contacta con el administrador del bot.`
        });
      }
    } catch (error) {
      logger.error('Error enviando mensaje de bienvenida:', error);
    }
  }
};