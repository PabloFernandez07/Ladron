// ==========================================
// scripts/start-all.js
// Script único que hace TODO
// ==========================================
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     🚀 INICIO COMPLETO DEL BOT DE DISCORD           ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, title) {
  console.log('');
  log('═'.repeat(60), 'cyan');
  log(`${step}. ${title}`, 'bright');
  log('═'.repeat(60), 'cyan');
  console.log('');
}

// Función para ejecutar comando y esperar
function runCommand(command, args = [], description = '') {
  return new Promise((resolve, reject) => {
    if (description) {
      log(`⏳ ${description}...`, 'yellow');
    }
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${description || 'Comando'} falló con código: ${code}`));
      } else {
        if (description) {
          log(`✅ ${description} completado`, 'green');
        }
        resolve();
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Función para verificar archivos
function checkFiles() {
  log('🔍 Verificando archivos necesarios...', 'cyan');
  
  const requiredFiles = [
    '.env',
    'data/productos.json',
    'data/bandas.json',
    'data/establecimientos.json',
    'data/robos_semanales.json'
  ];
  
  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    log(`⚠️  Faltan archivos: ${missing.join(', ')}`, 'yellow');
    return false;
  }
  
  log('✅ Todos los archivos necesarios existen', 'green');
  return true;
}

// Función para inicializar archivos si faltan
async function initializeFiles() {
  logStep('1', 'INICIALIZANDO ARCHIVOS DE DATOS');
  
  if (!checkFiles()) {
    log('📁 Creando archivos faltantes...', 'yellow');
    try {
      await runCommand('node', ['scripts/init-data.js'], 'Inicialización de datos');
    } catch (error) {
      log('⚠️  Error en inicialización, continuando...', 'yellow');
    }
  } else {
    log('⏭️  Archivos ya inicializados, saltando...', 'cyan');
  }
}

// Función para verificar base de datos
async function checkDatabase() {
  logStep('2', 'VERIFICANDO BASE DE DATOS');
  
  // Verificar si las tablas existen
  log('🔌 Comprobando conexión a base de datos...', 'cyan');
  
  try {
    const { getPool } = require('../src/database/connection');
    const pool = await getPool();
    
    // Probar una query simple
    const [rows] = await pool.query('SHOW TABLES');
    
    if (rows.length === 0) {
      log('⚠️  Base de datos vacía, ejecutando migración...', 'yellow');
      await runCommand('node', ['src/database/migrate.js'], 'Migración de base de datos');
    } else {
      log(`✅ Base de datos OK (${rows.length} tablas)`, 'green');
    }
  } catch (error) {
    log('⚠️  No se pudo conectar a BD, continuando sin ella...', 'yellow');
    log(`   Razón: ${error.message}`, 'red');
  }
}

// Función para desplegar comandos
async function deployCommands() {
  logStep('3', 'DESPLEGANDO COMANDOS EN DISCORD');
  
  try {
    await runCommand('node', ['scripts/deploy-all.js'], 'Deploy de comandos');
  } catch (error) {
    log('❌ Error en deploy de comandos', 'red');
    throw error;
  }
}

// Función para iniciar el bot
async function startBot() {
  logStep('4', 'INICIANDO BOT');
  
  log('🤖 Iniciando bot de Discord...', 'green');
  console.log('');
  
  // Usar spawn sin esperar (modo attached)
  const bot = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });
  
  bot.on('error', (error) => {
    log(`❌ Error iniciando bot: ${error.message}`, 'red');
    process.exit(1);
  });
  
  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    log('\n\n🛑 Deteniendo bot...', 'yellow');
    bot.kill('SIGINT');
    setTimeout(() => process.exit(0), 1000);
  });
  
  process.on('SIGTERM', () => {
    bot.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  });
}

// Función principal
async function main() {
  const startTime = Date.now();
  
  try {
    // Paso 1: Inicializar archivos
    await initializeFiles();
    
    // Paso 2: Verificar base de datos
    await checkDatabase();
    
    // Paso 3: Deploy de comandos
    await deployCommands();
    
    // Paso 4: Iniciar bot
    console.log('');
    log('═'.repeat(60), 'green');
    log('🎉 TODO LISTO - INICIANDO BOT', 'bright');
    log('═'.repeat(60), 'green');
    console.log('');
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`⏱️  Tiempo de preparación: ${elapsed}s`, 'cyan');
    console.log('');
    
    await startBot();
    
  } catch (error) {
    console.log('');
    log('═'.repeat(60), 'red');
    log('❌ ERROR FATAL', 'red');
    log('═'.repeat(60), 'red');
    console.error('');
    console.error(error.message);
    
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    console.log('');
    log('💡 Sugerencias:', 'yellow');
    log('   1. Verifica tu archivo .env', 'yellow');
    log('   2. Asegúrate de que MySQL esté corriendo', 'yellow');
    log('   3. Revisa los logs arriba para más detalles', 'yellow');
    console.log('');
    
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { main };