// ==========================================
// src/commands/addbanda.js
// ==========================================
const { SlashCommandBuilder } = require('discord.js');
const { caches } = require('../services/cacheService');
const config = require('../config');
const logger = require('../utils/logger');

function generarValue(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addbanda')
    .setDescription('Añade una nueva banda')
    .addStringOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre de la banda')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('ubicacion')
        .setDescription('Ubicación donde vive la banda')
        .setRequired(true)
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
      const ubicacion = interaction.options.getString('ubicacion');
      const value = generarValue(nombre);
      
      const bandas = caches.bandas.get() || {};
      
      if (bandas[value]) {
        return await interaction.reply({
          content: `⚠️ Ya existe una banda con el ID "${value}".`,
          ephemeral: true
        });
      }
      
      bandas[value] = {
        nombre,
        ubicacion
      };
      
      caches.bandas.set(bandas);
      
      await interaction.reply({
        content: `✅ Banda añadida: **${nombre}**\n📍 Ubicación: ${ubicacion}`,
        ephemeral: true
      });
      
      logger.info(`Banda añadida: ${nombre} (${value}) - ${ubicacion}`, {
        usuario: interaction.user.tag
      });
      
    } catch (error) {
      logger.error('Error en comando /addbanda:', error);
      
      await interaction.reply({
        content: '❌ Error al añadir la banda.',
        ephemeral: true
      });
    }
  }
};