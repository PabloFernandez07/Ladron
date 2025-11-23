// ==========================================
// src/services/ventaRegistroService.js
// Servicio para el registro semanal de ventas - MEJORADO
// ==========================================
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { caches } = require('./cacheService');
const { formatearMoneda } = require('../utils/formatters');

class VentaRegistroService {
  /**
   * Envía el resumen semanal de ventas al canal
   */
  async enviarResumenVentas(guild) {
    try {
      const canal = guild.channels.cache.get(config.canales.limites);
      
      if (!canal) {
        logger.error('Canal de límites de ventas no encontrado');
        return;
      }
      
      // Crear embed principal
      const embedResumen = await this.crearEmbedResumen();
      
      // Borrar mensajes anteriores
      await this.borrarMensajesAnteriores(canal);
      
      // Enviar nuevo mensaje
      const mensajeResumen = await canal.send({ embeds: [embedResumen] });
      
      // Enviar menú de descarga
      const menuMensaje = await this.enviarMenuDescarga(canal);
      
      // Guardar IDs
      this.guardarIdsMensajes({
        limitebanda: mensajeResumen.id,
        menuId: menuMensaje?.id
      });
      
      logger.info('Resumen de ventas actualizado correctamente');
      
    } catch (error) {
      logger.error('Error enviando resumen de ventas:', error);
      throw error;
    }
  }
  
  /**
   * Crea el embed principal con el resumen de ventas
   * CON SEPARADORES SIMPLES
   */
  async crearEmbedResumen() {
    const registro = caches.registroSemanal.get() || {};
    const productos = caches.productos.get() || {};
    const bandas = caches.bandas.get() || {};
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Estado Semanal de Artículos por Banda')
      .setColor(0x3498db)
      .setTimestamp();
    
    let totalGeneral = 0;
    
    // Si no hay bandas registradas, mostrar mensaje
    if (!bandas || Object.keys(bandas).length === 0) {
      embed.setDescription('```\n⚠️  No hay bandas registradas\n   Usa /addbanda para agregar bandas\n```');
      embed.setFooter({ text: 'Límite semanal por producto | Se resetea los lunes a las 20:00' });
      return embed;
    }
    
    // Procesar TODAS las bandas (aunque no tengan ventas)
    const todasLasBandas = Object.keys(bandas);
    
    // Ordenar: primero las que tienen ventas (por dinero), luego las que no tienen
    const bandasOrdenadas = todasLasBandas.sort((a, b) => {
      const precioA = registro[a]?.preciototal || 0;
      const precioB = registro[b]?.preciototal || 0;
      
      // Si ambas tienen 0, ordenar alfabéticamente
      if (precioA === 0 && precioB === 0) {
        return bandas[a].nombre.localeCompare(bandas[b].nombre);
      }
      
      // Ordenar por precio (mayor a menor)
      return precioB - precioA;
    });
    
    // Procesar cada banda
    for (const bandaId of bandasOrdenadas) {
      const banda = bandas[bandaId];
      const productosVendidos = registro[bandaId] || {};
      const precioTotal = productosVendidos.preciototal || 0;
      totalGeneral += precioTotal;
      
      const precioFormateado = formatearMoneda(precioTotal);
      
      // Crear contenido con separador simple
      let contenido = '';
      
      if (precioTotal === 0) {
        // Si no hay ventas, mostrar mensaje
        contenido = '```\n⚠️  Sin ventas registradas esta semana\n```';
      } else {
        // Si hay ventas, mostrar productos
        contenido = this.generarContenidoProductos(productosVendidos, productos);
      }
      
      // NOMBRE DE LA BANDA CON TOTAL EN EL TÍTULO DEL FIELD
      embed.addFields({
        name: `${'-'.repeat(60)}\n💰 ${banda.nombre} | ${precioFormateado}\n${'-'.repeat(60)}`,
        value: contenido,
        inline: false
      });
    }
    
    // Agregar total general al footer
    const totalFormateado = formatearMoneda(totalGeneral);
    embed.setFooter({ 
      text: `💵 Total General: ${totalFormateado} | Límite semanal por producto | Se resetea los lunes a las 20:00` 
    });
    
    return embed;
  }
  
  /**
   * Genera el contenido de productos para una banda
   * FORMATO SIMPLE Y LIMPIO
   */
  generarContenidoProductos(productosVendidos, productos) {
    let contenido = '';
    
    // Filtrar solo productos (no el precio total)
    const productosArray = Object.entries(productosVendidos)
      .filter(([key]) => key !== 'preciototal')
      .sort((a, b) => b[1] - a[1]); // Ordenar por cantidad (mayor a menor)
    
    if (productosArray.length === 0) {
      return '```\n⚠️  Sin productos vendidos\n```';
    }
    
    for (const [productoId, cantidad] of productosArray) {
      const producto = productos[productoId];
      const limite = producto?.limite_semanal || '—';
      
      let emoji = '🟢';
      let estado = '';
      
      // Determinar estado según límite
      if (limite !== '—') {
        const porcentaje = (cantidad / limite) * 100;
        
        if (cantidad >= limite) {
          emoji = '🔴';
          estado = ' **(MÁXIMO ALCANZADO)**';
        } else if (porcentaje >= 80) {
          emoji = '🟡';
          estado = ' *(Cerca del límite)*';
        }
      }
      
      const nombreProducto = producto?.nombre || productoId;
      contenido += `${emoji} **${nombreProducto}** → \`${cantidad}/${limite}\`${estado}\n`;
    }
    
    return contenido;
  }
  
