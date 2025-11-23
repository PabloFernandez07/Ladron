// ==========================================
// src/handlers/selectMenuHandler.js
// ==========================================
const logger = require('../utils/logger');
const ventaService = require('../services/ventaService');
const { caches } = require('../services/cacheService');
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  async handle(interaction, client) {
    logger.interaction('selectMenu', interaction.customId, interaction.user);
    
    const handlers = {
      'venta_producto': handleVentaProducto,
      'venta_banda': handleVentaBanda,
      'seleccionar_registro': handleSeleccionarRegistro,
      'seleccionar_registro_ventas': handleSeleccionarRegistroVentas
    };
    
    const handler = handlers[interaction.customId];
    
    if (handler) {
      await handler(interaction, client);
    } else {
      logger.warn(`Handler no encontrado para select menu: ${interaction.customId}`);
    }
  }
};

async function handleVentaProducto(interaction) {
  try {
    const productoId = interaction.values[0];
    const productos = caches.productos.get();
    const producto = productos[productoId];
    
    if (!producto) {
      return await interaction.reply({
        content: '❌ Producto no encontrado.',
        ephemeral: true
      });
    }
    
    // Guardar producto actual en la venta
    const venta = ventaService.obtenerVenta(interaction.user.id);
    venta.productoActual = productoId;
    
    // Mostrar modal para cantidad
    const modal = new ModalBuilder()
      .setCustomId('venta_cantidad')
      .setTitle(`Cantidad de ${producto.nombre}`);
    
    const cantidadInput = new TextInputBuilder()
      .setCustomId('cantidad')
      .setLabel(`Unidades de ${producto.nombre}`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ejemplo: 5')
      .setRequired(true);
    
    modal.addComponents(new ActionRowBuilder().addComponents(cantidadInput));
    
    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error en handleVentaProducto:', error);
    await interaction.reply({
      content: error.message || '❌ Error al procesar el producto.',
      ephemeral: true
    });
  }
}

async function handleVentaBanda(interaction) {
  try {
    const bandaId = interaction.values[0];
    ventaService.establecerBanda(interaction.user.id, bandaId);
    
    // Mostrar modal para precio
    const modal = new ModalBuilder()
      .setCustomId('venta_precio')
      .setTitle('Precio total de la venta');
    
    const precioInput = new TextInputBuilder()
      .setCustomId('precio')
      .setLabel('💰 ¿Cuál fue el precio total?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ejemplo: 50000')
      .setRequired(true);
    
    modal.addComponents(new ActionRowBuilder().addComponents(precioInput));
    
    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error en handleVentaBanda:', error);
    await interaction.reply({
      content: error.message || '❌ Error al establecer la banda.',
      ephemeral: true
    });
  }
}

async function handleSeleccionarRegistro(interaction) {
  const archivo = interaction.values[0];
  
  if (archivo === 'placeholder') {
    return;
  }
  
  const ruta = path.join(__dirname, '../../data/registros', archivo);
  
  if (!fs.existsSync(ruta)) {
    return await interaction.reply({
      content: '❌ Archivo no encontrado.',
      ephemeral: true
    });
  }
  
  await interaction.reply({
    content: `📄 Aquí tienes el registro: **${archivo}**`,
    files: [ruta],
    ephemeral: true
  });
}

async function handleSeleccionarRegistroVentas(interaction) {
  const archivo = interaction.values[0];
  
  if (archivo === 'placeholder') {
    return;
  }
  
  const ruta = path.join(__dirname, '../../data/registros_ventas', archivo);
  
  if (!fs.existsSync(ruta)) {
    return await interaction.reply({
      content: '❌ Archivo no encontrado.',
      ephemeral: true
    });
  }
  
  await interaction.reply({
    content: `📄 Aquí tienes el registro: **${archivo}**`,
    files: [ruta],
    ephemeral: true
  });
}