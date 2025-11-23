// ==========================================
// src/handlers/modalHandler.js - CORREGIDO
// ==========================================
const logger = require('../utils/logger');
const ventaService = require('../services/ventaService');
const config = require('../config');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

async function handle(interaction, client) {
  logger.interaction('modal', interaction.customId, interaction.user);
  
  const handlers = {
    'venta_cantidad': handleVentaCantidad,
    'venta_precio': handleVentaPrecio
  };
  
  const handler = handlers[interaction.customId];
  
  if (handler) {
    await handler(interaction, client);
  } else {
    logger.warn(`Handler no encontrado para modal: ${interaction.customId}`);
  }
}

async function handleVentaCantidad(interaction) {
  try {
    const cantidadStr = interaction.fields.getTextInputValue('cantidad');
    const cantidad = parseInt(cantidadStr);
    
    const venta = ventaService.obtenerVenta(interaction.user.id);
    
    if (!venta.productoActual) {
      return await interaction.reply({
        content: '❌ No hay producto seleccionado.',
        ephemeral: true
      });
    }
    
    // Agregar producto (con validación)
    ventaService.agregarProducto(interaction.user.id, venta.productoActual, cantidad);
    
    // Limpiar producto actual
    venta.productoActual = null;
    
    // Botones para continuar
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('venta_add')
        .setLabel('➕ Añadir otro producto')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('venta_terminar')
        .setLabel('✅ Terminar venta')
        .setStyle(ButtonStyle.Success)
    );
    
    await interaction.reply({
      content: '✅ Producto agregado. ¿Quieres añadir otro?',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error en handleVentaCantidad:', error);
    await interaction.reply({
      content: error.message || '❌ Error al agregar el producto.',
      ephemeral: true
    });
  }
}

async function handleVentaPrecio(interaction, client) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const precioStr = interaction.fields.getTextInputValue('precio');
    const precio = parseFloat(precioStr);
    
    // Finalizar venta
    const { embed } = await ventaService.finalizarVenta(
      interaction.user.id,
      precio,
      client
    );
    
    // Enviar al canal de ventas
    const canal = client.channels.cache.get(config.canales.ventas);
    if (canal) {
      await canal.send({ embeds: [embed] });
    }
    
    await interaction.editReply({
      content: '✅ Venta registrada correctamente.',
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error en handleVentaPrecio:', error);
    await interaction.editReply({
      content: error.message || '❌ Error al finalizar la venta.',
      ephemeral: true
    });
  }
}

module.exports = { handle };