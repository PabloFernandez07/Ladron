// ==========================================
// scripts/check-data.js
// Script para verificar integridad de datos
// ==========================================
console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     🔍 VERIFICANDO ARCHIVOS DE DATOS                ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

const requiredFiles = [
  'data/productos.json',
  'data/bandas.json',
  'data/establecimientos.json',
  'data/precios.json',
  'data/robos_semanales.json',
  'data/registro_semanal.json'
];

let allOk = true;

for (const file of requiredFiles) {
  try {
    if (!fs.existsSync(file)) {
      console.log(`❌ Falta: ${file}`);
      allOk = false;
      continue;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(content);
    
    // Verificaciones específicas
    if (file.includes('establecimientos.json')) {
      const hasData = data.bajo?.length > 0 || data.medio?.length > 0 || data.grande?.length > 0;
      if (!hasData) {
        console.log(`⚠️  Vacío: ${file} (no hay establecimientos)`);
      } else {
        console.log(`✅ OK: ${file} (${data.bajo.length + data.medio.length + data.grande.length} establecimientos)`);
      }
    } else if (file.includes('productos.json')) {
      const count = Object.keys(data).length;
      if (count === 0) {
        console.log(`⚠️  Vacío: ${file} (no hay productos)`);
      } else {
        console.log(`✅ OK: ${file} (${count} productos)`);
      }
    } else if (file.includes('bandas.json')) {
      const count = Object.keys(data).length;
      if (count === 0) {
        console.log(`⚠️  Vacío: ${file} (no hay bandas)`);
      } else {
        console.log(`✅ OK: ${file} (${count} bandas)`);
      }
    } else {
      console.log(`✅ OK: ${file}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${file} - ${error.message}`);
    allOk = false;
  }
}

console.log('');

if (allOk) {
  console.log('✅ Todos los archivos de datos están OK');
} else {
  console.log('❌ Algunos archivos tienen problemas');
  console.log('');
  console.log('💡 Ejecuta: npm run init-data');
}

console.log('');