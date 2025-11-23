// ==========================================
// src/events/messageCreate.js (OPCIONAL)
// ==========================================
// Este evento es opcional, solo si quieres comandos por mensaje
const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  
  async execute(message, client) {
    // Ignorar bots
    if (message.author.bot) return;
    
    // Ignorar mensajes sin contenido
    if (!message.content) return;
    
    // Prefix commands (opcional)
    const prefix = '!';
    
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    logger.debug(`Comando de prefijo: ${commandName}`, {
      user: message.author.tag,
      guild: message.guild?.name
    });
    
    // Aquí podrías manejar comandos con prefijo si los necesitas
    // Por ahora solo usamos slash commands
    
    // Ejemplo de comando simple
    if (commandName === 'ping') {
      await message.reply('🏓 Pong! Usa `/` para los comandos.');
    }
  }
};
