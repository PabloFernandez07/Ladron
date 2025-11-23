// ==========================================
// src/cron/resetRobos.js
// ==========================================
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { caches } = require('../services/cacheService');
const registroService = require('../services/registroService');

module.exports = {
  iniciar(client) {
    // Cada lunes a las 20:00 (hora de Madrid)
    cron.schedule('0 20 * * 1', async () => {
      try {
        logger.cron('resetRobos', 'Iniciando reset semanal de robos');
        
        const hoy = new Date();
        const diaDomingo = hoy.getDate().toString().padStart(2, '0');
        const mesDomingo = (hoy.getMonth() + 1).toString().padStart(2, '0');
        
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - 6);
        const diaLunes = lunes.getDate().toString().padStart(2, '0');
        const mesLunes = (lunes.getMonth() + 1).toString().padStart(2, '0');
        
        // Guardar archivo de registro
        await generarArchivoRegistro(diaLunes, mesLunes, diaDomingo, mesDomingo);
        
        // Resetear contadores
        await resetearContadores();
        
        // Enviar resumen
        const guild = client.guilds.cache.get(config.servidores.principal);
        if (guild) {
          await registroService.enviarResumenSemanal(guild);
          logger.cron('resetRobos', 'Resumen semanal enviado');
        }
        
        logger.cron('resetRobos', 'Reset semanal completado');
        
      } catch (error) {
        logger.error('Error en cron resetRobos:', error);
      }
    }, {
      timezone: 'Europe/Madrid'
    });
    
    logger.info('Cron job resetRobos programado');
  }
};

async function generarArchivoRegistro(diaLunes, mesLunes, diaDomingo, mesDomingo) {
  const nombreArchivo = `Registro_Robos_Semana_${diaLunes}-${mesLunes}_${diaDomingo}-${mesDomingo}.txt`;
  const rutaArchivo = path.join(config.paths.registros, nombreArchivo);
  
  // Crear directorio si no existe
  if (!fs.existsSync(config.paths.registros)) {
    fs.mkdirSync(config.paths.registros, { recursive: true });
  }
  
  const resumen = caches.robosSemana.get() || {};
  const establecimientos = caches.establecimientos.get() || {};
  
  let contenido = `📊 Registro de robos del ${diaLunes}-${mesLunes} al ${diaDomingo}-${mesDomingo}\n\n`;
  
  for (const tipo of Object.keys(establecimientos)) {
    const robos = resumen[tipo] || {};
    const lista = establecimientos[tipo];
    
    contenido += `${'='.repeat(60)}\n`;
    contenido += `📍 ${tipo.toUpperCase()}\n`;
    contenido += `${'='.repeat(60)}\n\n`;
    
    // Agrupar por tipo de robo
    const normales = lista.filter(e => !e.tiporobo);
    const agrupados = {};
    
    lista.forEach(est => {
      if (est.tiporobo) {
        if (!agrupados[est.tiporobo]) {
          agrupados[est.tiporobo] = [];
        }
        agrupados[est.tiporobo].push(est);
      }
    });
    
    // Robos normales
    for (const est of normales) {
      const datos = robos[est.value] || { exitosos: 0, fallidos: 0 };
      const total = datos.exitosos + datos.fallidos;
      
      contenido += `${est.name.padEnd(25)} | Total: ${total.toString().padStart(3)} | ✅ ${datos.exitosos.toString().padStart(2)} | ❌ ${datos.fallidos.toString().padStart(2)}\n`;
    }
    
    // Robos agrupados
    for (const [grupo, ests] of Object.entries(agrupados)) {
      const totalGrupo = ests.reduce((acc, e) => {
        const d = robos[e.value] || { exitosos: 0, fallidos: 0 };
        return {
          exitosos: acc.exitosos + d.exitosos,
          fallidos: acc.fallidos + d.fallidos
        };
      }, { exitosos: 0, fallidos: 0 });
      
      const totalRobos = totalGrupo.exitosos + totalGrupo.fallidos;
      const limite = ests[0]?.limite || '—';
      
      contenido += `\n${'-'.repeat(60)}\n`;
      contenido += `Robos ${grupo.toUpperCase()}: ${totalRobos}/${limite}\n`;
      contenido += `${'-'.repeat(60)}\n`;
      
      for (const est of ests) {
        const datos = robos[est.value] || { exitosos: 0, fallidos: 0 };
        const total = datos.exitosos + datos.fallidos;
        
        contenido += `${est.name.padEnd(25)} | Total: ${total.toString().padStart(3)} | ✅ ${datos.exitosos.toString().padStart(2)} | ❌ ${datos.fallidos.toString().padStart(2)}\n`;
        
        if (datos.semanal) {
          const totalSemanal = datos.semanal.exitosos + datos.semanal.fallidos;
          contenido += `${' '.repeat(27)}Semanal: ${totalSemanal.toString().padStart(3)} | ✅ ${datos.semanal.exitosos.toString().padStart(2)} | ❌ ${datos.semanal.fallidos.toString().padStart(2)}\n`;
        }
      }
    }
    
    contenido += '\n';
  }
  
  fs.writeFileSync(rutaArchivo, contenido, 'utf8');
  logger.info(`Archivo de registro guardado: ${nombreArchivo}`);
}

async function resetearContadores() {
  const establecimientos = caches.establecimientos.get() || {};
  const nuevoResumen = {};
  
  for (const tipo in establecimientos) {
    nuevoResumen[tipo] = {};
    
    for (const est of establecimientos[tipo]) {
      nuevoResumen[tipo][est.value] = {
        exitosos: 0,
        fallidos: 0
      };
      
      if (est.tiporobo === 'rc') {
        nuevoResumen[tipo][est.value].semanal = {
          exitosos: 0,
          fallidos: 0
        };
      }
    }
  }
  
  caches.robosSemana.set(nuevoResumen);
  logger.info('Contadores de robos reseteados');
}