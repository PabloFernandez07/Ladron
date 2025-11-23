// ==========================================
// src/handlers/buttonHandler.js
// ==========================================
const logger = require('../utils/logger');
const ventaService = require('../services/ventaService');
const { caches } = require('../services/cacheService');
const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  async handle(interaction, client) {
    logger.interaction('button', interaction.customId, interaction.user);
    
    const handlers = {
      'venta_add': handleVentaAdd,
      'venta_terminar': handleVentaTerminar,
      'copiar_banda': handleCopiarBanda,
      'copiar_racing': handleCopiarRacing
    };
    
    const handler = handlers[interaction.customId];
    
    if (handler) {
      await handler(interaction, client);
    } else {
      logger.warn(`Handler no encontrado para botón: ${interaction.customId}`);
    }
  }
};

async function handleVentaAdd(interaction) {
  try {
    const productos = caches.productos.get();
    
    if (!productos || Object.keys(productos).length === 0) {
      return await interaction.reply({
        content: '❌ No hay productos disponibles.',
        ephemeral: true
      });
    }
    
    const options = Object.entries(productos).map(([id, datos]) => ({
      label: datos.nombre.slice(0, 100),
      value: id.slice(0, 100)
    }));
    
    const select = new StringSelectMenuBuilder()
      .setCustomId('venta_producto')
      .setPlaceholder('Selecciona otro producto')
      .addOptions(options);
    
    const row = new ActionRowBuilder().addComponents(select);
    
    await interaction.reply({
      content: '🛒 Selecciona el siguiente producto:',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error en handleVentaAdd:', error);
    throw error;
  }
}

async function handleVentaTerminar(interaction) {
  try {
    const venta = ventaService.obtenerVenta(interaction.user.id);
    
    if (venta.productos.length === 0) {
      return await interaction.reply({
        content: '❌ Debes agregar al menos un producto.',
        ephemeral: true
      });
    }
    
    const bandas = caches.bandas.get();
    
    if (!bandas || Object.keys(bandas).length === 0) {
      return await interaction.reply({
        content: '❌ No hay bandas registradas.',
        ephemeral: true
      });
    }
    
    const options = Object.entries(bandas).map(([id, datos]) => ({
      label: datos.nombre,
      value: id
    }));
    
    const select = new StringSelectMenuBuilder()
      .setCustomId('venta_banda')
      .setPlaceholder('Selecciona la banda')
      .addOptions(options);
    
    const row = new ActionRowBuilder().addComponents(select);
    
    await interaction.reply({
      content: '👥 Selecciona la banda para esta venta:',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error en handleVentaTerminar:', error);
    await interaction.reply({
      content: error.message || '❌ Error al procesar la venta.',
      ephemeral: true
    });
  }
}

async function handleCopiarBanda(interaction) {
  const precios = caches.precios.get();
  const categorias = precios.bandas || {};
  
  const etiquetas = {
    melee: '🗡️ **ARMAS MELEE**',
    calibrebajo: '🔫 **Calibre Bajo**',
    calibremedio: '💥 **Calibre Medio**',
    calibrealto: '🧨 **Calibre Alto**',
    accesorios: '🥽 **Accesorios**',
    chalecos: '🦺 **Chalecos**'
  };
  
  let texto = '';
  for (const [nombre, armas] of Object.entries(categorias)) {
    if (Object.keys(armas).length === 0) continue;
    
    const lista = Object.entries(armas)
      .map(([a, p]) => `• ${a} --> [ ${p} ]`)
      .join('\n');
    
    texto += `**${etiquetas[nombre]}**\n${lista}\n\n`;
  }
  
  if (!texto) texto = '⚠️ No hay armas registradas para Banda.';
  
  await interaction.reply({ content: texto, ephemeral: true });
}

async function handleCopiarRacing(interaction) {
  const precios = caches.precios.get();
  const categorias = precios.racing || {};
  
  const etiquetas = {
    melee: '🗡️ **ARMAS MELEE**',
    calibrebajo: '🔫 **Calibre Bajo**',
    calibremedio: '💥 **Calibre Medio**',
    calibrealto: '🧨 **Calibre Alto**',
    accesorios: '🥽 **Accesorios**',
    chalecos: '🦺 **Chalecos**'
  };
  
  let texto = '';
  for (const [nombre, armas] of Object.entries(categorias)) {
    if (Object.keys(armas).length === 0) continue;
    
    const lista = Object.entries(armas)
      .map(([a, p]) => `• ${a} --> [ ${p} ]`)
      .join('\n');
    
    texto += `**${etiquetas[nombre]}**\n${lista}\n\n`;
  }
  
  if (!texto) texto = '⚠️ No hay armas registradas para Racing Crew.';
  
  await interaction.reply({ content: texto, ephemeral: true });
}