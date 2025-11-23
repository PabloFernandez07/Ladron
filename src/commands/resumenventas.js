// ==========================================
// src/commands/resumenventas.js
// ==========================================
const { SlashCommandBuilder } = require('discord.js');
const ventaRegistroService = require('../services/ventaRegistroService');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resumenventas')
    .setDescription('Actualiza el resumen semanal de ventas por banda'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: 64 });
      
      await ventaRegistroService.enviarResumenVentas(interaction.guild);
      
      await interaction.editReply({
        content: '✅ Resumen de ventas actualizado correctamente.'
      });
      
      logger.info(`Resumen de ventas manual generado por ${interaction.user.tag}`);
      
    } catch (error) {
      logger.error('Error en comando /resumenventas:', error);
      
      await interaction.editReply({
        content: '❌ Error al generar el resumen de ventas.'
      });
    }
  }
};