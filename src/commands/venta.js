// ==========================================
// src/commands/venta.js
// ==========================================
const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ventaService = require('../services/ventaService');
const { caches } = require('../services/cacheService');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('venta')
    .setDescription('Registrar una venta paso a paso'),

  async execute(interaction) {
    try {
      const productos = caches.productos.get();
      
      if (!productos || Object.keys(productos).length === 0) {
        return await interaction.reply({
          content: '❌ No hay productos registrados. Usa `/addproducto` para añadir alguno.',
          ephemeral: true
        });
      }
      
      // Iniciar venta
      ventaService.iniciarVenta(interaction.user.id);
      
      // Crear menú de productos
      const options = Object.entries(productos)
        .map(([id, datos]) => ({
          label: datos.nombre.slice(0, 100),
          value: id.slice(0, 100)
        }))
        .slice(0, 25); // Discord límite
      
      if (options.length === 0) {
        return await interaction.reply({
          content: '❌ No hay productos disponibles.',
          ephemeral: true
        });
      }
      
      const select = new StringSelectMenuBuilder()
        .setCustomId('venta_producto')
        .setPlaceholder('Selecciona un producto')
        .addOptions(options);
      
      const row = new ActionRowBuilder().addComponents(select);
      
      await interaction.reply({
        content: '🛒 Selecciona el primer producto vendido:',
        components: [row],
        ephemeral: true
      });
      
      logger.debug(`Venta iniciada para ${interaction.user.tag}`);
      
    } catch (error) {
      logger.error('Error en comando /venta:', error);
      
      await interaction.reply({
        content: '❌ Ha ocurrido un error al iniciar la venta.',
        ephemeral: true
      });
    }
  }
};