// ==========================================
// src/commands/robo.js - CORREGIDO
// ==========================================
const { SlashCommandBuilder } = require('discord.js');
const roboService = require('../services/roboService');
const { caches } = require('../services/cacheService');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robo')
    .setDescription('Registrar un robo realizado')
    .addStringOption(option =>
      option
        .setName('participantes')
        .setDescription('Menciona a los cómplices con @usuario')
        .setRequired(true)
    )
    .addStringOption(option => {
      // Cargar establecimientos dinámicamente
      let establecimientos = {};
      try {
        establecimientos = (caches?.establecimientos?.get && caches.establecimientos.get()) || {};
      } catch (error) {
        logger.error('Error cargando establecimientos:', error);
      }
      
      let opt = option
        .setName('establecimiento')
        .setDescription('¿Qué lugar fue robado?')
        .setRequired(true);
      
      // Agregar separadores y establecimientos
      for (const tipo in establecimientos) {
        // Agregar separador
        opt = opt.addChoices({
          name: `------ Tipo ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ------`,
          value: `separador_${tipo}`
        });
        
        // Agregar establecimientos de este tipo
        const ests = establecimientos[tipo] || [];
        for (const est of ests) {
          opt = opt.addChoices({
            name: est.name,
            value: est.value
          });
        }
      }
      
      return opt;
    })
    .addBooleanOption(option =>
      option
        .setName('exito')
        .setDescription('¿El robo fue exitoso?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('imagen')
        .setDescription('URL de imagen (opcional)')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName('archivo')
        .setDescription('Imagen como archivo (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const participantes = interaction.options.getString('participantes');
      const establecimientoValue = interaction.options.getString('establecimiento');
      const exito = interaction.options.getBoolean('exito');
      const imagenURL = interaction.options.getString('imagen');
      const imagenAdjunta = interaction.options.getAttachment('archivo');
      
      // Validar que no sea un separador
      if (establecimientoValue.startsWith('separador')) {
        return await interaction.editReply({
          content: '❌ Selecciona un establecimiento válido (no un separador).',
          ephemeral: true
        });
      }
      
      // Determinar URL de imagen
      let imagenFinal = null;
      if (imagenURL) {
        imagenFinal = imagenURL;
      } else if (imagenAdjunta) {
        imagenFinal = imagenAdjunta.url;
      }
      
      // Registrar robo usando el servicio
      const { embed, establecimiento } = await roboService.registrarRobo(interaction, {
        participantes,
        establecimientoValue,
        exito,
        imagenUrl: imagenFinal
      });
      
      // Enviar al canal de robos
      const canalId = config.canales.robos;
      
      if (!canalId) {
        logger.warn('CANAL_MENSAJE_ROBOS no está configurado en .env');
        return await interaction.editReply({
          content: '⚠️ El canal de robos no está configurado. Contacta al administrador.',
          ephemeral: true
        });
      }
      
      const canal = interaction.guild.channels.cache.get(canalId);
      
      if (!canal) {
        return await interaction.editReply({
          content: `❌ No se encontró el canal de robos (ID: ${canalId}). Verifica la configuración.`,
          ephemeral: true
        });
      }
      
      // Enviar mensaje al canal
      const mensaje = await canal.send({ embeds: [embed] });
      await mensaje.react(exito ? '✅' : '❌');
      
      await interaction.editReply({
        content: '✅ Robo registrado correctamente.',
        ephemeral: true
      });
      
    } catch (error) {
      logger.error('Error en comando /robo:', error);
      
      const errorMsg = error.message || 'Ha ocurrido un error al registrar el robo.';
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: `❌ ${errorMsg}`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `❌ ${errorMsg}`,
          ephemeral: true
        });
      }
    }
  }
};