// ==========================================
// src/index.js - ARCHIVO PRINCIPAL
// ==========================================
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Cargar configuración y logger
let config, logger;
try {
  config = require('./config');
  logger = require('./utils/logger');
} catch (error) {
  console.error('❌ Error cargando configuración:', error.message);
  console.error('💡 Asegúrate de tener el archivo .env configurado correctamente');
  process.exit(1);
}

const { getPool } = require('./database/connection');

// Inicializar cliente de Discord
// NOTA: Solo GuildMessages requiere permisos especiales en Discord Developer Portal
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
    // GatewayIntentBits.GuildMessages,  // Deshabilitado - requiere permiso
    // GatewayIntentBits.MessageContent  // Deshabilitado - requiere permiso
  ]
});

// Colección de comandos
client.commands = new Collection();

// ==========================================
// FUNCIÓN: Cargar Comandos
// ==========================================
function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.error('No se encontró la carpeta de comandos');
    return;
  }
  
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  
  logger.info(`📦 Cargando ${commandFiles.length} comandos...`);
  
  let loaded = 0;
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if (!command.data || !command.execute) {
        logger.warn(`⚠️  Comando ${file} no tiene data o execute`);
        continue;
      }
      
      client.commands.set(command.data.name, command);
      logger.debug(`  ✓ ${command.data.name}`);
      loaded++;
    } catch (error) {
      logger.error(`Error cargando comando ${file}:`, error);
    }
  }
  
  logger.info(`✅ ${loaded} comandos cargados correctamente`);
}

// ==========================================
// FUNCIÓN: Cargar Eventos
// ==========================================
function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  
  if (!fs.existsSync(eventsPath)) {
    logger.error('No se encontró la carpeta de eventos');
    return;
  }
  
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  
  logger.info(`📦 Cargando ${eventFiles.length} eventos...`);
  
  let loaded = 0;
  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      
      if (!event.name || !event.execute) {
        logger.warn(`⚠️  Evento ${file} no tiene name o execute`);
        continue;
      }
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      
      logger.debug(`  ✓ ${event.name}`);
      loaded++;
    } catch (error) {
      logger.error(`Error cargando evento ${file}:`, error);
    }
  }
  
  logger.info(`✅ ${loaded} eventos cargados correctamente`);
}

// ==========================================
// MANEJO DE ERRORES GLOBALES
// ==========================================
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('El bot se cerrará por seguridad...');
  process.exit(1);
});

// ==========================================
// MANEJO DE SEÑALES DE TERMINACIÓN
// ==========================================
process.on('SIGINT', async () => {
  logger.info('SIGINT recibido (Ctrl+C), cerrando bot...');
  await shutdown();
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido, cerrando bot...');
  await shutdown();
});

async function shutdown() {
  try {
    logger.info('🛑 Iniciando proceso de cierre...');
    
    // Cerrar conexión a base de datos
    try {
      const pool = await getPool();
      await pool.end();
      logger.info('✅ Conexión a BD cerrada');
    } catch (error) {
      logger.warn('No se pudo cerrar la conexión a BD:', error.message);
    }
    
    // Cerrar servidores Express si existen
    if (client.servidores) {
      try {
        if (client.servidores.robos?.server) {
          client.servidores.robos.server.close();
        }
        if (client.servidores.ventas?.server) {
          client.servidores.ventas.server.close();
        }
        logger.info('✅ Servidores Express cerrados');
      } catch (error) {
        logger.warn('No se pudieron cerrar los servidores Express:', error.message);
      }
    }
    
    // Destruir cliente de Discord
    client.destroy();
    logger.info('✅ Cliente de Discord destruido');
    
    logger.info('👋 Bot cerrado correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('Error durante el cierre:', error);
    process.exit(1);
  }
}

// ==========================================
// FUNCIÓN DE INICIALIZACIÓN
// ==========================================
async function init() {
  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║          🤖 INICIANDO BOT DE DISCORD             ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
    
    logger.info(`Node version: ${process.version}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Zona horaria: ${process.env.TZ || 'Sistema'}`);
    
    // Verificar conexión a base de datos
    logger.info('🔌 Verificando conexión a base de datos...');
    try {
      await getPool();
      logger.info('✅ Conexión a base de datos establecida');
    } catch (error) {
      logger.error('❌ Error conectando a base de datos:', error);
      logger.warn('⚠️  El bot continuará pero algunas funciones pueden no estar disponibles');
    }
    
    // Cargar comandos
    loadCommands();
    
    // Cargar eventos
    loadEvents();
    
    // Iniciar servidores Express
    try {
      const { iniciarServidores } = require('./server');
      iniciarServidores(client);
      logger.info('✅ Servidores Express iniciados');
    } catch (error) {
      logger.error('❌ Error iniciando servidores Express:', error);
      logger.warn('⚠️  El bot continuará sin los endpoints HTTP');
    }
    
    // Login en Discord
    logger.info('🔐 Iniciando sesión en Discord...');
    await client.login(config.discord.token);
    
  } catch (error) {
    logger.error('❌ Error fatal durante la inicialización:', error);
    
    if (error.message.includes('TOKEN')) {
      logger.error('💡 Verifica que DISCORD_TOKEN esté correctamente configurado en .env');
    }
    
    process.exit(1);
  }
}

// ==========================================
// INICIAR EL BOT
// ==========================================
init();

// ==========================================
// EXPORTAR CLIENTE (para testing)
// ==========================================
module.exports = client;