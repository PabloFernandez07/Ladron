// ==========================================
// src/services/registroService.js - COMPLETO
// ==========================================
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { caches } = require('./cacheService');

class RegistroService {
  /**
   * Envía el resumen semanal completo al canal
   */
  async enviarResumenSemanal(guild) {
    try {
      const canal = guild.channels.cache.get(config.canales.robos);
      
      if (!canal) {
        logger.error('Canal de resumen no encontrado');
        return;
      }
      
      // Crear embeds
      const embedRobos = await this.crearEmbedRobos();
      const embedUsuarios = await this.crearEmbedUsuarios();
      
      // Borrar mensajes anteriores si existen
      await this.borrarMensajesAnteriores(canal);
      
      // Enviar nuevos mensajes
      const mensajeRobos = await canal.send({ embeds: [embedRobos] });
      const mensajeUsuarios = await canal.send({ embeds: [embedUsuarios] });
      
      // Enviar menú de descarga
      const menuMensaje = await this.enviarMenuDescarga(canal);
      
      // Guardar IDs de mensajes
      this.guardarIdsMensajes({
        resumenId: mensajeRobos.id,
        registroId: mensajeUsuarios.id,
        menuId: menuMensaje?.id
      });
      
      logger.info('Resumen semanal enviado correctamente');
      
    } catch (error) {
      logger.error('Error enviando resumen semanal:', error);
      throw error;
    }
  }
  
