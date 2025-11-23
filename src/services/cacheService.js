// ==========================================
// src/services/cacheService.js
// ==========================================
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class CacheService {
  constructor(filePath, ttl = 60000) {
    this.filePath = filePath;
    this.ttl = ttl;
    this.cache = null;
    this.lastUpdate = 0;
  }
  
  get() {
    const now = Date.now();
    
    if (!this.cache || now - this.lastUpdate > this.ttl) {
      try {
        // Verificar si el archivo existe
        if (!fs.existsSync(this.filePath)) {
          logger.warn(`Archivo no existe, creando vacío: ${this.filePath}`);
          this.inicializarArchivo();
        }
        
        this.cache = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        this.lastUpdate = now;
        logger.debug(`Cache actualizado: ${this.filePath}`);
      } catch (error) {
        logger.error(`Error leyendo cache: ${this.filePath}`, error);
        // Intentar inicializar si hay error
        this.inicializarArchivo();
        return this.getDefault();
      }
    }
    
    return this.cache;
  }
  
  set(data) {
    try {
      this.cache = data;
      this.lastUpdate = Date.now();
      
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      logger.debug(`Cache guardado: ${this.filePath}`);
    } catch (error) {
      logger.error(`Error guardando cache: ${this.filePath}`, error);
    }
  }
  
  invalidate() {
    this.cache = null;
    this.lastUpdate = 0;
  }
  
  inicializarArchivo() {
    const defaultData = this.getDefault();
    this.set(defaultData);
  }
  
  getDefault() {
    const fileName = path.basename(this.filePath);
    
    // Valores por defecto según el archivo
    const defaults = {
      'productos.json': {},
      'bandas.json': {},
      'establecimientos.json': { bajo: [], medio: [], grande: [] },
      'precios.json': {
        bandas: {
          melee: {},
          calibrebajo: {},
          calibremedio: {},
          calibrealto: {},
          accesorios: {},
          chalecos: {}
        },
        racing: {
          melee: {},
          calibrebajo: {},
          calibremedio: {},
          calibrealto: {},
          accesorios: {},
          chalecos: {}
        }
      },
      'robos_semanales.json': { bajo: {}, medio: {}, grande: {} },
      'registro_semanal.json': {}
    };
    
    return defaults[fileName] || {};
  }
}

// Crear instancias de caché
const caches = {
  productos: new CacheService('./data/productos.json', 300000), // 5 min
  bandas: new CacheService('./data/bandas.json', 300000),
  establecimientos: new CacheService('./data/establecimientos.json', 300000),
  precios: new CacheService('./data/precios.json', 300000),
  robosSemana: new CacheService('./data/robos_semanales.json', 60000), // 1 min
  registroSemanal: new CacheService('./data/registro_semanal.json', 60000)
};

module.exports = { CacheService, caches };