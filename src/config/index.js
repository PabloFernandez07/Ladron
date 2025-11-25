// ==========================================
// src/config/index.js
// ==========================================
require('dotenv-safe').config();

const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildIds: process.env.GUILD_IDS?.split(',').map(id => id.trim()) || []
  },
  
  canales: {
    robos: process.env.CANAL_MENSAJE_ROBOS, // Resumen semanal
    robosIndividuales: process.env.CANAL_ROBOS_INDIVIDUALES, // Mensajes individuales
    ventas: process.env.CANAL_VENTAS,
    limites: process.env.CANAL_LIMITES_ID,
    avisos: process.env.CANAL_AVISOS_ID
  },
  
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  servidores: {
    principal: process.env.SERVER_ROBOS
  },
  
  usuarios: {
    admins: process.env.USER_IDS?.split(',').map(id => id.trim()) || [],
    avisos: process.env.USUARIO_AVISO_ID
  },
  
  limites: {
    robosDiarios: parseInt(process.env.LIMITE_ROBOS_DIARIOS || '3'),
    participantesMax: parseInt(process.env.LIMITE_PARTICIPANTES_MAX || '10'),
    productos: {
      joyeria: 1,
      pawshop: 0,
      t1: 1,
      t2: 1,
      t1rc: 1,
      t2rc: 2
    }
  },
  
  express: {
    port: parseInt(process.env.EXPRESS_PORT || '3100'),
    portVentas: parseInt(process.env.EXPRESS_PORT_VENTAS || '3101')
  },
  
  tipos: {
    bajo: { label: 'Robo Bajo', color: 0x57F287, emoji: '🟢' },
    medio: { label: 'Robo Medio', color: 0xFAA61A, emoji: '🟡' },
    grande: { label: 'Robo Grande', color: 0xED4245, emoji: '🔴' }
  },
  
  paths: {
    data: './data',
    registros: './data/registros',
    registrosVentas: './data/registros_ventas',
    logs: './logs'
  }
};

// Validar configuración crítica
function validateConfig() {
  const required = [
    'discord.token',
    'discord.clientId',
    'database.host',
    'database.user',
    'database.password'
  ];
  
  const missing = [];
  
  for (const path of required) {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        missing.push(path);
        break;
      }
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`❌ Faltan configuraciones requeridas: ${missing.join(', ')}`);
  }
}

validateConfig();

module.exports = config;