// ==========================================
// src/commands/robo.js - CON LOGS DE DEBUG
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

      logger.info('🔵 [ROBO] Iniciando registro de robo', {
        usuario: interaction.user.tag,
        userId: interaction.user.id,
        guild: interaction.guild.name,
        guildId: interaction.guild.id
      });

      const data = {
        establecimientoValue: interaction.options.getString('establecimiento'),
        participantes: interaction.options.getString('participantes'),
        exito: interaction.options.getBoolean('exito'),
        imagenUrl: interaction.options.getString('imagen')
      };

      logger.info('🔵 [ROBO] Datos del robo:', data);

      // Registrar el robo
      const { embed, establecimiento } = await roboService.registrarRobo(interaction, data);

      logger.info('✅ [ROBO] Robo registrado en servicio');

      // ✅ CAMBIO 1: Enviar mensaje individual al nuevo canal
      logger.info(`🔍 [ROBO INDIVIDUAL] Buscando canal: ${CANAL_ROBOS_INDIVIDUALES}`);
      logger.info(`🔍 [ROBO INDIVIDUAL] Canales disponibles en el servidor:`, {
        total: interaction.guild.channels.cache.size,
        canales: interaction.guild.channels.cache.map(c => ({
          id: c.id,
          nombre: c.name,
          tipo: c.type
        }))
      });

      const canalIndividual = interaction.guild.channels.cache.get(CANAL_ROBOS_INDIVIDUALES);
      
      if (canalIndividual) {
        logger.info(`✅ [ROBO INDIVIDUAL] Canal encontrado: ${canalIndividual.name} (${canalIndividual.id})`);
        
        try {
          await canalIndividual.send({ embeds: [embed] });
          logger.info(`✅ [ROBO INDIVIDUAL] Mensaje enviado exitosamente al canal ${canalIndividual.name}`);
        } catch (sendError) {
          logger.error(`❌ [ROBO INDIVIDUAL] Error enviando mensaje:`, sendError);
        }
      } else {
        logger.warn(`⚠️ [ROBO INDIVIDUAL] Canal ${CANAL_ROBOS_INDIVIDUALES} NO encontrado`);
        logger.warn(`⚠️ [ROBO INDIVIDUAL] Verifica que el bot tenga acceso al canal y que el ID sea correcto`);
      }

      // ✅ CAMBIO 2: Resumen semanal se envía al canal original (CANAL_MENSAJE_ROBOS)
      logger.info(`🔍 [RESUMEN SEMANAL] Buscando canal de resumen: ${config.canales.robos}`);
      
      const canalResumen = interaction.guild.channels.cache.get(config.canales.robos);
      
      if (canalResumen) {
        logger.info(`✅ [RESUMEN SEMANAL] Canal encontrado: ${canalResumen.name} (${canalResumen.id})`);
        
        const resumenEmbed = this.crearResumenSemanal();
        if (resumenEmbed) {
          try {
            await canalResumen.send({ embeds: [resumenEmbed] });
            logger.info(`✅ [RESUMEN SEMANAL] Resumen enviado exitosamente al canal ${canalResumen.name}`);
          } catch (sendError) {
            logger.error(`❌ [RESUMEN SEMANAL] Error enviando resumen:`, sendError);
          }
        } else {
          logger.info(`ℹ️ [RESUMEN SEMANAL] No hay datos para crear resumen`);
        }
      } else {
        logger.warn(`⚠️ [RESUMEN SEMANAL] Canal ${config.canales.robos} NO encontrado`);
      }

      // Respuesta efímera al usuario
      await interaction.editReply({
        content: `✅ Robo registrado en **${establecimiento.name}**`,
        ephemeral: true
      });

      logger.info('✅ [ROBO] Proceso completado exitosamente');

    } catch (error) {
      logger.error('❌ [ROBO] Error ejecutando comando /robo:', error);
      
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