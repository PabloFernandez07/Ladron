// ==========================================
// src/handlers/commandHandler.js - CORREGIDO
// ==========================================
const logger = require('../utils/logger');

async function handle(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    logger.warn(`Comando no encontrado: ${interaction.commandName}`);
    return await interaction.reply({
      content: '❌ Este comando no existe.',
      ephemeral: true
    });
  }
  
  try {
    logger.command(interaction.commandName, interaction.user, interaction.guild);
    await command.execute(interaction, client);
  } catch (error) {
    logger.error(`Error ejecutando comando ${interaction.commandName}:`, error);
    
    const errorMsg = {
      content: '❌ Hubo un error al ejecutar este comando.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMsg);
    } else {
      await interaction.reply(errorMsg);
    }
  }
}

module.exports = { handle };