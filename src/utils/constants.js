// ==========================================
// src/utils/constants.js
// Constantes y utilidades de Discord
// ==========================================

/**
 * Message Flags de Discord
 * https://discord.com/developers/docs/resources/message#message-object-message-flags
 */
const MessageFlags = {
  CROSSPOSTED: 1 << 0, // 1
  IS_CROSSPOST: 1 << 1, // 2
  SUPPRESS_EMBEDS: 1 << 2, // 4
  SOURCE_MESSAGE_DELETED: 1 << 3, // 8
  URGENT: 1 << 4, // 16
  HAS_THREAD: 1 << 5, // 32
  EPHEMERAL: 1 << 6, // 64 - Mensaje visible solo para el usuario
  LOADING: 1 << 7, // 128
  FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 1 << 8, // 256
  SUPPRESS_NOTIFICATIONS: 1 << 12, // 4096
  IS_VOICE_MESSAGE: 1 << 13 // 8192
};

/**
 * Tipos de interacción
 */
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
};

/**
 * Tipos de componentes
 */
const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  TEXT_INPUT: 4,
  USER_SELECT: 5,
  ROLE_SELECT: 6,
  MENTIONABLE_SELECT: 7,
  CHANNEL_SELECT: 8
};

/**
 * Estilos de botones
 */
const ButtonStyle = {
  PRIMARY: 1, // Azul
  SECONDARY: 2, // Gris
  SUCCESS: 3, // Verde
  DANGER: 4, // Rojo
  LINK: 5 // Link externo
};

/**
 * Estilos de input de texto
 */
const TextInputStyle = {
  SHORT: 1, // Una línea
  PARAGRAPH: 2 // Múltiples líneas
};

/**
 * Colores comunes para embeds
 */
const Colors = {
  DEFAULT: 0x000000,
  WHITE: 0xFFFFFF,
  AQUA: 0x1ABC9C,
  GREEN: 0x57F287,
  BLUE: 0x3498DB,
  YELLOW: 0xFEE75C,
  PURPLE: 0x9B59B6,
  LUMINOUS_VIVID_PINK: 0xE91E63,
  FUCHSIA: 0xEB459E,
  GOLD: 0xF1C40F,
  ORANGE: 0xE67E22,
  RED: 0xED4245,
  GREY: 0x95A5A6,
  NAVY: 0x34495E,
  DARK_AQUA: 0x11806A,
  DARK_GREEN: 0x1F8B4C,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368A,
  DARK_VIVID_PINK: 0xAD1457,
  DARK_GOLD: 0xC27C0E,
  DARK_ORANGE: 0xA84300,
  DARK_RED: 0x992D22,
  DARK_GREY: 0x979C9F,
  DARKER_GREY: 0x7F8C8D,
  LIGHT_GREY: 0xBCC0C0,
  DARK_NAVY: 0x2C3E50,
  BLURPLE: 0x5865F2,
  GREYPLE: 0x99AAB5,
  DARK_BUT_NOT_BLACK: 0x2C2F33,
  NOT_QUITE_BLACK: 0x23272A
};

/**
 * Límites de Discord
 */
const Limits = {
  EMBED_TITLE: 256,
  EMBED_DESCRIPTION: 4096,
  EMBED_FIELD_NAME: 256,
  EMBED_FIELD_VALUE: 1024,
  EMBED_FIELDS_COUNT: 25,
  EMBED_FOOTER: 2048,
  EMBED_AUTHOR: 256,
  EMBED_TOTAL: 6000,
  MESSAGE_CONTENT: 2000,
  SELECT_MENU_OPTIONS: 25,
  SELECT_MENU_PLACEHOLDER: 150,
  SELECT_MENU_LABEL: 100,
  SELECT_MENU_VALUE: 100,
  BUTTON_LABEL: 80,
  COMMAND_NAME: 32,
  COMMAND_DESCRIPTION: 100,
  COMMAND_OPTION_NAME: 32,
  COMMAND_OPTION_DESCRIPTION: 100,
  COMMAND_OPTION_CHOICES: 25,
  MODAL_TITLE: 45,
  TEXT_INPUT_LABEL: 45,
  TEXT_INPUT_PLACEHOLDER: 100,
  TEXT_INPUT_MIN_LENGTH: 0,
  TEXT_INPUT_MAX_LENGTH: 4000
};

/**
 * Emojis útiles
 */
const Emojis = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  MONEY: '💰',
  CALENDAR: '📅',
  USER: '👤',
  USERS: '👥',
  LOCATION: '📍',
  PACKAGE: '📦',
  CHART: '📊',
  DOCUMENT: '📄',
  FOLDER: '📂',
  BELL: '🔔',
  LOCK: '🔒',
  UNLOCK: '🔓',
  KEY: '🔑',
  GEAR: '⚙️',
  TOOLS: '🛠️',
  SHIELD: '🛡️',
  CROWN: '👑',
  STAR: '⭐',
  FIRE: '🔥',
  ROCKET: '🚀',
  TARGET: '🎯',
  DICE: '🎲',
  TROPHY: '🏆',
  MEDAL: '🥇'
};

/**
 * Crea opciones de respuesta efímera
 * @param {boolean} ephemeral - Si debe ser efímero
 * @returns {object} Opciones con flags
 */
function createReplyOptions(ephemeral = true) {
  return ephemeral ? { flags: MessageFlags.EPHEMERAL } : {};
}

/**
 * Crea un embed básico
 * @param {object} options - Opciones del embed
 * @returns {object} Objeto embed
 */
function createEmbed({ title, description, color = Colors.BLUE, fields = [], footer, timestamp = true }) {
  const embed = {
    title,
    description,
    color,
    fields
  };
  
  if (footer) {
    embed.footer = typeof footer === 'string' ? { text: footer } : footer;
  }
  
  if (timestamp) {
    embed.timestamp = new Date().toISOString();
  }
  
  return embed;
}

module.exports = {
  MessageFlags,
  InteractionType,
  ComponentType,
  ButtonStyle,
  TextInputStyle,
  Colors,
  Limits,
  Emojis,
  createReplyOptions,
  createEmbed
};