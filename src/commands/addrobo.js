// ==========================================
// src/commands/addrobo.js
// ==========================================
const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
const { caches } = require('../services/cacheService');
const config = require('../config');
const logger = require('../utils/logger');

function generarValor(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]|_/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrobo')
    .setDescription('Añade un nuevo establecimiento al sistema de robos')
    .addStringOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre del establecimiento')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Tipo de robo (bajo, medio, grande)')
        .setRequired(true)
        .addChoices(
          { name: 'Bajo', value: 'bajo' },
          { name: 'Medio', value: 'medio' },
          { name: 'Grande', value: 'grande' }
        )
    )
    .addStringOption(option =>
      option
        .setName('tiporobo')
        .setDescription('Clasificación especial (Opcional)')
        .setRequired(false)
        .addChoices(
          { name: 'T1', value: 't1' },
          { name: 'T2', value: 't2' },
          { name: 'T1 Racing', value: 't1rc' },
          { name: 'T2 Racing', value: 't2rc' },
          { name: 'RC (Racing Crew)', value: 'rc' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('limite')
        .setDescription('Límite de robos permitidos (Opcional)')
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option
        .setName('tipolimite')
        .setDescription('¿El límite es diario o semanal?')
        .setRequired(false)
        .addChoices(
          { name: 'Diario', value: 'diario' },
          { name: 'Semanal', value: 'semanal' }
        )
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
      const tipo = interaction.options.getString('tipo');
      const tipoRobo = interaction.options.getString('tiporobo');
      const limite = interaction.options.getInteger('limite');
      const tipolimite = interaction.options.getString('tipolimite');

      // Validar que si hay límite, debe haber tipo de límite
      if (limite !== null && !tipolimite) {
        return await interaction.reply({
          content: '⚠️ Si defines un límite, también debes especificar si es diario o semanal.',
          ephemeral: true
        });
      }

      const valor = generarValor(nombre);

      // Cargar establecimientos
      const establecimientos = caches.establecimientos.get() || {};

      // Verificar que no existe
      if (establecimientos[tipo]?.some(e => e.value === valor)) {
        return await interaction.reply({
          content: `❌ El establecimiento "${nombre}" ya existe como \`${valor}\` en tipo "${tipo}".`,
          ephemeral: true
        });
      }

      // Crear nuevo establecimiento
      if (!establecimientos[tipo]) {
        establecimientos[tipo] = [];
      }

      const nuevoEstablecimiento = {
        name: nombre,
        value: valor
      };

      if (tipoRobo) nuevoEstablecimiento.tiporobo = tipoRobo;
      if (limite !== null) nuevoEstablecimiento.limite = limite;
      if (tipolimite) nuevoEstablecimiento.tipolimite = tipolimite;

      establecimientos[tipo].push(nuevoEstablecimiento);

      // Guardar
      caches.establecimientos.set(establecimientos);

      // Inicializar en resumen
      const resumen = caches.robosSemana.get() || {};

      if (!resumen[tipo]) resumen[tipo] = {};
      if (!resumen[tipo][valor]) {
        resumen[tipo][valor] = {
          exitosos: 0,
          fallidos: 0
        };

        // Si es RC, agregar contador semanal
        if (tipoRobo === 'rc') {
          resumen[tipo][valor].semanal = {
            exitosos: 0,
            fallidos: 0
          };
        }
      }

      caches.robosSemana.set(resumen);

      // Re-desplegar comandos
      await interaction.deferReply({ ephemeral: true });

      exec('npm run deploy', (error, stdout, stderr) => {
        if (error) {
          logger.error('Error al re-desplegar comandos:', error);
        } else {
          logger.info('Comandos re-desplegados automáticamente');
        }
      });

      await interaction.editReply({
        content: `✅ Establecimiento "${nombre}" añadido correctamente al tipo "${tipo}".\n\n` +
                 `Los comandos se están actualizando automáticamente...`,
        ephemeral: true
      });

      logger.info(`Establecimiento añadido: ${nombre} (${valor})`, {
        tipo,
        tipoRobo,
        limite,
        tipolimite,
        usuario: interaction.user.tag
      });

    } catch (error) {
      logger.error('Error en comando /addrobo:', error);

      const errorMsg = {
        content: '❌ Error al añadir el establecimiento.',
        ephemeral: true
      };

      if (interaction.deferred) {
        await interaction.editReply(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
};