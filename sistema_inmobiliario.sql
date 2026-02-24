-- ============================================================
--   SCRIPT SQL – Sistema Web Inmobiliario (ADSO-19)
--   Base de Datos: MySQL 8+
--   Proyecto: Gestión de Venta de Lotes de Terreno
-- ============================================================

CREATE DATABASE IF NOT EXISTS sistema_inmobiliario
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_inmobiliario;

-- ============================================================
-- 1. ROL
-- ============================================================
CREATE TABLE ROL (
  id_rol      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_rol  ENUM('Administrador', 'Cliente') NOT NULL
);

-- ============================================================
-- 2. USUARIO
-- ============================================================
CREATE TABLE USUARIO (
  id_usuario      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL,
  apellido        VARCHAR(100)  NOT NULL,
  correo          VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  telefono        VARCHAR(20),
  fecha_registro  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado          ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  id_rol          INT UNSIGNED  NOT NULL,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES ROL (id_rol)
);

-- ============================================================
-- 3. PROYECTO
-- ============================================================
CREATE TABLE PROYECTO (
  id_proyecto  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(200) NOT NULL,
  descripcion  TEXT,
  ubicacion    VARCHAR(255),
  fecha_inicio DATE,
  fecha_fin    DATE
);

-- ============================================================
-- 4. ETAPA
-- ============================================================
CREATE TABLE ETAPA (
  id_etapa     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_etapa ENUM('Lanzamiento', 'Preventa', 'Construcción', 'Entrega') NOT NULL,
  descripcion  TEXT,
  id_proyecto  INT UNSIGNED NOT NULL,
  CONSTRAINT fk_etapa_proyecto FOREIGN KEY (id_proyecto) REFERENCES PROYECTO (id_proyecto)
);

-- ============================================================
-- 5. LOTE
-- ============================================================
CREATE TABLE LOTE (
  id_lote   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area_m2   DECIMAL(8,2)   NOT NULL COMMENT 'Área en metros cuadrados (100–200 m²)',
  ubicacion VARCHAR(255)   NOT NULL,
  valor     DECIMAL(14,2)  NOT NULL,
  estado    ENUM('Disponible', 'Reservado', 'Vendido') NOT NULL DEFAULT 'Disponible',
  id_etapa  INT UNSIGNED   NOT NULL,
  CONSTRAINT fk_lote_etapa FOREIGN KEY (id_etapa) REFERENCES ETAPA (id_etapa)
);

-- ============================================================
-- 6. COMPRA
-- ============================================================
CREATE TABLE COMPRA (
  id_compra       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha_compra    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_compra    DECIMAL(14,2) NOT NULL,
  saldo_pendiente DECIMAL(14,2) NOT NULL,
  estado          ENUM('Activa', 'Finalizada') NOT NULL DEFAULT 'Activa',
  id_usuario      INT UNSIGNED  NOT NULL,
  CONSTRAINT fk_compra_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
);

-- ============================================================
-- 7. DETALLE_COMPRA  (tabla intermedia N:M entre COMPRA y LOTE)
-- ============================================================
CREATE TABLE DETALLE_COMPRA (
  id_detalle  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_compra   INT UNSIGNED  NOT NULL,
  id_lote     INT UNSIGNED  NOT NULL,
  precio_lote DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_detalle_compra FOREIGN KEY (id_compra) REFERENCES COMPRA (id_compra),
  CONSTRAINT fk_detalle_lote   FOREIGN KEY (id_lote)   REFERENCES LOTE   (id_lote),
  CONSTRAINT uq_lote_compra    UNIQUE (id_lote)  -- Un lote solo puede estar en una compra activa
);

-- ============================================================
-- 8. PAGO
-- ============================================================
CREATE TABLE PAGO (
  id_pago      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha_pago   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_pagado DECIMAL(14,2) NOT NULL,
  numero_cuota INT UNSIGNED  NOT NULL,
  saldo_restante DECIMAL(14,2) NOT NULL,
  id_compra    INT UNSIGNED  NOT NULL,
  id_usuario   INT UNSIGNED  NOT NULL,
  CONSTRAINT fk_pago_compra  FOREIGN KEY (id_compra)  REFERENCES COMPRA  (id_compra),
  CONSTRAINT fk_pago_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
);

