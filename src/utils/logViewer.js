// ==========================================
// src/utils/logViewer.js
// Utilidad para ver logs desde la consola
// ==========================================
const fs = require('fs');
const path = require('path');

class LogViewer {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
  }
  
  /**
   * Lista todos los archivos de log
   */
  list() {
    try {
      const files = fs.readdirSync(this.logsDir);
      return files.filter(f => f.endsWith('.log'));
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Lee un archivo de log completo
   */
  read(filename) {
    try {
      const filepath = path.join(this.logsDir, filename);
      return fs.readFileSync(filepath, 'utf8');
    } catch (error) {
      return `Error leyendo ${filename}: ${error.message}`;
    }
  }
  
  /**
   * Lee las últimas N líneas de un log
   */
  tail(filename, lines = 50) {
    try {
      const content = this.read(filename);
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines).join('\n');
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
  
  /**
   * Busca en los logs
   */
  search(filename, query) {
    try {
      const content = this.read(filename);
      const lines = content.split('\n');
      return lines.filter(line => 
        line.toLowerCase().includes(query.toLowerCase())
      ).join('\n');
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
  
  /**
   * Limpia un archivo de log
   */
  clear(filename) {
    try {
      const filepath = path.join(this.logsDir, filename);
      fs.writeFileSync(filepath, '');
      return `✅ ${filename} limpiado`;
    } catch (error) {
      return `❌ Error: ${error.message}`;
    }
  }
  
  /**
   * Obtiene estadísticas de un log
   */
  stats(filename) {
    try {
      const filepath = path.join(this.logsDir, filename);
      const stats = fs.statSync(filepath);
      const content = this.read(filename);
      const lines = content.split('\n').length;
      
      return {
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        lines: lines,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Genera reporte de todos los logs
   */
  report() {
    const files = this.list();
    const report = {};
    
    for (const file of files) {
      report[file] = this.stats(file);
    }
    
    return report;
  }
}

module.exports = new LogViewer();