  /**
   * Crea el embed de robos semanales con formato mejorado
   */
  async crearEmbedRobos() {
    const resumen = caches.robosSemana.get() || {};
    const establecimientos = caches.establecimientos.get() || {};
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Registro semanal de robos')
      .setColor(0x5865F2)
      .setTimestamp();
    
    // Agregar nota al pie
    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });
    
    embed.setFooter({ 
      text: `Los robos con límite diario muestran también el conteo semanal • hoy a las ${horaActual}`
    });
    
    // Procesar cada tipo de robo
    for (const [tipo, lista] of Object.entries(establecimientos)) {
      if (!lista || lista.length === 0) continue;
      
      const robos = resumen[tipo] || {};
      const tipoInfo = config.tipos[tipo];
      
      let contenido = this.generarContenidoTipo(tipo, lista, robos);
      
      // Solo agregar si hay contenido
      if (contenido.length > 10) {
        embed.addFields({
          name: `${tipoInfo.emoji} **${tipoInfo.label}**`,
          value: contenido,
          inline: false
        });
      }
    }
    
    return embed;
  }
  
  /**
   * Genera el contenido formateado para un tipo de robo
   */
  generarContenidoTipo(tipo, lista, robos) {
    let contenido = '```ansi\n';
    
    // Separar robos normales y agrupados
    const normales = lista.filter(e => !e.tiporobo);
    const agrupados = this.agruparPorTipo(lista);
    
    // ROBOS NORMALES (sin tipo especial)
    if (normales.length > 0) {
      for (const est of normales) {
        const datos = robos[est.value] || { exitosos: 0, fallidos: 0 };
        const total = datos.exitosos + datos.fallidos;
        
        // Emoji según el establecimiento
        const emoji = this.obtenerEmojiEstablecimiento(est.name);
        
        // Formatear línea con colores ANSI
        contenido += `${emoji} \u001b[37m${est.name.padEnd(18)}\u001b[0m | Total: ${total.toString().padStart(3)} | `;
        contenido += `\u001b[32m✅ ${datos.exitosos.toString().padStart(2)}\u001b[0m | `;
        contenido += `\u001b[31m❌ ${datos.fallidos.toString().padStart(2)}\u001b[0m\n`;
      }
    }
    
    // ROBOS AGRUPADOS (T1, T2, RC, etc.)
    const gruposOrdenados = Object.keys(agrupados).sort();
    
    for (const tipoRobo of gruposOrdenados) {
      const ests = agrupados[tipoRobo];
      const totalGrupo = this.calcularTotalGrupo(ests, robos);
      const totalRobos = totalGrupo.exitosos + totalGrupo.fallidos;
      const limite = ests[0]?.limite || 0;
      const esDiario = ests[0]?.tipolimite?.toLowerCase() === 'diario';
      
      // Encabezado del grupo con color
      contenido += `\n\u001b[33m--------- Robos ${tipoRobo.toUpperCase()} ${totalRobos}/${limite}`;
      if (esDiario) {
        contenido += ' \u001b[35m(LIMITE DIARIO)\u001b[0m';
      }
      contenido += ' \u001b[33m---------\u001b[0m\n';
      
      // Establecimientos del grupo
      for (const est of ests) {
        const datos = robos[est.value] || { exitosos: 0, fallidos: 0 };
        const total = datos.exitosos + datos.fallidos;
        const emoji = this.obtenerEmojiEstablecimiento(est.name);
        
        contenido += `${emoji} \u001b[37m${est.name.padEnd(18)}\u001b[0m | Total: ${total.toString().padStart(3)} | `;
        contenido += `\u001b[32m✅ ${datos.exitosos.toString().padStart(2)}\u001b[0m | `;
        contenido += `\u001b[31m❌ ${datos.fallidos.toString().padStart(2)}\u001b[0m\n`;
        
        // Si tiene contador semanal (para robos diarios)
        if (esDiario && datos.semanal) {
          const totalSemanal = datos.semanal.exitosos + datos.semanal.fallidos;
          contenido += `                     | Semanal: ${totalSemanal.toString().padStart(3)} | `;
          contenido += `\u001b[32m✅ ${datos.semanal.exitosos.toString().padStart(2)}\u001b[0m | `;
          contenido += `\u001b[31m❌ ${datos.semanal.fallidos.toString().padStart(2)}\u001b[0m\n`;
        }
      }
    }
    
    contenido += '```';
    return contenido;
  }
  
  /**
   * Obtiene el emoji correspondiente al establecimiento
   */
  obtenerEmojiEstablecimiento(nombre) {
    const emojis = {
      'tienda': '👕',
      'digital': '🏪',
      'farmacia': '💊',
      'casa': '🏠',
      'pawn': '🏬',
      'taller': '🔧',
      'joyeria': '💎',
      'almacen': '🏢',
      'furgon': '🚐',
      'paleto': '🏦',
      'camion': '🚚',
      'garaje': '🏗️',
      'sucursal': '🟡'
    };
    
    const nombreLower = nombre.toLowerCase();
    for (const [key, emoji] of Object.entries(emojis)) {
      if (nombreLower.includes(key)) return emoji;
    }
    
    return '🎯';
  }
  
  /**
   * Agrupa establecimientos por tipo de robo
   */
  agruparPorTipo(lista) {
    const grupos = {};
    
    lista.forEach(est => {
      if (est.tiporobo) {
        if (!grupos[est.tiporobo]) grupos[est.tiporobo] = [];
        grupos[est.tiporobo].push(est);
      }
    });
    
    return grupos;
  }
  
  /**
   * Calcula el total de un grupo de establecimientos
   */
  calcularTotalGrupo(ests, robos) {
    return ests.reduce((acc, e) => {
      const d = robos[e.value] || { exitosos: 0, fallidos: 0 };
      return {
        exitosos: acc.exitosos + d.exitosos,
        fallidos: acc.fallidos + d.fallidos
      };
    }, { exitosos: 0, fallidos: 0 });
  }
  
  /**
   * Crea el embed de robos por usuario con menciones clicables
   */
  async crearEmbedUsuarios() {
    const roboService = require('./roboService');
    const limites = roboService.obtenerLimitesDiarios();
    
    // Ordenar por cantidad de robos (mayor a menor)
    limites.sort((a, b) => b.robos - a.robos);
    
    if (limites.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('👥 Robos por usuario')
        .setColor(0x95A5A6)
        .setDescription('*No hay robos registrados hoy*')
        .setTimestamp();
      
      return embed;
    }
    
    // Crear descripción con usuarios clicables
    let descripcion = '';
    
    for (const { userId, robos, resetEn } of limites) {
      const fecha = resetEn.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid'
      });
      
      // Determinar emoji según progreso
      let emoji = '🟢';
      let estadoColor = '';
      
      if (robos >= config.limites.robosDiarios) {
        emoji = '🔴';
        estadoColor = '**';
      } else if (robos >= 2) {
        emoji = '🟡';
      }
      
      // Formato: <@userId> | 2/3 | fecha
      descripcion += `${emoji} <@${userId}> | ${estadoColor}${robos}/${config.limites.robosDiarios}${estadoColor} | ${fecha}\n`;
      descripcion += `${'─'.repeat(60)}\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('👥 Robos por usuario')
      .setDescription(descripcion)
      .setColor(0x2ECC71)
      .setTimestamp()
      .setFooter({ 
        text: 'Se resetea 24h después del primer robo de cada usuario' 
      });
    
    return embed;
  }
  
  /**
   * Envía el menú de descarga de registros
   */
  async enviarMenuDescarga(canal) {
    const archivos = fs.readdirSync(config.paths.registros)
      .filter(f => f.startsWith('Registro_Robos_Semana_') && f.endsWith('.txt'))
      .sort((a, b) => b.localeCompare(a)) // Más reciente primero
      .slice(0, 24); // Últimos 24
    
    if (archivos.length === 0) return null;
    
    const opciones = [
      {
        label: '📂 Selecciona un registro para descargar',
        value: 'placeholder',
        description: 'Elige un archivo del listado',
        default: true
      },
      ...archivos.map(file => ({
        label: file.replace('Registro_Robos_Semana_', '').replace('.txt', ''),
        value: file,
        description: 'Registro semanal'
      }))
    ];
    
    const menu = new StringSelectMenuBuilder()
      .setCustomId('seleccionar_registro')
      .setPlaceholder('📂 Selecciona un registro para descargar')
      .addOptions(opciones);
    
    const row = new ActionRowBuilder().addComponents(menu);
    
    return await canal.send({
      content: 'Selecciona un registro semanal para descargar:',
      components: [row]
    });
  }
  
  /**
   * Borra los mensajes anteriores del resumen
   */
  async borrarMensajesAnteriores(canal) {
    const mensajesPath = path.join(__dirname, '../../data/mensaje_resumen.json');
    
    try {
      if (!fs.existsSync(mensajesPath)) return;
      
      const data = JSON.parse(fs.readFileSync(mensajesPath, 'utf8'));
      
      for (const id of Object.values(data)) {
        if (id) {
          try {
            const mensaje = await canal.messages.fetch(id);
            await mensaje.delete();
            logger.debug(`Mensaje anterior eliminado: ${id}`);
          } catch (error) {
            logger.debug(`No se pudo borrar mensaje ${id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.debug('No hay mensajes anteriores para borrar');
    }
  }
  
  /**
   * Guarda los IDs de los mensajes del resumen
   */
  guardarIdsMensajes(ids) {
    const mensajesPath = path.join(__dirname, '../../data/mensaje_resumen.json');
    const dir = path.dirname(mensajesPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(mensajesPath, JSON.stringify(ids, null, 2));
    logger.debug('IDs de mensajes guardados');
  }
}

module.exports = new RegistroService();