// ==========================================
// src/deploy-commands.js - CORREGIDO
// ==========================================
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Intentar cargar config y logger
let config, logger;
try {
  config = require('./config');
  logger = require('./utils/logger');
} catch (error) {
  console.error('⚠️  Error cargando módulos:', error.message);
  require('dotenv').config();
  
  // Logger simple de fallback
  logger = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    error: (msg, err) => console.error(`❌ ${msg}`, err?.message || ''),
    warn: (msg) => console.warn(`⚠️  ${msg}`),
    debug: (msg) => {} // silencioso en producción
  };
  
  // Config mínima
  config = {
    discord: {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.CLIENT_ID,
      guildIds: process.env.GUILD_IDS?.split(',').map(id => id.trim()) || []
    }
  };
}

async function deployCommands() {
  try {
    logger.info('🚀 Iniciando despliegue de comandos...');
    
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    
    // Verificar que existe la carpeta de comandos
    if (!fs.existsSync(commandsPath)) {
      throw new Error(`No se encontró la carpeta de comandos: ${commandsPath}`);
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    
    // Cargar comandos
    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)]; // Limpiar cache
        const command = require(filePath);
        
        if (!command.data) {
          logger.warn(`⚠️ "${file}" no tiene la propiedad 'data'. Saltando...`);
          continue;
        }
        
        if (typeof command.data.toJSON !== 'function') {
          logger.warn(`⚠️ "${file}" no tiene método 'toJSON'. Saltando...`);
          continue;
        }
        
        commands.push(command.data.toJSON());
        logger.debug(`✓ Comando cargado: ${command.data.name}`);
      } catch (error) {
        logger.error(`❌ Error cargando "${file}":`, error);
      }
    }
    
    if (commands.length === 0) {
      logger.error('❌ No se encontraron comandos válidos para desplegar');
      return;
    }
    
    logger.info(`📦 ${commands.length} comandos preparados para desplegar`);
    
    // Validar credenciales
    if (!config.discord.token) {
      throw new Error('DISCORD_TOKEN no está definido en .env');
    }
    
    if (!config.discord.clientId) {
      throw new Error('CLIENT_ID no está definido en .env');
    }
    
    // Configurar REST
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    
    // Validar guilds
    if (config.discord.guildIds.length === 0) {
      throw new Error('No se han definido GUILD_IDS en .env');
    }
    
    // Desplegar en cada servidor
    for (const guildId of config.discord.guildIds) {
      try {
        logger.info(`📤 Desplegando comandos en servidor: ${guildId}`);
        
        await rest.put(
          Routes.applicationGuildCommands(config.discord.clientId, guildId),
          { body: commands }
        );
        
        logger.info(`✅ Comandos desplegados en ${guildId}`);
      } catch (error) {
        logger.error(`❌ Error desplegando en ${guildId}:`, error);
      }
    }
    
    logger.info('🎉 Despliegue de comandos completado');
    
  } catch (error) {
    logger.error('❌ Error fatal en deploy-commands:', error);
    console.error('\n💡 Sugerencias:');
    console.error('  1. Verifica que DISCORD_TOKEN esté en .env');
    console.error('  2. Verifica que CLIENT_ID esté en .env');
    console.error('  3. Verifica que GUILD_IDS esté en .env\n');
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  deployCommands()
    .then(() => {
      logger.info('✅ Proceso completado');
      process.exit(0);
    })
    .catch(error => {
      logger.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { deployCommands };