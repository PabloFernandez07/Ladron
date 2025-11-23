// ==========================================
// scripts/init-data.js
// Script para inicializar archivos de datos
// ==========================================
const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     📁 INICIALIZANDO ARCHIVOS DE DATOS              ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Definir estructura de datos
const dataFiles = {
  'data/productos.json': {
    "pistola_9mm": {
      "nombre": "Pistola 9mm",
      "limite_semanal": 10
    },
    "ak47": {
      "nombre": "AK-47",
      "limite_semanal": 5
    }
  },
  
  'data/bandas.json': {
    "banda_ejemplo": {
      "nombre": "Banda Ejemplo",
      "ubicacion": "Centro de la ciudad"
    }
  },
  
  'data/establecimientos.json': {
    "bajo": [
      {
        "name": "Tienda 24/7",
        "value": "tienda_247"
      },
      {
        "name": "Gasolinera",
        "value": "gasolinera"
      }
    ],
    "medio": [
      {
        "name": "Banco Local",
        "value": "banco_local"
      }
    ],
    "grande": [
      {
        "name": "Banco Central",
        "value": "banco_central"
      }
    ]
  },
  
  'data/precios.json': {
    "bandas": {
      "melee": {},
      "calibrebajo": {},
      "calibremedio": {},
      "calibrealto": {},
      "accesorios": {},
      "chalecos": {}
    },
    "racing": {
      "melee": {},
      "calibrebajo": {},
      "calibremedio": {},
      "calibrealto": {},
      "accesorios": {},
      "chalecos": {}
    }
  },
  
  'data/robos_semanales.json': {
    "bajo": {
      "tienda_247": {
        "exitosos": 0,
        "fallidos": 0
      },
      "gasolinera": {
        "exitosos": 0,
        "fallidos": 0
      }
    },
    "medio": {
      "banco_local": {
        "exitosos": 0,
        "fallidos": 0
      }
    },
    "grande": {
      "banco_central": {
        "exitosos": 0,
        "fallidos": 0
      }
    }
  },
  
  'data/registro_semanal.json': {},
  
  'data/robos_diarios.json': {},
  
  'data/mensaje_resumen.json': {
    "resumenId": null,
    "registroId": null,
    "menuId": null
  },
  
  'data/mensaje_resumen_limite.json': {
    "limitebanda": null,
    "menuId": null
  }
};

let created = 0;
let skipped = 0;
let errors = 0;

// Crear carpetas necesarias
const folders = [
  'data',
  'data/registros',
  'data/registros_ventas',
  'logs'
];

console.log('📂 Creando carpetas...\n');

for (const folder of folders) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✅ Creada: ${folder}`);
  } else {
    console.log(`⏭️  Ya existe: ${folder}`);
  }
}

console.log('\n📄 Creando archivos de datos...\n');

// Crear archivos JSON
for (const [filePath, content] of Object.entries(dataFiles)) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Ya existe: ${filePath}`);
      skipped++;
    } else {
      // Crear directorio si no existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Crear archivo
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`✅ Creado: ${filePath}`);
      created++;
    }
  } catch (error) {
    console.error(`❌ Error creando ${filePath}:`, error.message);
    errors++;
  }
}

console.log('');
console.log('═'.repeat(60));
console.log('📊 RESUMEN:');
console.log(`  ✅ Archivos creados: ${created}`);
console.log(`  ⏭️  Archivos existentes: ${skipped}`);
console.log(`  ❌ Errores: ${errors}`);
console.log('═'.repeat(60));
console.log('');

if (errors === 0) {
  console.log('✅ Inicialización completada exitosamente');
  console.log('');
  console.log('💡 Próximos pasos:');
  console.log('   1. Edita los archivos en data/ para personalizar');
  console.log('   2. Ejecuta: npm run deploy');
  console.log('   3. Ejecuta: npm start');
  console.log('');
} else {
  console.log('⚠️  Hubo algunos errores. Revisa los mensajes arriba.');
  console.log('');
  process.exit(1);
}