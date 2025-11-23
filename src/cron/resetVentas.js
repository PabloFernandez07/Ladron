// ==========================================
// src/cron/resetVentas.js
// ==========================================
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { caches } = require('../services/cacheService');

module.exports = {
  iniciar(client) {
    // Cada lunes a las 20:00 (hora de Madrid)
    cron.schedule('0 20 * * 1', async () => {
      try {
        logger.cron('resetVentas', 'Iniciando reset semanal de ventas');
        
        const registro = caches.registroSemanal.get() || {};
        
        // Generar archivo antes de resetear
        await generarArchivoVentas(registro);
        
        // Resetear contadores
        caches.registroSemanal.set({});
        
        logger.cron('resetVentas', 'Reset semanal de ventas completado');
        
      } catch (error) {
        logger.error('Error en cron resetVentas:', error);
      }
    }, {
      timezone: 'Europe/Madrid'
    });
    
    logger.info('Cron job resetVentas programado');
  }
};

async function generarArchivoVentas(registro) {
  const hoy = new Date();
  const diaDomingo = hoy.getDate().toString().padStart(2, '0');
  const mesDomingo = (hoy.getMonth() + 1).toString().padStart(2, '0');
  
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - 6);
  const diaLunes = lunes.getDate().toString().padStart(2, '0');
  const mesLunes = (lunes.getMonth() + 1).toString().padStart(2, '0');
  
  const nombreArchivo = `Registro_Ventas_Semana_${diaLunes}-${mesLunes}_${diaDomingo}-${mesDomingo}.txt`;
  const rutaArchivo = path.join(config.paths.registrosVentas, nombreArchivo);
  
  // Crear directorio si no existe
  if (!fs.existsSync(config.paths.registrosVentas)) {
    fs.mkdirSync(config.paths.registrosVentas, { recursive: true });
  }
  
  const productos = caches.productos.get() || {};
  const bandas = caches.bandas.get() || {};
  
  let contenido = `📊 Registro de ventas del ${diaLunes}-${mesLunes} al ${diaDomingo}-${mesDomingo}\n\n`;
  
  for (const [bandaId, productosVendidos] of Object.entries(registro)) {
    const banda = bandas[bandaId];
    const precio = productosVendidos.preciototal || 0;
    const precioFormateado = precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    contenido += `${'='.repeat(60)}\n`;
    contenido += `${banda?.nombre || bandaId} | ${precioFormateado}$\n`;
    contenido += `📍 ${banda?.ubicacion || '—'}\n`;
    contenido += `${'='.repeat(60)}\n\n`;
    
    for (const [productoId, cantidad] of Object.entries(productosVendidos)) {
      if (productoId === 'preciototal') continue;
      
      const producto = productos[productoId];
      const limite = producto?.limite_semanal || '—';
      
      let estado = '';
      if (cantidad === limite) {
        estado = ' ⚠️ (Máximo alcanzado)';
      } else if (cantidad > limite) {
        estado = ' 🔴 (EXCEDIDO)';
      }
      
      contenido += `• ${producto?.nombre || productoId} → ${cantidad}/${limite}${estado}\n`;
    }
    
    contenido += '\n';
  }
  
  fs.writeFileSync(rutaArchivo, contenido, 'utf8');
  logger.info(`Archivo de ventas guardado: ${nombreArchivo}`);
}