  /**
   * Envía el menú de descarga de registros
   */
  async enviarMenuDescarga(canal) {
    const archivos = fs.readdirSync(config.paths.registrosVentas)
      .filter(f => f.startsWith('Registro_Ventas_Semana_') && f.endsWith('.txt'))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 24);
    
    if (archivos.length === 0) return null;
    
    const opciones = [
      {
        label: '📂 Selecciona un registro de ventas para descargar',
        value: 'placeholder',
        description: 'Elige un archivo del listado',
        default: true
      },
      ...archivos.map(file => ({
        label: file.replace('Registro_Ventas_Semana_', '').replace('.txt', ''),
        value: file,
        description: 'Registro semanal de ventas'
      }))
    ];
    
    const menu = new StringSelectMenuBuilder()
      .setCustomId('seleccionar_registro_ventas')
      .setPlaceholder('📂 Selecciona un registro de ventas para descargar')
      .addOptions(opciones);
    
    const row = new ActionRowBuilder().addComponents(menu);
    
    return await canal.send({
      content: 'Selecciona un registro de ventas para descargar:',
      components: [row]
    });
  }
  
  /**
   * Borra mensajes anteriores del resumen
   */
  async borrarMensajesAnteriores(canal) {
    const mensajesPath = path.join(__dirname, '../../data/mensaje_resumen_limite.json');
    
    try {
      if (!fs.existsSync(mensajesPath)) return;
      
      const data = JSON.parse(fs.readFileSync(mensajesPath, 'utf8'));
      
      for (const id of Object.values(data)) {
        if (id) {
          try {
            const mensaje = await canal.messages.fetch(id);
            await mensaje.delete();
            logger.debug(`Mensaje anterior de ventas eliminado: ${id}`);
          } catch (error) {
            logger.debug(`No se pudo borrar mensaje ${id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.debug('No hay mensajes anteriores de ventas para borrar');
    }
  }
  
  /**
   * Guarda los IDs de los mensajes
   */
  guardarIdsMensajes(ids) {
    const mensajesPath = path.join(__dirname, '../../data/mensaje_resumen_limite.json');
    const dir = path.dirname(mensajesPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(mensajesPath, JSON.stringify(ids, null, 2));
    logger.debug('IDs de mensajes de ventas guardados');
  }
  
  /**
   * Genera el archivo de texto del registro semanal
   * CON FORMATO SIMPLE
   */
  async generarArchivoRegistro() {
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
    
    const registro = caches.registroSemanal.get() || {};
    const productos = caches.productos.get() || {};
    const bandas = caches.bandas.get() || {};
    
    let contenido = `${'═'.repeat(80)}\n`;
    contenido += `📊 REGISTRO DE VENTAS DEL ${diaLunes}-${mesLunes} AL ${diaDomingo}-${mesDomingo}\n`;
    contenido += `${'═'.repeat(80)}\n\n`;
    
    let totalGeneral = 0;
    const bandasOrdenadas = Object.entries(registro).sort((a, b) => {
      const precioA = a[1].preciototal || 0;
      const precioB = b[1].preciototal || 0;
      return precioB - precioA;
    });
    
    for (const [bandaId, productosVendidos] of bandasOrdenadas) {
      const banda = bandas[bandaId];
      const precio = productosVendidos.preciototal || 0;
      totalGeneral += precio;
      const precioFormateado = precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      
      // SEPARADOR SIMPLE CON GUIONES
      contenido += `${'-'.repeat(80)}\n`;
      contenido += `💰 ${banda?.nombre || bandaId} | ${precioFormateado}$\n`;
      contenido += `📍 ${banda?.ubicacion || 'Sin ubicación'}\n`;
      contenido += `${'-'.repeat(80)}\n\n`;
      
      for (const [productoId, cantidad] of Object.entries(productosVendidos)) {
        if (productoId === 'preciototal') continue;
        
        const producto = productos[productoId];
        const limite = producto?.limite_semanal || '—';
        
        let estado = '';
        if (cantidad === limite) {
          estado = ' ⚠️ (Máximo semanal alcanzado)';
        } else if (cantidad > limite && limite !== '—') {
          estado = ' 🔴 (SE HA EXCEDIDO EL LÍMITE)';
        }
        
        contenido += `  • ${producto?.nombre || productoId} → ${cantidad}/${limite}${estado}\n`;
      }
      
      contenido += '\n';
    }
    
    const totalFormateado = totalGeneral.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    contenido += `${'═'.repeat(80)}\n`;
    contenido += `💵 TOTAL GENERAL: ${totalFormateado}$\n`;
    contenido += `${'═'.repeat(80)}\n`;
    
    fs.writeFileSync(rutaArchivo, contenido, 'utf8');
    logger.info(`Archivo de ventas guardado: ${nombreArchivo}`);
  }
  
  /**
   * Resetea el registro semanal
   */
  async resetearRegistro() {
    // Generar archivo antes de resetear
    await this.generarArchivoRegistro();
    
    // Resetear a objeto vacío
    caches.registroSemanal.set({});
    
    logger.info('Registro semanal de ventas reseteado');
  }
}

module.exports = new VentaRegistroService();