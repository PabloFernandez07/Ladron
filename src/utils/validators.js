// ==========================================
// src/utils/validators.js
// ==========================================
const Joi = require('joi');

const schemas = {
  participantes: Joi.string()
    .pattern(/<@!?\d+>/)
    .required()
    .messages({
      'string.pattern.base': 'Debes mencionar al menos un usuario con @'
    }),
  
  cantidad: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.base': 'La cantidad debe ser un número',
      'number.min': 'La cantidad mínima es 1',
      'number.max': 'La cantidad máxima es 1000'
    }),
  
  precio: Joi.number()
    .positive()
    .max(999999999)
    .required()
    .messages({
      'number.positive': 'El precio debe ser positivo',
      'number.max': 'El precio es demasiado alto'
    })
};

function validarParticipantes(participantesStr, maxParticipantes = 10) {
  const { error } = schemas.participantes.validate(participantesStr);
  
  if (error) {
    throw new Error(error.message);
  }
  
  const ids = [...participantesStr.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);
  
  if (ids.length === 0) {
    throw new Error('No se detectaron menciones válidas de usuarios');
  }
  
  if (ids.length > maxParticipantes) {
    throw new Error(`Máximo ${maxParticipantes} participantes por robo`);
  }
  
  // Eliminar duplicados
  return [...new Set(ids)];
}

function validarCantidad(cantidad) {
  const { error, value } = schemas.cantidad.validate(cantidad);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return value;
}

function validarPrecio(precio) {
  const { error, value } = schemas.precio.validate(precio);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return value;
}

module.exports = {
  validarParticipantes,
  validarCantidad,
  validarPrecio
};