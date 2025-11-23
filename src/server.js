// ==========================================
// src/server.js - ACTUALIZADO CON API
// ==========================================
const express = require('express');
const cors = require('cors');
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

function crearServidorPrincipal(port) {
  const app = express();
  
  // ==========================================
  // MIDDLEWARES
  // ==========================================
  
  // CORS - Permitir peticiones del frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite usa puerto 5173
    credentials: true
  }));
  
  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Logger de peticiones
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
  
  // ==========================================
  // RUTAS DE API
  // ==========================================
  
  // Importar routers de API
  const statsRouter = require('./api/stats');
  const robosRouter = require('./api/robos');
  const ventasRouter = require('./api/ventas');
  
  // Montar routers
  app.use('/api', statsRouter);
  app.use('/api', robosRouter);
  app.use('/api', ventasRouter);
  
  // ==========================================
  // RUTAS DE DESCARGA (YA EXISTENTES)
  // ==========================================
  
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
  
  // ==========================================
  // RUTAS DE SALUD
  // ==========================================
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      endpoints: {
        api: '/api',
        stats: '/api/stats',
        robos: '/api/robos',
        ventas: '/api/ventas'
      }
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: 'connected', // TODO: verificar conexión real
      cache: 'active',
      timestamp: new Date().toISOString()
    });
  });
  
  // ==========================================
  // MANEJO DE ERRORES 404
  // ==========================================
  
  app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint no encontrado',
      path: req.path,
      method: req.method
    });
  });
  
  // ==========================================
  // MANEJO DE ERRORES GLOBALES
  // ==========================================
  
  app.use((err, req, res, next) => {
    logger.error('Error en servidor:', err);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  
  // ==========================================
  // INICIAR SERVIDOR
  // ==========================================
  
  const server = app.listen(port, () => {
    const ip = obtenerIPLocal();
    console.log('');
    logger.info(`🚀 Servidor API activo en:`);
    logger.info(`   Local:   http://localhost:${port}`);
    logger.info(`   Red:     http://${ip}:${port}`);
    logger.info(`   Health:  http://localhost:${port}/health`);
    logger.info(`   API:     http://localhost:${port}/api/stats`);
    console.log('');
  });
  
  return {
    app,
    server,
    url: `http://${obtenerIPLocal()}:${port}`
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
    const servidorPrincipal = crearServidorPrincipal(config.express.port);
    const servidorVentas = crearServidorVentas(config.express.portVentas);
    
    // Guardar referencias en el cliente
    client.servidores = {
      principal: servidorPrincipal,
      ventas: servidorVentas
    };
    
    logger.info('✅ Servidores Express iniciados correctamente');
    
    return {
      principal: servidorPrincipal,
      ventas: servidorVentas
    };
  } catch (error) {
    logger.error('Error iniciando servidores Express:', error);
    throw error;
  }
}

module.exports = { iniciarServidores };