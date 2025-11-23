// ==========================================
// src/utils/consoleInterceptor.js
// Intercepta todos los console.log y los guarda en archivos
// ==========================================
const fs = require('fs');
const path = require('path');
const util = require('util');

class ConsoleInterceptor {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.consoleLogPath = path.join(this.logsDir, 'console.log');
    
    // Crear directorio si no existe
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    // Guardar referencias originales
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    
    this.isIntercepting = false;
  }
  
  /**
   * Formatea el mensaje para guardar
   */
  formatMessage(level, args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return util.inspect(arg, { depth: 3, colors: false });
      }
      return String(arg);
    }).join(' ');
    
    return `[${timestamp}] [${level}] ${message}\n`;
  }
  
  /**
   * Escribe en el archivo de log
   */
  writeToFile(message) {
    try {
      // Escribir de forma asíncrona para no bloquear
      fs.appendFile(this.consoleLogPath, message, (err) => {
        if (err && !this.errorLogged) {
          this.originalConsole.error('Error escribiendo en console.log:', err.message);
          this.errorLogged = true;
        }
      });
    } catch (error) {
      // Silenciar errores para no causar loops infinitos
    }
  }
  
  /**
   * Rotación de archivos si son muy grandes
   */
  rotateIfNeeded() {
    try {
      const stats = fs.statSync(this.consoleLogPath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        const backupPath = path.join(
          this.logsDir, 
          `console.${Date.now()}.log`
        );
        fs.renameSync(this.consoleLogPath, backupPath);
        
        // Mantener solo los últimos 5 backups
        const backups = fs.readdirSync(this.logsDir)
          .filter(f => f.startsWith('console.') && f.endsWith('.log'))
          .sort()
          .reverse();
        
        if (backups.length > 5) {
          backups.slice(5).forEach(backup => {
            fs.unlinkSync(path.join(this.logsDir, backup));
          });
        }
      }
    } catch (error) {
      // Ignorar errores de rotación
    }
  }
  
  /**
   * Inicia la interceptación de console
   */
  start() {
    if (this.isIntercepting) return;
    
    this.isIntercepting = true;
    
    // Interceptar console.log
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.writeToFile(this.formatMessage('LOG', args));
      this.rotateIfNeeded();
    };
    
    // Interceptar console.error
    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.writeToFile(this.formatMessage('ERROR', args));
    };
    
    // Interceptar console.warn
    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.writeToFile(this.formatMessage('WARN', args));
    };
    
    // Interceptar console.info
    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.writeToFile(this.formatMessage('INFO', args));
    };
    
    // Interceptar console.debug
    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      this.writeToFile(this.formatMessage('DEBUG', args));
    };
    
    // Escribir mensaje de inicio
    this.writeToFile(this.formatMessage('SYSTEM', ['Console interceptor iniciado']));
  }
  
  /**
   * Detiene la interceptación
   */
  stop() {
    if (!this.isIntercepting) return;
    
    this.writeToFile(this.formatMessage('SYSTEM', ['Console interceptor detenido']));
    
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
    
    this.isIntercepting = false;
  }
  
  /**
   * Lee las últimas N líneas del log
   */
  tail(lines = 100) {
    try {
      const content = fs.readFileSync(this.consoleLogPath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines).join('\n');
    } catch (error) {
      return 'No hay logs disponibles';
    }
  }
  
  /**
   * Limpia el archivo de log
   */
  clear() {
    try {
      fs.writeFileSync(this.consoleLogPath, '');
      this.originalConsole.log('✅ Console.log limpiado');
    } catch (error) {
      this.originalConsole.error('❌ Error limpiando console.log:', error.message);
    }
  }
}

// Exportar instancia única
const interceptor = new ConsoleInterceptor();

module.exports = interceptor;