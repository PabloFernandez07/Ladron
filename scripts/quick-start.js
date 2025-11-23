// ==========================================
// scripts/quick-start.js
// Script para iniciar todo (deploy + start bot)
// ==========================================
const { spawn } = require('child_process');
const path = require('path');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║          🚀 INICIO RÁPIDO DEL BOT DE DISCORD         ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Función para ejecutar comando
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n⏳ Ejecutando: ${command} ${args.join(' ')}\n`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Comando falló con código: ${code}`));
      } else {
        resolve();
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function quickStart() {
  try {
    // 1. Deploy de comandos
    console.log('📦 PASO 1: Desplegando comandos...');
    await runCommand('node', ['scripts/deploy-all.js']);
    
    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ Comandos desplegados exitosamente');
    console.log('═'.repeat(60));
    console.log('');
    
    // 2. Iniciar bot
    console.log('🤖 PASO 2: Iniciando bot...');
    console.log('');
    await runCommand('node', ['src/index.js']);
    
  } catch (error) {
    console.error('');
    console.error('❌ Error durante el inicio:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  quickStart();
}

module.exports = { quickStart };