// ==========================================
// scripts/dev.js
// Script para desarrollo con reinicio automático
// ==========================================
const nodemon = require('nodemon');
const path = require('path');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     🔧 MODO DESARROLLO - AUTO RELOAD                 ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

nodemon({
  script: path.join(__dirname, 'start-all.js'),
  ext: 'js json',
  ignore: [
    'node_modules/*',
    'logs/*',
    'data/registros/*',
    'data/registros_ventas/*',
    'data/mensaje_*.json',
    'data/robos_*.json',
    'data/registro_*.json'
  ],
  watch: [
    'src/',
    'scripts/deploy-all.js',
    '.env'
  ],
  delay: 2000
});

nodemon.on('start', () => {
  console.log('🚀 Bot iniciado');
}).on('quit', () => {
  console.log('👋 Bot detenido');
  process.exit();
}).on('restart', (files) => {
  console.log('');
  console.log('🔄 Reiniciando debido a cambios en:', files);
  console.log('');
});