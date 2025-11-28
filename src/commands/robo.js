// ==========================================
// src/commands/robo.js - CORREGIDO v2
// ==========================================
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const roboService = require('../services/roboService');
const registroService = require('../services/registroService');
const config = require('../config');
const logger = require('../utils/logger');

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

      logger.info('Iniciando registro de robo', {
        usuario: interaction.user.tag,
        guild: interaction.guild.name
      });

      const data = {
        establecimientoValue: interaction.options.getString('establecimiento'),
        participantes: interaction.options.getString('participantes'),
        exito: interaction.options.getBoolean('exito'),
        imagenUrl: interaction.options.getString('imagen')
      };

      // Registrar el robo
      const { embed, establecimiento } = await roboService.registrarRobo(interaction, data);

      // ✅ 1. Enviar mensaje individual al canal de robos individuales
      const canalIndividualId = config.canales.robosIndividuales || config.canales.robos;
      
      if (canalIndividualId) {
        const canalIndividual = interaction.guild.channels.cache.get(canalIndividualId);
        
        if (canalIndividual) {
          try {
            await canalIndividual.send({ embeds: [embed] });
            logger.info(`Mensaje de robo enviado a canal ${canalIndividual.name}`);
          } catch (sendError) {
            logger.error('Error enviando mensaje de robo:', sendError.message);
          }
        } else {
          logger.warn(`Canal de robos individuales no encontrado: ${canalIndividualId}`);
        }
      }

      // ✅ 2. Actualizar el resumen semanal usando registroService (formato bonito)
      try {
        await registroService.enviarResumenSemanal(interaction.guild);
        logger.info('Resumen semanal actualizado');
      } catch (resumenError) {
        logger.error('Error actualizando resumen semanal:', resumenError.message);
      }

      // Respuesta efímera al usuario
      await interaction.editReply({
        content: `✅ Robo registrado en **${establecimiento.name}**`,
        ephemeral: true
      });

      logger.info('Robo registrado exitosamente');

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
  }
};