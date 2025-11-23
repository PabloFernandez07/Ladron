# 🤖 Bot de Discord - Sistema de Robos y Ventas

Bot profesional para servidores de roleplay con gestión automática de robos, ventas y estadísticas.

## 🚀 Inicio Rápido

### **Un solo comando para TODO:**

```bash
npm start
```

Esto automáticamente:
- ✅ Inicializa archivos de datos si faltan
- ✅ Verifica y crea la base de datos
- ✅ Despliega los comandos en Discord
- ✅ Inicia el bot

---

## 📋 Requisitos Previos

- **Node.js** v16 o superior
- **MySQL** 5.7 o superior
- **Token de Discord Bot**

---

## ⚙️ Configuración Inicial

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/Ladron.git
cd Ladron
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Discord
DISCORD_TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id
GUILD_IDS=id_servidor1,id_servidor2

# Canales
CANAL_MENSAJE_ROBOS=id_canal_robos
CANAL_VENTAS=id_canal_ventas
CANAL_LIMITES_ID=id_canal_limites
CANAL_AVISOS_ID=id_canal_avisos

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=discord_bot
DB_PORT=3306

# Administradores
USER_IDS=tu_user_id
USUARIO_AVISO_ID=id_usuario_avisos

# Servidor Principal
SERVER_ROBOS=id_servidor_principal
```

### 3. ¡Listo! Ejecuta:

```bash
npm start
```

---

## 📦 Comandos Disponibles

### Para Usuarios:

| Comando | Descripción |
|---------|-------------|
| `/robo` | Registrar un robo (con participantes, lugar, éxito/fracaso) |
| `/venta` | Registrar una venta paso a paso |
| `/resumen` | Ver resumen semanal actual |

### Para Administradores:

| Comando | Descripción |
|---------|-------------|
| `/addrobo` | Añadir nuevo establecimiento |
| `/addproducto` | Añadir nuevo producto |
| `/addbanda` | Añadir nueva banda |

---

## 🛠️ Scripts NPM

```bash
# Inicio completo (recomendado)
npm start

# Modo desarrollo (auto-reload)
npm dev

# Solo el bot (sin deploy)
npm run bot

# Solo deploy de comandos
npm run deploy

# Inicializar datos
npm run init-data

# Migrar base de datos
npm run migrate

# Verificar configuración
npm run check
```

---

## 📊 Características

### ✅ Sistema de Robos
- Registro automático de robos por tipo (bajo, medio, grande)
- Límites diarios por usuario (3 robos/24h)
- Contadores semanales automáticos
- Soporte para robos especiales (T1, T2, RC)
- Resumen actualizado en tiempo real

### ✅ Sistema de Ventas
- Registro de ventas por banda
- Límites semanales por producto
- Control de stock automático
- Alertas de límites excedidos

### ✅ Estadísticas
- Resumen semanal visual con emojis
- Tracking de robos por usuario
- Descarga de registros históricos
- Reseteo automático semanal (lunes 20:00)

### ✅ Características Técnicas
- Arquitectura modular y escalable
- Sistema de caché inteligente
- Logging profesional con Winston
- Validación de datos con Joi
- Base de datos MySQL con pool de conexiones
- Manejo robusto de errores
- Servidores Express para descarga de registros

---

## 🎯 Estructura del Proyecto

```
Ladron/
├── src/
│   ├── commands/       # Comandos slash
│   ├── events/         # Eventos de Discord
│   ├── handlers/       # Manejadores de interacciones
│   ├── services/       # Lógica de negocio
│   ├── database/       # Conexión y queries
│   ├── utils/          # Utilidades
│   ├── config/         # Configuración
│   ├── cron/           # Tareas programadas
│   └── index.js        # Punto de entrada
├── scripts/
│   ├── start-all.js    # Script de inicio unificado
│   └── deploy-all.js   # Deploy de comandos
├── data/               # Archivos JSON
├── logs/               # Logs del sistema
└── .env                # Variables de entorno
```

---

## 🔄 Cron Jobs Automáticos

- **Reset Semanal:** Lunes 20:00 (robos y ventas)
- **Limpieza Diaria:** Cada 15 minutos (límites expirados)

---

## 🐛 Solución de Problemas

### El bot no se conecta
```bash
# Verifica el token
node -e "console.log(process.env.DISCORD_TOKEN)"
```

### Error de base de datos
```bash
# Verifica conexión
mysql -h localhost -u root -p

# Recrea la base de datos
npm run migrate
```

### Comandos no aparecen
```bash
# Re-despliega comandos
npm run deploy
```

### Archivos de datos corruptos
```bash
# Reinicializa datos
npm run init-data
```

---

## 📝 Notas Importantes

- El bot necesita permisos de **Administrator** o específicos de **Send Messages**, **Embed Links**, **Use Application Commands**
- Los intents de **Message Content** NO son necesarios (solo usa slash commands)
- Los registros semanales se guardan automáticamente en `data/registros/`
- Los límites diarios se resetean 24h después del primer robo de cada usuario

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 👤 Autor

**Tu Nombre**

- GitHub: [@](https://github.com/tu-usuario)

---

## 🙏 Agradecimientos

- [Discord.js](https://discord.js.org/) - Librería de Discord
- [Winston](https://github.com/winstonjs/winston) - Sistema de logging
- [MySQL2](https://github.com/sidorares/node-mysql2) - Conector MySQL

---

**¿Problemas?** Abre un [issue](https://github.com/tu-usuario/Ladron/issues)

**¿Mejoras?** Envía un [pull request](https://github.com/tu-usuario/Ladron/pulls)