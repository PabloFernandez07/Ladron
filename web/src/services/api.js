// ==========================================
// src/services/api.js
// Servicio para conectar con la API del backend
// ==========================================
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para logging (desarrollo)
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

// ==========================================
// ESTADÍSTICAS
// ==========================================

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getResumen = async () => {
  const response = await api.get('/stats/resumen');
  return response.data;
};

// ==========================================
// ROBOS
// ==========================================

export const getRobos = async (params = {}) => {
  const response = await api.get('/robos', { params });
  return response.data;
};

export const getRobosPorDia = async (dias = 30) => {
  const response = await api.get('/robos/por-dia', { 
    params: { dias } 
  });
  return response.data;
};

export const getRobosPorTipo = async (dias = 7) => {
  const response = await api.get('/robos/por-tipo', { 
    params: { dias } 
  });
  return response.data;
};

export const getRobosPorEstablecimiento = async (dias = 7) => {
  const response = await api.get('/robos/por-establecimiento', { 
    params: { dias } 
  });
  return response.data;
};

export const getTopUsuarios = async (dias = 7, limit = 10) => {
  const response = await api.get('/robos/top-usuarios', { 
    params: { dias, limit } 
  });
  return response.data;
};

export const getRobosHeatmap = async (dias = 30) => {
  const response = await api.get('/robos/heatmap', { 
    params: { dias } 
  });
  return response.data;
};

// ==========================================
// VENTAS
// ==========================================

export const getVentas = async (params = {}) => {
  const response = await api.get('/ventas', { params });
  return response.data;
};

export const getVentasPorBanda = async (dias = 7) => {
  const response = await api.get('/ventas/por-banda', { 
    params: { dias } 
  });
  return response.data;
};

export const getProductosTop = async (dias = 7, limit = 10) => {
  const response = await api.get('/ventas/productos-top', { 
    params: { dias, limit } 
  });
  return response.data;
};

export const getVentasTimeline = async (dias = 30) => {
  const response = await api.get('/ventas/timeline', { 
    params: { dias } 
  });
  return response.data;
};

export const getVentasLimites = async () => {
  const response = await api.get('/ventas/limites');
  return response.data;
};

// ==========================================
// UTILIDADES
// ==========================================

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default api;