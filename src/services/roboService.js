// ==========================================
// src/services/roboService.js - CORREGIDO
// ==========================================
const { EmbedBuilder } = require("discord.js");
const { RoboQueries } = require("../database/queries");
const { caches } = require("./cacheService");
const config = require("../config");
const logger = require("../utils/logger");
const { validarParticipantes } = require("../utils/validators");

class RoboService {
  constructor() {
    this.limitesDiarios = new Map(); // userId -> { primerRobo: timestamp, robos: number }
  }

  // En src/services/roboService.js

  async registrarRobo(interaction, data) {
    try {
      // Validar participantes
      const participantesIds = validarParticipantes(
        data.participantes,
        config.limites.participantesMax
      );

      // Obtener establecimiento
      const establecimientos = caches.establecimientos.get();

      if (!establecimientos || Object.keys(establecimientos).length === 0) {
        throw new Error("No hay establecimientos configurados");
      }

      const establecimiento = this.buscarEstablecimiento(
        establecimientos,
        data.establecimientoValue
      );

      if (!establecimiento) {
        throw new Error("Establecimiento no encontrado");
      }

      // Validar límites diarios
      await this.validarLimitesDiarios(participantesIds);

      // ✅ Registrar UN robo con MÚLTIPLES participantes
      try {
        const result = await RoboQueries.registrarRobo({
          establecimiento: establecimiento.value,
          tipo: establecimiento.tipo,
          exito: data.exito,
          guildId: interaction.guild.id,
          imagenUrl: data.imagenUrl,
          participantes: participantesIds, // Array de IDs
        });

        logger.info(
          `Robo ${result.roboId} registrado con ${result.participantesCount} participantes`
        );
      } catch (dbError) {
        logger.warn("No se pudo registrar en BD:", dbError);
      }

      // Actualizar contadores y crear embed
      await this.actualizarContadores(
        establecimiento,
        data.exito,
        participantesIds
      );
      const embed = this.crearEmbedRobo(establecimiento, data);

      return { embed, establecimiento };
    } catch (error) {
      logger.error("Error registrando robo:", error);
      throw error;
    }
  }

  buscarEstablecimiento(establecimientos, valor) {
    for (const tipo in establecimientos) {
      const est = establecimientos[tipo].find((e) => e.value === valor);
      if (est) {
        return { ...est, tipo };
      }
    }
    return null;
  }

  async validarLimitesDiarios(participantesIds) {
    const ahora = Date.now();
    const ms24h = 24 * 60 * 60 * 1000;

    for (const userId of participantesIds) {
      const datos = this.limitesDiarios.get(userId);

      if (!datos) {
        this.limitesDiarios.set(userId, {
          primerRobo: ahora,
          robos: 1,
        });
      } else {
        // Si pasaron 24h, resetear
        if (ahora - datos.primerRobo >= ms24h) {
          this.limitesDiarios.set(userId, {
            primerRobo: ahora,
            robos: 1,
          });
        } else {
          // Incrementar contador
          datos.robos++;

          if (datos.robos > config.limites.robosDiarios) {
            throw new Error(
              `<@${userId}> ha superado el límite de ${config.limites.robosDiarios} robos diarios`
            );
          }
        }
      }
    }
  }

  async actualizarContadores(establecimiento, exito, participantesIds) {
    const resumen = caches.robosSemana.get() || {};

    if (!resumen[establecimiento.tipo]) {
      resumen[establecimiento.tipo] = {};
    }

    if (!resumen[establecimiento.tipo][establecimiento.value]) {
      resumen[establecimiento.tipo][establecimiento.value] = {
        exitosos: 0,
        fallidos: 0,
      };
    }

    if (exito) {
      resumen[establecimiento.tipo][establecimiento.value].exitosos++;
    } else {
      resumen[establecimiento.tipo][establecimiento.value].fallidos++;
    }

    caches.robosSemana.set(resumen);
  }

  crearEmbedRobo(establecimiento, data) {
    const tipoInfo = config.tipos[establecimiento.tipo];

    const embed = new EmbedBuilder()
      .setTitle(`${tipoInfo.emoji} ${tipoInfo.label}`)
      .setColor(tipoInfo.color)
      .addFields(
        { name: "🬠Establecimiento", value: establecimiento.name, inline: true },
        { name: "👥 Participantes", value: data.participantes, inline: true },
        {
          name: "🎯 Resultado",
          value: data.exito ? "✅ Éxito" : "❌ Fracaso",
          inline: false,
        }
      )
      .setTimestamp();

    if (data.imagenUrl) {
      embed.setImage(data.imagenUrl);
    }

    return embed;
  }

  obtenerLimitesDiarios() {
    return Array.from(this.limitesDiarios.entries()).map(([userId, datos]) => ({
      userId,
      robos: datos.robos,
      resetEn: new Date(datos.primerRobo + 24 * 60 * 60 * 1000),
    }));
  }
}

// EXPORTAR UNA INSTANCIA DE LA CLASE
module.exports = new RoboService();
