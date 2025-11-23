// ==========================================
// src/commands/logs.js
// Comando para ver logs desde Discord
// ==========================================
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const logViewer = require('../utils/logViewer');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Ver logs del bot (solo administradores)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Listar todos los archivos de log')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tail')
        .setDescription('Ver últimas líneas de un log')
        .addStringOption(option =>
          option
            .setName('archivo')
            .setDescription('Archivo de log')
            .setRequired(true)
            .addChoices(
              { name: 'Console (todos los console.log)', value: 'console.log' },
              { name: 'Combined (todos los niveles)', value: 'combined.log' },
              { name: 'Errores', value: 'error.log' },
              { name: 'Comandos', value: 'commands.log' },
              { name: 'Excepciones', value: 'exceptions.log' }
            )
        )
        .addIntegerOption(option =>
          option
            .setName('lineas')
            .setDescription('Número de líneas (default: 50)')
            .setMinValue(10)
            .setMaxValue(200)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('download')
        .setDescription('Descargar un archivo de log completo')
        .addStringOption(option =>
          option
            .setName('archivo')
            .setDescription('Archivo de log')
            .setRequired(true)
            .addChoices(
              { name: 'Console', value: 'console.log' },
              { name: 'Combined', value: 'combined.log' },
              { name: 'Errores', value: 'error.log' },
              { name: 'Comandos', value: 'commands.log' },
              { name: 'Excepciones', value: 'exceptions.log' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Buscar en los logs')
        .addStringOption(option =>
          option
            .setName('texto')
            .setDescription('Texto a buscar')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('archivo')
            .setDescription('Archivo donde buscar (default: combined.log)')
            .addChoices(
              { name: 'Console', value: 'console.log' },
              { name: 'Combined', value: 'combined.log' },
              { name: 'Errores', value: 'error.log' },
              { name: 'Comandos', value: 'commands.log' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Ver estadísticas de los logs')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Limpiar un archivo de log')
        .addStringOption(option =>
          option
            .setName('archivo')
            .setDescription('Archivo de log a limpiar')
            .setRequired(true)
            .addChoices(
              { name: 'Console', value: 'console.log' },
              { name: 'Combined', value: 'combined.log' },
              { name: 'Comandos', value: 'commands.log' }
            )
        )
    ),

  async execute(interaction) {
    try {
      // Verificar permisos de administrador
      if (!config.usuarios.admins.includes(interaction.user.id)) {
        return await interaction.reply({
          content: '⛔ Solo los administradores pueden ver los logs.',
          flags: 64
        });
      }
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'list':
          await handleList(interaction);
          break;
        case 'tail':
          await handleTail(interaction);
          break;
        case 'download':
          await handleDownload(interaction);
          break;
        case 'search':
          await handleSearch(interaction);
          break;
        case 'stats':
          await handleStats(interaction);
          break;
        case 'clear':
          await handleClear(interaction);
          break;
      }
      
    } catch (error) {
      logger.error('Error en comando /logs:', error);
      
      const errorMsg = {
        content: '❌ Error al procesar el comando de logs.',
        flags: 64
      };
      
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
};

async function handleList(interaction) {
  const files = logViewer.list();
  
  if (files.length === 0) {
    return await interaction.reply({
      content: '📂 No hay archivos de log.',
      flags: 64
    });
  }
  
  let response = '📋 **Archivos de Log Disponibles:**\n\n';
  
  for (const file of files) {
    const stats = logViewer.stats(file);
    response += `📄 \`${file}\` - ${stats.size} (${stats.lines} líneas)\n`;
  }
  
  await interaction.reply({
    content: response,
    flags: 64
  });
}

async function handleTail(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  const archivo = interaction.options.getString('archivo');
  const lineas = interaction.options.getInteger('lineas') || 50;
  
  const content = logViewer.tail(archivo, lineas);
  
  if (content.length > 1900) {
    // Si es muy largo, enviar como archivo
    const attachment = new AttachmentBuilder(
      Buffer.from(content, 'utf8'),
      { name: `${archivo}.txt` }
    );
    
    await interaction.editReply({
      content: `📄 Últimas ${lineas} líneas de \`${archivo}\`:`,
      files: [attachment]
    });
  } else {
    await interaction.editReply({
      content: `📄 Últimas ${lineas} líneas de \`${archivo}\`:\n\`\`\`\n${content}\n\`\`\``
    });
  }
}

async function handleDownload(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  const archivo = interaction.options.getString('archivo');
  const content = logViewer.read(archivo);
  
  const attachment = new AttachmentBuilder(
    Buffer.from(content, 'utf8'),
    { name: archivo }
  );
  
  await interaction.editReply({
    content: `📥 Descargando \`${archivo}\`...`,
    files: [attachment]
  });
  
  logger.info(`Log descargado: ${archivo}`, {
    user: interaction.user.tag,
    userId: interaction.user.id
  });
}

async function handleSearch(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  const texto = interaction.options.getString('texto');
  const archivo = interaction.options.getString('archivo') || 'combined.log';
  
  const results = logViewer.search(archivo, texto);
  
  if (!results || results.trim().length === 0) {
    return await interaction.editReply({
      content: `🔍 No se encontraron resultados para "${texto}" en \`${archivo}\``
    });
  }
  
  if (results.length > 1900) {
    const attachment = new AttachmentBuilder(
      Buffer.from(results, 'utf8'),
      { name: `busqueda_${texto}.txt` }
    );
    
    await interaction.editReply({
      content: `🔍 Resultados para "${texto}" en \`${archivo}\`:`,
      files: [attachment]
    });
  } else {
    await interaction.editReply({
      content: `🔍 Resultados para "${texto}":\n\`\`\`\n${results}\n\`\`\``
    });
  }
}

async function handleStats(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  const report = logViewer.report();
  
  let response = '📊 **Estadísticas de Logs:**\n\n';
  
  for (const [file, stats] of Object.entries(report)) {
    if (stats.error) {
      response += `❌ \`${file}\`: Error - ${stats.error}\n`;
    } else {
      response += `📄 **${file}**\n`;
      response += `   • Tamaño: ${stats.size}\n`;
      response += `   • Líneas: ${stats.lines}\n`;
      response += `   • Modificado: ${new Date(stats.modified).toLocaleString('es-ES')}\n\n`;
    }
  }
  
  await interaction.editReply({ content: response });
}

async function handleClear(interaction) {
  const archivo = interaction.options.getString('archivo');
  
  // Confirmación
  await interaction.reply({
    content: `⚠️ ¿Estás seguro de que quieres limpiar \`${archivo}\`? Responde "confirmar" en 10 segundos.`,
    flags: 64
  });
  
  // Esperar confirmación
  const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === 'confirmar';
  
  try {
    await interaction.channel.awaitMessages({
      filter,
      max: 1,
      time: 10000,
      errors: ['time']
    });
    
    const result = logViewer.clear(archivo);
    
    await interaction.followUp({
      content: result,
      flags: 64
    });
    
    logger.warn(`Log limpiado: ${archivo}`, {
      user: interaction.user.tag,
      userId: interaction.user.id
    });
    
  } catch (error) {
    await interaction.followUp({
      content: '❌ Operación cancelada (timeout)',
      flags: 64
    });
  }
}