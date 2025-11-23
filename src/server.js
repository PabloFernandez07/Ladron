// ==========================================
// src/server.js
// ==========================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('./config');
const logger = require('./utils/logger');

function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function crearServidorRobos(port) {
  const app = express();
  const registrosDir = config.paths.registros;
  
  app.get('/descargar-ultimo-registro', (req, res) => {
    try {
      if (!fs.existsSync(registrosDir)) {
        return res.status(404).send('No hay registros disponibles.');
      }
      
      const archivos = fs.readdirSync(registrosDir)
        .filter(file => file.startsWith('Registro_Robos_Semana_') && file.endsWith('.txt'))
        .sort((a, b) => a.localeCompare(b));
      
      if (archivos.length === 0) {
        return res.status(404).send('No hay registros disponibles.');
      }
      
      const archivoMasReciente = archivos[archivos.length - 1];
      const ruta = path.join(registrosDir, archivoMasReciente);
      
      res.download(ruta, archivoMasReciente);
      logger.info(`Registro descargado: ${archivoMasReciente}`, {
        ip: req.ip
      });
    } catch (error) {
      logger.error('Error en /descargar-ultimo-registro:', error);
      res.status(500).send('Error al descargar el registro.');
    }
  });
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  
  const server = app.listen(port, () => {
    const ip = obtenerIPLocal();
    logger.info(`🚀 Servidor de robos activo: http://${ip}:${port}/descargar-ultimo-registro`);
  });
  
  return {
    app,
    server,
    url: `http://${obtenerIPLocal()}:${port}/descargar-ultimo-registro`
  };
}

function crearServidorVentas(port) {
  const app = express();
  const registrosDir = config.paths.registrosVentas;
  
  app.get('/descargar-ultimo-registro-venta', (req, res) => {
    try {
      if (!fs.existsSync(registrosDir)) {
        return res.status(404).send('No hay registros disponibles.');
      }
      
      const archivos = fs.readdirSync(registrosDir)
        .filter(file => file.startsWith('Registro_Ventas_Semana_') && file.endsWith('.txt'))
        .sort((a, b) => a.localeCompare(b));
      
      if (archivos.length === 0) {
        return res.status(404).send('No hay registros disponibles.');
      }
      
      const archivoMasReciente = archivos[archivos.length - 1];
      const ruta = path.join(registrosDir, archivoMasReciente);
      
      res.download(ruta, archivoMasReciente);
      logger.info(`Registro de venta descargado: ${archivoMasReciente}`, {
        ip: req.ip
      });
    } catch (error) {
      logger.error('Error en /descargar-ultimo-registro-venta:', error);
      res.status(500).send('Error al descargar el registro.');
    }
  });
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  
  const server = app.listen(port, () => {
    const ip = obtenerIPLocal();
    logger.info(`🚀 Servidor de ventas activo: http://${ip}:${port}/descargar-ultimo-registro-venta`);
  });
  
  return {
    app,
    server,
    url: `http://${obtenerIPLocal()}:${port}/descargar-ultimo-registro-venta`
  };
}

function iniciarServidores(client) {
  try {
    const servidorRobos = crearServidorRobos(config.express.port);
    const servidorVentas = crearServidorVentas(config.express.portVentas);
    
    // Guardar referencias en el cliente
    client.servidores = {
      robos: servidorRobos,
      ventas: servidorVentas
    };
    
    logger.info('✅ Servidores Express iniciados correctamente');
    
    return {
      robos: servidorRobos,
      ventas: servidorVentas
    };
  } catch (error) {
    logger.error('Error iniciando servidores Express:', error);
    throw error;
  }
}

module.exports = { iniciarServidores };