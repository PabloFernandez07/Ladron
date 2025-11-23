// ==========================================
// scripts/start-dev.js
// Inicia backend y frontend simultáneamente
// ==========================================
const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

console.log('');
log('╔═══════════════════════════════════════════════════════╗', 'cyan');
log('║     🚀 INICIANDO SISTEMA COMPLETO                    ║', 'bright');
log('╚═══════════════════════════════════════════════════════╝', 'cyan');
console.log('');

// ==========================================
// BACKEND (Bot + API)
// ==========================================
log('🔧 Iniciando Backend (Bot + API)...', 'yellow');

const backend = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

backend.on('error', (error) => {
  log(`❌ Error en Backend: ${error.message}`, 'red');
  process.exit(1);
});

// Esperar 3 segundos antes de iniciar el frontend
setTimeout(() => {
  // ==========================================
  // FRONTEND (React)
  // ==========================================
  log('', 'reset');
  log('🎨 Iniciando Frontend (React Dashboard)...', 'yellow');
  log('', 'reset');

  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '../web')
  });

  frontend.on('error', (error) => {
    log(`❌ Error en Frontend: ${error.message}`, 'red');
    backend.kill();
    process.exit(1);
  });

  // ==========================================
  // MENSAJE DE ÉXITO
  // ==========================================
  setTimeout(() => {
    console.log('');
    log('═'.repeat(60), 'green');
    log('✅ SISTEMA COMPLETAMENTE INICIADO', 'green');
    log('═'.repeat(60), 'green');
    console.log('');
    log('📡 Backend (Bot + API):  http://localhost:3100', 'cyan');
    log('🎨 Frontend (Dashboard): http://localhost:5173', 'magenta');
    console.log('');
    log('💡 Para detener: Ctrl+C', 'yellow');
    log('═'.repeat(60), 'green');
    console.log('');
  }, 5000);

  // ==========================================
  // MANEJO DE CIERRE
  // ==========================================
  process.on('SIGINT', () => {
    log('', 'reset');
    log('🛑 Deteniendo sistema...', 'yellow');
    
    frontend.kill('SIGINT');
    backend.kill('SIGINT');
    
    setTimeout(() => {
      log('👋 Sistema detenido correctamente', 'green');
      process.exit(0);
    }, 1000);
  });

  process.on('SIGTERM', () => {
    frontend.kill('SIGTERM');
    backend.kill('SIGTERM');
    process.exit(0);
  });

}, 3100);