-- ============================================================
-- 9. COMPROBANTE_PAGO  (relación 1:1 con PAGO)
-- ============================================================
CREATE TABLE COMPROBANTE_PAGO (
  id_comprobante INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pago        INT UNSIGNED NOT NULL UNIQUE,  -- 1:1
  ruta_archivo   VARCHAR(500) NOT NULL COMMENT 'Ruta del archivo PDF adjunto',
  fecha_envio    DATETIME,
  estado_envio   ENUM('Pendiente', 'Enviado', 'Error') NOT NULL DEFAULT 'Pendiente',
  CONSTRAINT fk_comprobante_pago FOREIGN KEY (id_pago) REFERENCES PAGO (id_pago)
);

-- ============================================================
-- 10. ESTADO_PQRS
-- ============================================================
CREATE TABLE ESTADO_PQRS (
  id_estado_pqrs INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_estado  ENUM('Pendiente', 'En Proceso', 'Resuelto') NOT NULL
);

-- ============================================================
-- 11. PQRS
-- ============================================================
CREATE TABLE PQRS (
  id_pqrs         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo            ENUM('Petición', 'Queja', 'Reclamo', 'Sugerencia') NOT NULL,
  asunto          VARCHAR(255) NOT NULL,
  descripcion     TEXT         NOT NULL,
  fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_estado_pqrs  INT UNSIGNED NOT NULL,
  id_usuario      INT UNSIGNED NOT NULL,
  CONSTRAINT fk_pqrs_estado  FOREIGN KEY (id_estado_pqrs) REFERENCES ESTADO_PQRS (id_estado_pqrs),
  CONSTRAINT fk_pqrs_usuario FOREIGN KEY (id_usuario)     REFERENCES USUARIO      (id_usuario)
);

-- ============================================================
-- DATOS SEMILLA (seed data)
-- ============================================================

-- Roles
INSERT INTO ROL (nombre_rol) VALUES ('Administrador'), ('Cliente');

-- Estados PQRS
INSERT INTO ESTADO_PQRS (nombre_estado) VALUES ('Pendiente'), ('En Proceso'), ('Resuelto');

-- Proyecto de ejemplo
INSERT INTO PROYECTO (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin)
VALUES (
  'Urbanización Las Palmas',
  'Proyecto habitacional con lotes desde 100 hasta 200 m².',
  'Calle 45 #22-10, Bogotá',
  '2025-01-01',
  '2026-12-31'
);

-- Etapas del proyecto
INSERT INTO ETAPA (nombre_etapa, descripcion, id_proyecto) VALUES
  ('Lanzamiento',   'Presentación oficial del proyecto al público.',    1),
  ('Preventa',      'Venta anticipada con precio preferencial.',         1),
  ('Construcción',  'Desarrollo de obras civiles e infraestructura.',   1),
  ('Entrega',       'Entrega formal de lotes a los propietarios.',       1);

-- Usuario administrador por defecto
--   password: Admin2025! (hash bcrypt de ejemplo — reemplazar en producción)
INSERT INTO USUARIO (nombre, apellido, correo, password_hash, telefono, id_rol)
VALUES (
  'Admin', 'Sistema',
  'admin@inmobiliaria.com',
  '$2b$12$ExampleHashMustBeReplacedInProduction000000000000000',
  '3001234567',
  1
);

-- ============================================================
-- ÍNDICES ADICIONALES (mejora de rendimiento en consultas frecuentes)
-- ============================================================
CREATE INDEX idx_usuario_correo   ON USUARIO        (correo);
CREATE INDEX idx_lote_estado      ON LOTE            (estado);
CREATE INDEX idx_compra_usuario   ON COMPRA          (id_usuario);
CREATE INDEX idx_pago_compra      ON PAGO            (id_compra);
CREATE INDEX idx_pqrs_usuario     ON PQRS            (id_usuario);
CREATE INDEX idx_pqrs_estado      ON PQRS            (id_estado_pqrs);
CREATE INDEX idx_detalle_compra   ON DETALLE_COMPRA  (id_compra);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
