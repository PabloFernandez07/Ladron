// ==========================================
// src/commands/robo.js - ACTUALIZADO
// ==========================================
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const roboService = require('../services/roboService');
const config = require('../config');
const logger = require('../utils/logger');

// ✅ NUEVO: Canal específico para mensajes individuales de robos
const CANAL_ROBOS_INDIVIDUALES = '1412269349275697215';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robo')
    .setDescription('Registrar un nuevo robo')
    .addStringOption(option =>
      option.setName('establecimiento')
        .setDescription('Establecimiento robado')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option.setName('participantes')
        .setDescription('Menciona a los participantes (@usuario1 @usuario2)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('exito')
        .setDescription('¿Fue exitoso?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('imagen')
        .setDescription('URL de la imagen del robo')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const data = {
        establecimientoValue: interaction.options.getString('establecimiento'),
        participantes: interaction.options.getString('participantes'),
        exito: interaction.options.getBoolean('exito'),
        imagenUrl: interaction.options.getString('imagen')
      };

      // Registrar el robo
      const { embed, establecimiento } = await roboService.registrarRobo(interaction, data);

      // ✅ CAMBIO 1: Enviar mensaje individual al nuevo canal
      const canalIndividual = interaction.guild.channels.cache.get(CANAL_ROBOS_INDIVIDUALES);
      
      if (canalIndividual) {
        await canalIndividual.send({ embeds: [embed] });
        logger.info(`Mensaje de robo individual enviado a canal ${CANAL_ROBOS_INDIVIDUALES}`);
      } else {
        logger.warn(`Canal de robos individuales ${CANAL_ROBOS_INDIVIDUALES} no encontrado`);
      }

      // ✅ CAMBIO 2: Resumen semanal se envía al canal original (CANAL_MENSAJE_ROBOS)
      const canalResumen = interaction.guild.channels.cache.get(config.canales.robos);
      
      if (canalResumen) {
        const resumenEmbed = this.crearResumenSemanal();
        if (resumenEmbed) {
          await canalResumen.send({ embeds: [resumenEmbed] });
          logger.info(`Resumen semanal enviado a canal ${config.canales.robos}`);
        }
      } else {
        logger.warn(`Canal de resumen semanal ${config.canales.robos} no encontrado`);
      }

      // Respuesta efímera al usuario
      await interaction.editReply({
        content: `✅ Robo registrado en **${establecimiento.name}**`,
        ephemeral: true
      });

    } catch (error) {
      logger.error('Error ejecutando comando /robo:', error);
      
      const errorMsg = error.message || 'Error desconocido';
      
      await interaction.editReply({
        content: `❌ Error: ${errorMsg}`,
        ephemeral: true
      }).catch(() => {});
    }
  },

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const { caches } = require('../services/cacheService');
      const establecimientos = caches.establecimientos.get();

      if (!establecimientos) {
        return await interaction.respond([]);
      }

      let opciones = [];
      for (const tipo in establecimientos) {
        const tipoInfo = config.tipos[tipo];
        opciones.push(
          ...establecimientos[tipo].map(est => ({
            name: `${tipoInfo.emoji} ${est.name}`,
            value: est.value
          }))
        );
      }

      const filtradas = opciones.filter(opcion =>
        opcion.name.toLowerCase().includes(focusedValue)
      );

      await interaction.respond(filtradas.slice(0, 25));

    } catch (error) {
      logger.error('Error en autocomplete:', error);
      await interaction.respond([]).catch(() => {});
    }
  },

  crearResumenSemanal() {
    const { caches } = require('../services/cacheService');
    const resumen = caches.robosSemana.get();

    if (!resumen || Object.keys(resumen).length === 0) {
      return null;
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Resumen Semanal de Robos')
      .setColor('#00ff00')
      .setTimestamp();

    for (const tipo in resumen) {
      const tipoInfo = config.tipos[tipo];
      let texto = '';

      for (const establecimiento in resumen[tipo]) {
        const stats = resumen[tipo][establecimiento];
        texto += `**${establecimiento}**: ${stats.exitosos} ✅ / ${stats.fallidos} ❌\n`;
      }

      if (texto) {
        embed.addFields({
          name: `${tipoInfo.emoji} ${tipoInfo.label}`,
          value: texto,
          inline: false
        });
      }
    }

    return embed;
  }
};