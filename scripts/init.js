// ==========================================
// scripts/init.js
// ==========================================
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function init() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   🤖 INICIALIZADOR DEL BOT DE DISCORD           ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Crear estructura de carpetas
    console.log('📁 Creando estructura de carpetas...');
    
    const folders = [
      'data',
      'data/registros',
      'data/registros_ventas',
      'logs',
      'src/commands',
      'src/events',
      'src/handlers',
      'src/services',
      'src/database',
      'src/utils',
      'src/config',
      'src/cron'
    ];

    for (const folder of folders) {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`  ✓ ${folder}`);
      }
    }

    // Crear archivos JSON iniciales
    console.log('\n📄 Creando archivos de datos iniciales...');

    const dataFiles = {
      'data/productos.json': {
        "ejemplo_producto": {
          "nombre": "Producto Ejemplo",
          "limite_semanal": 10
        }
      },
      'data/bandas.json': {
        "banda_ejemplo": {
          "nombre": "Banda Ejemplo",
          "ubicacion": "Ubicación Ejemplo"
        }
      },
      'data/establecimientos.json': {
        "bajo": [
          {
            "name": "Tienda 24/7",
            "value": "tienda_247"
          }
        ],
        "medio": [],
        "grande": []
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
        "bajo": {},
        "medio": {},
        "grande": {}
      },
      'data/registro_semanal.json': {}
    };

    for (const [file, content] of Object.entries(dataFiles)) {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(content, null, 2));
        console.log(`  ✓ ${file}`);
      }
    }

    // Crear .env si no existe
    if (!fs.existsSync('.env')) {
      console.log('\n🔐 Configurando variables de entorno...\n');

      const token = await ask('Discord Bot Token: ');
      const clientId = await ask('Discord Client ID: ');
      const guildIds = await ask('Guild IDs (separados por coma): ');
      
      const dbHost = await ask('Base de datos - Host [localhost]: ') || 'localhost';
      const dbUser = await ask('Base de datos - Usuario: ');
      const dbPass = await ask('Base de datos - Contraseña: ');
      const dbName = await ask('Base de datos - Nombre [discord_bot]: ') || 'discord_bot';

      const envContent = `# Discord
DISCORD_TOKEN=${token}
CLIENT_ID=${clientId}
GUILD_IDS=${guildIds}

# Canales
CANAL_MENSAJE_ROBOS=
CANAL_VENTAS=
CANAL_LIMITES_ID=
CANAL_AVISOS_ID=

# Base de Datos
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPass}
DB_NAME=${dbName}
DB_PORT=3306

# Usuarios Admin (separados por coma)
USER_IDS=

# Usuario para avisos
USUARIO_AVISO_ID=

# Servidor principal
SERVER_ROBOS=

# Express
EXPRESS_PORT=3000
EXPRESS_PORT_VENTAS=3001

# Límites
LIMITE_ROBOS_DIARIOS=3
LIMITE_PARTICIPANTES_MAX=10
`;

      fs.writeFileSync('.env', envContent);
      console.log('\n✅ Archivo .env creado');
      console.log('⚠️  IMPORTANTE: Completa los IDs de canales y usuarios en .env');
    }

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║              ✅ INICIALIZACIÓN COMPLETA          ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('📋 Próximos pasos:\n');
    console.log('1. Completa los IDs faltantes en el archivo .env');
    console.log('2. Ejecuta: npm run migrate  (para crear la BD)');
    console.log('3. Ejecuta: npm run deploy   (para registrar comandos)');
    console.log('4. Ejecuta: npm start        (para iniciar el bot)\n');

  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

init();