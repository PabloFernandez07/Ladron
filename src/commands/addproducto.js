// ==========================================
// src/commands/addproducto.js
// ==========================================
const { SlashCommandBuilder } = require('discord.js');
const { caches } = require('../services/cacheService');
const config = require('../config');
const logger = require('../utils/logger');

function generarIdDesdeNombre(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addproducto')
    .setDescription('Añadir un nuevo producto con límite semanal')
    .addStringOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre del producto')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('limite')
        .setDescription('Límite semanal general')
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction) {
    try {
      // Verificar permisos
      if (!config.usuarios.admins.includes(interaction.user.id)) {
        return await interaction.reply({
          content: '⛔ No tienes permisos para ejecutar este comando.',
          ephemeral: true
        });
      }
      
      const nombre = interaction.options.getString('nombre');
      const limite = interaction.options.getInteger('limite');
      const id = generarIdDesdeNombre(nombre);
      
      const productos = caches.productos.get() || {};
      
      if (productos[id]) {
        return await interaction.reply({
          content: `⚠️ Ya existe un producto con el ID "${id}".`,
          ephemeral: true
        });
      }
      
      productos[id] = {
        nombre,
        limite_semanal: limite
      };
      
      caches.productos.set(productos);
      
      await interaction.reply({
        content: `✅ Producto **${nombre}** añadido con límite semanal de **${limite}** unidades.`,
        ephemeral: true
      });
      
      logger.info(`Producto añadido: ${nombre} (${id}) - Límite: ${limite}`, {
        usuario: interaction.user.tag
      });
      
    } catch (error) {
      logger.error('Error en comando /addproducto:', error);
      
      await interaction.reply({
        content: '❌ Error al añadir el producto.',
        ephemeral: true
      });
    }
  }
};