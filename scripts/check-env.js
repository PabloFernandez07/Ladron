// ==========================================
// scripts/check-env.js
// ==========================================
const fs = require('fs');

const required = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_IDS',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

const optional = [
  'CANAL_MENSAJE_ROBOS',
  'CANAL_VENTAS',
  'CANAL_LIMITES_ID',
  'CANAL_AVISOS_ID',
  'USER_IDS',
  'USUARIO_AVISO_ID',
  'SERVER_ROBOS'
];

console.log('🔍 Verificando configuración...\n');

if (!fs.existsSync('.env')) {
  console.error('❌ Archivo .env no encontrado');
  console.log('   Ejecuta: npm run init\n');
  process.exit(1);
}

require('dotenv').config();

let hasErrors = false;
let hasWarnings = false;

console.log('Variables requeridas:');
for (const varName of required) {
  if (!process.env[varName]) {
    console.log(`  ❌ ${varName} - FALTANTE`);
    hasErrors = true;
  } else if (process.env[varName].includes('TU_') || process.env[varName].includes('tu_')) {
    console.log(`  ⚠️  ${varName} - VALOR DE EJEMPLO`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${varName}`);
  }
}

console.log('\nVariables opcionales (pero recomendadas):');
for (const varName of optional) {
  if (!process.env[varName]) {
    console.log(`  ⚠️  ${varName} - No configurada`);
    hasWarnings = true;
  } else {
    console.log(`  ✅ ${varName}`);
  }
}

console.log('\n' + '═'.repeat(50));

if (hasErrors) {
  console.log('❌ Configuración INCOMPLETA');
  console.log('   Completa las variables faltantes en .env\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuración BÁSICA (algunas variables opcionales sin configurar)');
  console.log('   El bot funcionará pero algunas funciones pueden no estar disponibles\n');
} else {
  console.log('✅ Configuración COMPLETA\n');
}