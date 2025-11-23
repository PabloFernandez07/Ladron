// ==========================================
// src/services/registroService.js
// ==========================================
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { caches } = require('./cacheService');
const roboService = require('./roboService');

class RegistroService {
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
        robos: mensajeRobos.id,
        usuarios: mensajeUsuarios.id,
        menu: menuMensaje?.id
      });
      
      logger.info('Resumen semanal enviado correctamente');
      
    } catch (error) {
      logger.error('Error enviando resumen semanal:', error);
      throw error;
    }
  }
  
  async crearEmbedRobos() {
    const resumen = caches.robosSemana.get() || {};
    const establecimientos = caches.establecimientos.get() || {};
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Registro Semanal de Robos')
      .setColor(0x3498DB)
      .setTimestamp()
      .setFooter({ text: 'Los robos con límite diario muestran también el conteo semanal' });
    
    for (const [tipo, lista] of Object.entries(establecimientos)) {
      const robos = resumen[tipo] || {};
      const tipoInfo = config.tipos[tipo];
      
      let bloque = '```\n';
      
      // Robos normales
      const normales = lista.filter(e => !e.tiporobo);
      for (const est of normales) {
        const datos = robos[est.value] || { exitosos: 0, fallidos: 0 };
        const total = datos.exitosos + datos.fallidos;
        
        bloque += `${est.name.padEnd(25)} | ${total.toString().padStart(3)} | ✅ ${datos.exitosos.toString().padStart(2)} | ❌ ${datos.fallidos.toString().padStart(2)}\n`;
      }
      
      // Robos agrupados
      const grupos = {};
      lista.forEach(est => {
        if (est.tiporobo) {
          if (!grupos[est.tiporobo]) grupos[est.tiporobo] = [];
          grupos[est.tiporobo].push(est);
        }
      });
      
      for (const [grupo, ests] of Object.entries(grupos)) {
        const totalGrupo = ests.reduce((acc, e) => {
          const d = robos[e.value] || { exitosos: 0, fallidos: 0 };
          return {
            exitosos: acc.exitosos + d.exitosos,
            fallidos: acc.fallidos + d.fallidos
          };
        }, { exitosos: 0, fallidos: 0 });
        
        const totalRobos = totalGrupo.exitosos + totalGrupo.fallidos;
        const limite = ests[0]?.limite || '—';
        
        bloque += `\n--- Robos ${grupo.toUpperCase()}: ${totalRobos}/${limite} ---\n`;
        
        for (const est of ests) {
          const datos = robos[est.value] || { exitosos: 0, fallidos: 0 };
          const total = datos.exitosos + datos.fallidos;
          
          bloque += `${est.name.padEnd(25)} | ${total.toString().padStart(3)} | ✅ ${datos.exitosos.toString().padStart(2)} | ❌ ${datos.fallidos.toString().padStart(2)}\n`;
        }
      }
      
      bloque += '```';
      
      embed.addFields({
        name: `${tipoInfo.emoji} ${tipoInfo.label}`,
        value: bloque
      });
    }
    
    return embed;
  }
  
  async crearEmbedUsuarios() {
    const limites = roboService.obtenerLimitesDiarios();
    
    let descripcion = '```\n';
    descripcion += 'Usuario               | Robos | Reset en\n';
    descripcion += '-'.repeat(60) + '\n';
    
    limites.sort((a, b) => b.robos - a.robos);
    
    for (const { userId, robos, resetEn } of limites) {
      const fecha = resetEn.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      descripcion += `<@${userId}>`.padEnd(22) + `| ${robos}/${config.limites.robosDiarios}   | ${fecha}\n`;
    }
    
    if (limites.length === 0) {
      descripcion += 'No hay robos registrados hoy\n';
    }
    
    descripcion += '```';
    
    const embed = new EmbedBuilder()
      .setTitle('👤 Robos por Usuario (24h)')
      .setColor(0x2ECC71)
      .setDescription(descripcion)
      .setTimestamp();
    
    return embed;
  }
  
  async enviarMenuDescarga(canal) {
    const archivos = fs.readdirSync(config.paths.registros)
      .filter(f => f.startsWith('Registro_Robos_Semana_') && f.endsWith('.txt'))
      .sort((a, b) => a.localeCompare(b))
      .slice(-24); // Últimos 24
    
    if (archivos.length === 0) return null;
    
    const opciones = [
      {
        label: '📂 Selecciona un registro para descargar',
        value: 'placeholder',
        description: 'Elige un archivo del listado',
        default: true
      },
      ...archivos.map(file => ({
        label: file.replace('.txt', ''),
        value: file
      }))
    ];
    
    const menu = new StringSelectMenuBuilder()
      .setCustomId('seleccionar_registro')
      .setPlaceholder('📂 Selecciona un registro')
      .addOptions(opciones);
    
    const row = new ActionRowBuilder().addComponents(menu);
    
    return await canal.send({
      content: '📥 Descarga registros anteriores:',
      components: [row]
    });
  }
  
  async borrarMensajesAnteriores(canal) {
    const mensajesPath = path.join(__dirname, '../../data/mensaje_resumen.json');
    
    try {
      const data = JSON.parse(fs.readFileSync(mensajesPath, 'utf8'));
      
      for (const id of Object.values(data)) {
        if (id) {
          try {
            const mensaje = await canal.messages.fetch(id);
            await mensaje.delete();
          } catch (error) {
            logger.debug(`No se pudo borrar mensaje ${id}`);
          }
        }
      }
    } catch (error) {
      logger.debug('No hay mensajes anteriores para borrar');
    }
  }
  
  guardarIdsMensajes(ids) {
    const mensajesPath = path.join(__dirname, '../../data/mensaje_resumen.json');
    const dir = path.dirname(mensajesPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(mensajesPath, JSON.stringify(ids, null, 2));
  }
}

module.exports = new RegistroService();