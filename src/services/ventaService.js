// ==========================================
// src/services/ventaService.js
// ==========================================
const { EmbedBuilder } = require('discord.js');
const { VentaQueries } = require('../database/queries');
const { caches } = require('./cacheService');
const logger = require('../utils/logger');
const { validarCantidad, validarPrecio } = require('../utils/validators');

class VentaService {
  constructor() {
    this.ventasActivas = new Map();
  }
  
  iniciarVenta(userId) {
    this.ventasActivas.set(userId, {
      productos: [],
      iniciada: Date.now()
    });
    
    logger.debug(`Venta iniciada para usuario ${userId}`);
  }
  
  obtenerVenta(userId) {
    const venta = this.ventasActivas.get(userId);
    
    if (!venta) {
      throw new Error('No hay una venta activa');
    }
    
    // Validar timeout (30 minutos)
    const timeout = 30 * 60 * 1000;
    if (Date.now() - venta.iniciada > timeout) {
      this.ventasActivas.delete(userId);
      throw new Error('La venta ha expirado. Inicia una nueva con /venta');
    }
    
    return venta;
  }
  
  agregarProducto(userId, productoId, cantidad) {
    const venta = this.obtenerVenta(userId);
    
    // Validar cantidad
    const cantidadValida = validarCantidad(cantidad);
    
    // Verificar si el producto ya existe
    const existente = venta.productos.find(p => p.id === productoId);
    
    if (existente) {
      existente.cantidad += cantidadValida;
    } else {
      venta.productos.push({
        id: productoId,
        cantidad: cantidadValida
      });
    }
    
    logger.debug(`Producto agregado a venta`, { userId, productoId, cantidad: cantidadValida });
    
    return venta;
  }
  
  establecerBanda(userId, bandaId) {
    const venta = this.obtenerVenta(userId);
    venta.banda = bandaId;
    
    logger.debug(`Banda establecida para venta`, { userId, bandaId });
    
    return venta;
  }
  
  async finalizarVenta(userId, precio, client) {
    const venta = this.obtenerVenta(userId);
    
    if (!venta.banda) {
      throw new Error('Debes seleccionar una banda primero');
    }
    
    if (venta.productos.length === 0) {
      throw new Error('Debes agregar al menos un producto');
    }
    
    // Validar precio
    const precioValido = validarPrecio(precio);
    
    // Registrar en base de datos
    const ventaId = await VentaQueries.registrarVenta({
      banda: venta.banda,
      userId,
      precio: precioValido,
      productos: venta.productos
    });
    
    // Actualizar registro semanal
    await this.actualizarRegistroSemanal(venta, precioValido);
    
    // Crear embed
    const embed = await this.crearEmbedVenta(venta, precioValido, userId);
    
    // Limpiar venta activa
    this.ventasActivas.delete(userId);
    
    logger.info('Venta finalizada', {
      ventaId,
      userId,
      banda: venta.banda,
      productos: venta.productos.length,
      precio: precioValido
    });
    
    return { embed, ventaId };
  }
  
  async actualizarRegistroSemanal(venta, precio) {
    const registro = caches.registroSemanal.get() || {};
    
    if (!registro[venta.banda]) {
      registro[venta.banda] = { preciototal: 0 };
    }
    
    for (const item of venta.productos) {
      if (!registro[venta.banda][item.id]) {
        registro[venta.banda][item.id] = 0;
      }
      registro[venta.banda][item.id] += item.cantidad;
    }
    
    registro[venta.banda].preciototal += precio;
    
    caches.registroSemanal.set(registro);
  }
  
  async crearEmbedVenta(venta, precio, userId) {
    const productos = caches.productos.get();
    const bandas = caches.bandas.get();
    const banda = bandas[venta.banda];
    
    const fecha = new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let productosTexto = '';
    for (const item of venta.productos) {
      const nombre = productos[item.id]?.nombre || item.id;
      productosTexto += `• ${nombre} × ${item.cantidad}\n`;
    }
    
    const precioFormateado = precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    const embed = new EmbedBuilder()
      .setTitle('🧾 Venta Registrada')
      .setColor(0x2ecc71)
      .addFields(
        { name: '👥 Banda', value: banda.nombre, inline: true },
        { name: '📍 Ubicación', value: banda.ubicacion, inline: true },
        { name: '👤 Registrado por', value: `<@${userId}>`, inline: true },
        { name: '📅 Fecha', value: fecha, inline: true },
        { name: '📦 Productos Vendidos', value: productosTexto || '—', inline: false },
        { name: '💰 Total', value: `${precioFormateado} $`, inline: true }
      )
      .setTimestamp();
    
    return embed;
  }
  
  cancelarVenta(userId) {
    const deleted = this.ventasActivas.delete(userId);
    
    if (deleted) {
      logger.debug(`Venta cancelada para usuario ${userId}`);
    }
    
    return deleted;
  }
}

// EXPORTAR UNA INSTANCIA DE LA CLASE
module.exports = new VentaService();