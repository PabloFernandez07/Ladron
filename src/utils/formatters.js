// ==========================================
// src/utils/formatters.js
// Utilidades para formatear datos
// ==========================================

/**
 * Formatea un número como moneda
 * @param {number} cantidad - Cantidad a formatear
 * @returns {string} Cantidad formateada (ej: "1.234.567 $")
 */
function formatearMoneda(cantidad) {
  if (typeof cantidad !== 'number' || isNaN(cantidad)) {
    return '0 $';
  }
  
  return cantidad.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' $';
}

/**
 * Formatea una fecha en español
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!(fecha instanceof Date) || isNaN(fecha)) {
    fecha = new Date();
  }
  
  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  });
}

/**
 * Formatea un timestamp a fecha legible
 * @param {number} timestamp - Timestamp en milisegundos
 * @returns {string} Fecha formateada
 */
function formatearTimestamp(timestamp) {
  return formatearFecha(new Date(timestamp));
}

/**
 * Trunca un texto si es muy largo
 * @param {string} texto - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, maxLength = 100) {
  if (typeof texto !== 'string') return '';
  
  if (texto.length <= maxLength) return texto;
  
  return texto.substring(0, maxLength - 3) + '...';
}

/**
 * Genera un valor slug desde un nombre
 * @param {string} nombre - Nombre a convertir
 * @returns {string} Slug generado
 */
function generarSlug(nombre) {
  if (typeof nombre !== 'string') return '';
  
  return nombre
    .normalize('NFD') // Descomponer acentos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .toLowerCase()
    .replace(/\s+/g, '_') // Espacios a guiones bajos
    .replace(/[^\w-]/g, '') // Eliminar caracteres especiales
    .replace(/_{2,}/g, '_') // Múltiples guiones a uno solo
    .replace(/^_|_$/g, ''); // Eliminar guiones al inicio/final
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
function capitalizar(str) {
  if (typeof str !== 'string' || str.length === 0) return '';
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea una lista de items como texto
 * @param {Array} items - Array de items
 * @param {string} prefijo - Prefijo para cada item (ej: "•")
 * @returns {string} Lista formateada
 */
function formatearLista(items, prefijo = '•') {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Ninguno';
  }
  
  return items.map(item => `${prefijo} ${item}`).join('\n');
}

/**
 * Calcula el porcentaje
 * @param {number} parte - Parte del total
 * @param {number} total - Total
 * @returns {string} Porcentaje formateado (ej: "75.5%")
 */
function calcularPorcentaje(parte, total) {
  if (total === 0) return '0%';
  
  const porcentaje = (parte / total) * 100;
  return porcentaje.toFixed(1) + '%';
}

module.exports = {
  formatearMoneda,
  formatearFecha,
  formatearTimestamp,
  truncarTexto,
  generarSlug,
  capitalizar,
  formatearLista,
  calcularPorcentaje
};