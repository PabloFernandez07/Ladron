-- ==========================================
-- database/schema.sql - ACTUALIZADO
-- ==========================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS discord_bot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE discord_bot;

-- Tabla de robos (eventos únicos)
CREATE TABLE IF NOT EXISTS robos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    establecimiento VARCHAR(100) NOT NULL,
    tipo ENUM('bajo', 'medio', 'grande') NOT NULL,
    exito BOOLEAN NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    imagen_url TEXT,
    participantes JSON,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_fecha (fecha),
    INDEX idx_guild (guild_id),
    INDEX idx_establecimiento (establecimiento),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ✅ NUEVA: Tabla de participantes de robos (para queries eficientes)
CREATE TABLE IF NOT EXISTS participantes_robos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    robo_id BIGINT NOT NULL,
    usuario_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (robo_id) REFERENCES robos(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_robo (robo_id),
    INDEX idx_guild (guild_id),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    banda_id VARCHAR(100) NOT NULL,
    usuario_id VARCHAR(20) NOT NULL,
    precio_total DECIMAL(12,2) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_fecha (fecha),
    INDEX idx_banda (banda_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos de ventas
CREATE TABLE IF NOT EXISTS venta_productos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    venta_id BIGINT NOT NULL,
    producto_id VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL,
    
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    INDEX idx_venta (venta_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de límites diarios (opcional)
CREATE TABLE IF NOT EXISTS limites_diarios (
    usuario_id VARCHAR(20) PRIMARY KEY,
    primer_robo BIGINT NOT NULL,
    robos INT NOT NULL DEFAULT 1,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- VISTAS ÚTILES
-- ==========================================

CREATE OR REPLACE VIEW v_robos_semana_actual AS
SELECT 
    tipo,
    establecimiento,
    SUM(CASE WHEN exito = 1 THEN 1 ELSE 0 END) as exitosos,
    SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as fallidos,
    COUNT(*) as total
FROM robos
WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY tipo, establecimiento;

CREATE OR REPLACE VIEW v_ventas_semana_actual AS
SELECT 
    v.banda_id,
    vp.producto_id,
    SUM(vp.cantidad) as total_vendido,
    SUM(v.precio_total) as ingresos_totales,
    COUNT(DISTINCT v.id) as numero_ventas
FROM ventas v
JOIN venta_productos vp ON v.id = vp.venta_id
WHERE v.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY v.banda_id, vp.producto_id;

-- ✅ ACTUALIZADA: Usa participantes_robos
CREATE OR REPLACE VIEW v_top_ladrones AS
SELECT 
    pr.usuario_id,
    COUNT(*) as total_robos,
    SUM(CASE WHEN r.exito = 1 THEN 1 ELSE 0 END) as robos_exitosos,
    ROUND(SUM(CASE WHEN r.exito = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_exito
FROM participantes_robos pr
JOIN robos r ON pr.robo_id = r.id
WHERE r.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY pr.usuario_id
ORDER BY total_robos DESC
LIMIT 10;