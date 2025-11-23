// ==========================================
// src/events/interactionCreate.js
// ==========================================
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  
  async execute(interaction, client) {
    try {
      // Comando de slash (/)
      if (interaction.isChatInputCommand()) {
        const commandHandler = require('../handlers/commandHandler');
        await commandHandler.handle(interaction, client);
      }
      
      // Botones
      else if (interaction.isButton()) {
        const buttonHandler = require('../handlers/buttonHandler');
        await buttonHandler.handle(interaction, client);
      }
      
      // Menús desplegables (Select Menus)
      else if (interaction.isStringSelectMenu()) {
        const selectMenuHandler = require('../handlers/selectMenuHandler');
        await selectMenuHandler.handle(interaction, client);
      }
      
      // Modales
      else if (interaction.isModalSubmit()) {
        const modalHandler = require('../handlers/modalHandler');
        await modalHandler.handle(interaction, client);
      }
      
      // Menús contextuales (clic derecho)
      else if (interaction.isContextMenuCommand()) {
        logger.info(`Context menu: ${interaction.commandName}`, {
          user: interaction.user.tag,
          guild: interaction.guild?.name
        });
        
        await interaction.reply({
          content: '⚠️ Los menús contextuales no están implementados aún.',
          ephemeral: true
        });
      }
      
      // Autocompletado
      else if (interaction.isAutocomplete()) {
        logger.debug(`Autocomplete: ${interaction.commandName}`);
        // Aquí podrías manejar autocompletado si lo necesitas
      }
      
      // Tipo desconocido
      else {
        logger.warn(`Tipo de interacción no manejada: ${interaction.type}`);
      }
      
    } catch (error) {
      logger.error('Error en interactionCreate:', {
        type: interaction.type,
        customId: interaction.customId || 'N/A',
        commandName: interaction.commandName || 'N/A',
        user: interaction.user?.tag,
        error: error.message
      });
      
      // Responder al usuario con el error
      const errorMessage = {
        content: '❌ Ha ocurrido un error al procesar tu solicitud.',
        ephemeral: true
      };
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        logger.error('No se pudo responder con el error:', replyError);
      }
    }
  }
};