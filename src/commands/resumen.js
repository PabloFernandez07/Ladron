// ==========================================
// src/commands/resumen.js
// ==========================================
const { SlashCommandBuilder } = require('discord.js');
const registroService = require('../services/registroService');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resumen')
    .setDescription('Envía el resumen semanal al canal operativo'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      await registroService.enviarResumenSemanal(interaction.guild);
      
      await interaction.editReply({
        content: '✅ Resumen semanal enviado correctamente.'
      });
      
      logger.info(`Resumen manual generado por ${interaction.user.tag}`);
      
    } catch (error) {
      logger.error('Error en comando /resumen:', error);
      
      await interaction.editReply({
        content: '❌ Error al generar el resumen semanal.'
      });
    }
  }
};