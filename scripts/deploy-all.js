// ==========================================
// scripts/deploy-all.js
// Script unificado para deploy y registro de comandos
// ==========================================
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Cargar dotenv
require('dotenv').config();

// Logger simple
const log = {
  info: (msg) => console.log(`✅ ${msg}`),
  error: (msg, err) => console.error(`❌ ${msg}`, err?.message || ''),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  step: (msg) => console.log(`\n${'═'.repeat(60)}\n${msg}\n${'═'.repeat(60)}`)
};

// Validar variables de entorno
function validateEnv() {
  const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_IDS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
}

// Cargar todos los comandos
function loadCommands() {
  log.step('📦 PASO 1: CARGANDO COMANDOS');
  
  const commands = [];
  const commandsPath = path.join(__dirname, '../src/commands');
  
  if (!fs.existsSync(commandsPath)) {
    throw new Error(`No existe la carpeta: ${commandsPath}`);
  }
  
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  
  log.info(`Encontrados ${commandFiles.length} archivos de comandos`);
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      
      // Limpiar caché para recargar
      delete require.cache[require.resolve(filePath)];
      
      const command = require(filePath);
      
      if (!command.data) {
        log.warn(`"${file}" no tiene propiedad 'data', saltando...`);
        continue;
      }
      
      if (typeof command.data.toJSON !== 'function') {
        log.warn(`"${file}" no tiene método 'toJSON', saltando...`);
        continue;
      }
      
      const commandData = command.data.toJSON();
      commands.push(commandData);
      
      log.info(`✓ ${commandData.name.padEnd(20)} - ${commandData.description}`);
      
    } catch (error) {
      log.error(`Error cargando "${file}":`, error);
    }
  }
  
  if (commands.length === 0) {
    throw new Error('No se encontraron comandos válidos');
  }
  
  console.log(`\n✅ Total: ${commands.length} comandos cargados correctamente\n`);
  
  return commands;
}

// Desplegar comandos en todos los servidores
async function deployCommands(commands) {
  log.step('🚀 PASO 2: DESPLEGANDO COMANDOS');
  
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildIds = process.env.GUILD_IDS.split(',').map(id => id.trim());
  
  log.info(`Cliente ID: ${clientId}`);
  log.info(`Servidores objetivo: ${guildIds.length}`);
  console.log('');
  
  const rest = new REST({ version: '10' }).setToken(token);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const guildId of guildIds) {
    try {
      console.log(`⏳ Desplegando en servidor: ${guildId}...`);
      
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      
      log.info(`Desplegado en ${guildId}`);
      results.success.push(guildId);
      
    } catch (error) {
      log.error(`Error en ${guildId}:`, error);
      results.failed.push({ guildId, error: error.message });
    }
  }
  
  return results;
}

// Limpiar comandos globales (opcional)
async function cleanGlobalCommands() {
  log.step('🧹 PASO 3: LIMPIANDO COMANDOS GLOBALES');
  
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] }
    );
    
    log.info('Comandos globales limpiados (si existían)');
  } catch (error) {
    log.warn('No se pudieron limpiar comandos globales:', error.message);
  }
}

// Mostrar resumen
function showSummary(commands, results) {
  log.step('📊 RESUMEN FINAL');
  
  console.log('Comandos desplegados:');
  commands.forEach((cmd, i) => {
    console.log(`  ${i + 1}. /${cmd.name}`);
  });
  
  console.log('');
  console.log(`✅ Exitosos: ${results.success.length}`);
  results.success.forEach(id => console.log(`   - ${id}`));
  
  if (results.failed.length > 0) {
    console.log('');
    console.log(`❌ Fallidos: ${results.failed.length}`);
    results.failed.forEach(({ guildId, error }) => {
      console.log(`   - ${guildId}: ${error}`);
    });
  }
  
  console.log('');
  log.step('🎉 PROCESO COMPLETADO');
  
  if (results.failed.length === 0) {
    console.log('');
    console.log('✅ Todos los comandos fueron desplegados exitosamente');
    console.log('');
    console.log('💡 Ahora puedes:');
    console.log('   1. Iniciar el bot: npm start');
    console.log('   2. Usar los comandos en Discord con /');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️  Algunos servidores fallaron. Verifica:');
    console.log('   1. Que el bot esté en esos servidores');
    console.log('   2. Que los IDs sean correctos');
    console.log('   3. Que el bot tenga permisos');
    console.log('');
  }
}

// Función principal
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     🤖 DEPLOY UNIFICADO DE COMANDOS DE DISCORD      ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Validar entorno
    validateEnv();
    log.info('Variables de entorno validadas');
    console.log('');
    
    // Cargar comandos
    const commands = loadCommands();
    
    // Desplegar comandos
    const results = await deployCommands(commands);
    
    // Limpiar comandos globales
    await cleanGlobalCommands();
    
    // Mostrar resumen
    showSummary(commands, results);
    
    process.exit(results.failed.length === 0 ? 0 : 1);
    
  } catch (error) {
    console.log('');
    log.step('❌ ERROR FATAL');
    console.error(error.message);
    console.error('');
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    console.log('');
    console.log('💡 Sugerencias:');
    console.log('   1. Verifica que el archivo .env existe');
    console.log('   2. Verifica DISCORD_TOKEN, CLIENT_ID y GUILD_IDS');
    console.log('   3. Asegúrate de que los comandos están bien formados');
    console.log('');
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };