-- ============================================================
-- LOTERRA - Sistema de Gestión de Venta de Lotes de Terreno
-- Script SQL Completo
-- ============================================================

CREATE DATABASE IF NOT EXISTS loterra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE loterra;

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    documento VARCHAR(30) UNIQUE,
    tipo_documento ENUM('CC', 'CE', 'NIT', 'PASAPORTE') DEFAULT 'CC',
    rol ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    token_recuperacion VARCHAR(255),
    token_recuperacion_expira DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: etapas_proyecto
-- ============================================================
CREATE TABLE etapas_proyecto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL,
    estado ENUM('pendiente', 'activa', 'completada') DEFAULT 'pendiente',
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: lotes
-- ============================================================
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    area DECIMAL(8,2) NOT NULL COMMENT 'Área en m²',
    ubicacion VARCHAR(255) NOT NULL,
    manzana VARCHAR(10),
    numero_lote VARCHAR(10),
    valor DECIMAL(15,2) NOT NULL,
    estado ENUM('disponible', 'reservado', 'vendido') DEFAULT 'disponible',
    etapa_id INT,
    descripcion TEXT,
    coordenadas_lat DECIMAL(10,8),
    coordenadas_lng DECIMAL(11,8),
    imagen_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (etapa_id) REFERENCES etapas_proyecto(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: compras
-- ============================================================
CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_contrato VARCHAR(30) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    lote_id INT NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    valor_cuota DECIMAL(15,2) NOT NULL,
    numero_cuotas INT NOT NULL DEFAULT 1,
    cuotas_pagadas INT DEFAULT 0,
    saldo_pendiente DECIMAL(15,2) NOT NULL,
    fecha_compra DATE NOT NULL,
    fecha_inicio_pagos DATE NOT NULL,
    estado ENUM('activa', 'completada', 'cancelada') DEFAULT 'activa',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE RESTRICT
);

-- ============================================================
-- TABLA: pagos
-- ============================================================
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_comprobante VARCHAR(30) NOT NULL UNIQUE,
    compra_id INT NOT NULL,
    numero_cuota INT NOT NULL,
    valor_pagado DECIMAL(15,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago ENUM('efectivo', 'transferencia', 'cheque', 'tarjeta') NOT NULL,
    referencia_pago VARCHAR(100),
    saldo_anterior DECIMAL(15,2) NOT NULL,
    saldo_despues DECIMAL(15,2) NOT NULL,
    comprobante_pdf_url VARCHAR(500),
    correo_enviado BOOLEAN DEFAULT FALSE,
    registrado_por INT,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE RESTRICT,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: planos (modelos de planos habitacionales)
-- ============================================================
CREATE TABLE planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(80),
    area_construccion DECIMAL(8,2),
    habitaciones INT,
    banos INT,
    imagen_url VARCHAR(500),
    archivo_url VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: pqrs
-- ============================================================
CREATE TABLE pqrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_radicado VARCHAR(30) NOT NULL UNIQUE,
    usuario_id INT,
    nombre_solicitante VARCHAR(200) NOT NULL,
    email_solicitante VARCHAR(150) NOT NULL,
    telefono_solicitante VARCHAR(20),
    tipo ENUM('peticion', 'queja', 'reclamo', 'sugerencia') NOT NULL,
    asunto VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('abierta', 'en_proceso', 'cerrada') DEFAULT 'abierta',
    respuesta TEXT,
    fecha_respuesta DATETIME,
    respondido_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: sesiones (para tracking)
-- ============================================================
CREATE TABLE sesiones (
    id VARCHAR(128) PRIMARY KEY,
    usuario_id INT,
    data TEXT,
    expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Etapas del proyecto
INSERT INTO etapas_proyecto (nombre, descripcion, orden, estado) VALUES
('Lanzamiento', 'Fase inicial de presentación y preventa del proyecto al mercado.', 1, 'completada'),
('Preventa', 'Período de venta anticipada con precios especiales para primeros compradores.', 2, 'activa'),
('Construcción', 'Fase de desarrollo de infraestructura: vías, servicios públicos y zonas comunes.', 3, 'pendiente'),
('Entrega', 'Entrega formal de lotes a propietarios con escrituración.', 4, 'pendiente');

-- Usuario administrador (password: Admin123!)
INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, email_verificado) VALUES
('Administrador', 'Sistema', 'admin@loterra.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TSmJMXvnN8MHwKxnfJuGX2V3XVCO', 'admin', TRUE, TRUE);

-- Lotes de ejemplo
INSERT INTO lotes (codigo, area, ubicacion, manzana, numero_lote, valor, estado, etapa_id, descripcion) VALUES
('LOT-A01', 120.00, 'Manzana A, Lote 01 - Urbanización El Prado', 'A', '01', 45000000.00, 'disponible', 2, 'Lote esquinero con excelente vista, cerca a zonas verdes.'),
('LOT-A02', 135.50, 'Manzana A, Lote 02 - Urbanización El Prado', 'A', '02', 51000000.00, 'disponible', 2, 'Lote interior con buena iluminación natural.'),
('LOT-A03', 150.00, 'Manzana A, Lote 03 - Urbanización El Prado', 'A', '03', 56000000.00, 'reservado', 2, 'Lote amplio con frente a vía principal.'),
('LOT-B01', 100.00, 'Manzana B, Lote 01 - Urbanización El Prado', 'B', '01', 38000000.00, 'disponible', 2, 'Lote compacto ideal para familia pequeña.'),
('LOT-B02', 175.00, 'Manzana B, Lote 02 - Urbanización El Prado', 'B', '02', 65000000.00, 'disponible', 2, 'Lote premium con vista panorámica.'),
('LOT-B03', 160.00, 'Manzana B, Lote 03 - Urbanización El Prado', 'B', '03', 60000000.00, 'vendido', 2, 'Lote vendido - referencia de ubicación.'),
('LOT-C01', 200.00, 'Manzana C, Lote 01 - Urbanización El Prado', 'C', '01', 75000000.00, 'disponible', 2, 'Lote más grande disponible, esquinero con doble frente.'),
('LOT-C02', 145.00, 'Manzana C, Lote 02 - Urbanización El Prado', 'C', '02', 54000000.00, 'disponible', 2, 'Lote regular con servicios públicos listos.');

-- Planos habitacionales
INSERT INTO planos (nombre, descripcion, tipo, area_construccion, habitaciones, banos) VALUES
('Casa Tipo A - Familiar', 'Diseño moderno para familia de 4 personas. Incluye sala, comedor, cocina integral y patio.', 'Unifamiliar', 85.00, 3, 2),
('Casa Tipo B - Compacta', 'Diseño eficiente para pareja o familia pequeña. Óptimo aprovechamiento del espacio.', 'Unifamiliar', 60.00, 2, 1),
('Casa Tipo C - Premium', 'Diseño amplio con acabados de lujo. Incluye estudio, terraza y garaje doble.', 'Unifamiliar', 120.00, 4, 3),
('Dúplex Tipo D', 'Diseño en dos niveles ideal para inversión o familia extensa. Dos unidades independientes.', 'Dúplex', 140.00, 5, 4);

-- ============================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================
CREATE INDEX idx_lotes_estado ON lotes(estado);
CREATE INDEX idx_lotes_etapa ON lotes(etapa_id);
CREATE INDEX idx_compras_cliente ON compras(cliente_id);
CREATE INDEX idx_compras_lote ON compras(lote_id);
CREATE INDEX idx_pagos_compra ON pagos(compra_id);
CREATE INDEX idx_pqrs_estado ON pqrs(estado);
CREATE INDEX idx_pqrs_tipo ON pqrs(tipo);
CREATE INDEX idx_usuarios_email ON usuarios(email);
