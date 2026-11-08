-- =====================================================================
-- BookIt · Migración 001 · Esquema inicial (MySQL 8.0+)
-- Ubicación sugerida: db/migrations/001_esquema_inicial.sql
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Usuario (superclase abstracta) + Cliente / Empleado
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario       VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    tipo             ENUM('CLIENTE', 'EMPLEADO') NOT NULL,
    nombre_completo  VARCHAR(150) NOT NULL,
    telefono         VARCHAR(20)  NOT NULL,
    correo           VARCHAR(254) DEFAULT NULL,
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuario_id_tipo (id_usuario, tipo),
    UNIQUE KEY ux_usuario_correo (correo),
    CONSTRAINT ck_usuario_nombre CHECK (CHAR_LENGTH(TRIM(nombre_completo)) > 0)
) ENGINE=InnoDB;

CREATE TABLE cliente (
    id_usuario           VARCHAR(36) NOT NULL,
    tipo                 ENUM('CLIENTE', 'EMPLEADO') NOT NULL DEFAULT 'CLIENTE',
    documento_identidad  VARCHAR(20) NOT NULL,
    fecha_registro       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_cliente_documento (documento_identidad),
    CONSTRAINT ck_cliente_tipo CHECK (tipo = 'CLIENTE'),
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario, tipo) 
        REFERENCES usuario (id_usuario, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE empleado (
    id_usuario       VARCHAR(36) NOT NULL,
    tipo             ENUM('CLIENTE', 'EMPLEADO') NOT NULL DEFAULT 'EMPLEADO',
    contrasena_hash  VARCHAR(255) NOT NULL,
    rol              ENUM('SECRETARIA', 'JEFE_TALLER', 'DUENO', 'ADMIN') NOT NULL,
    PRIMARY KEY (id_usuario),
    CONSTRAINT ck_empleado_tipo CHECK (tipo = 'EMPLEADO'),
    CONSTRAINT fk_empleado_usuario FOREIGN KEY (id_usuario, tipo) 
        REFERENCES usuario (id_usuario, tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Vehículo (PK natural: placa)
-- ---------------------------------------------------------------------
CREATE TABLE vehiculo (
    placa       VARCHAR(12)  NOT NULL,
    id_cliente  VARCHAR(36)  NOT NULL,
    marca       VARCHAR(50)  DEFAULT NULL,
    modelo      VARCHAR(50)  DEFAULT NULL,
    tipo        ENUM('GENERAL', 'PESADO') NOT NULL DEFAULT 'GENERAL',
    anio        SMALLINT     DEFAULT NULL,
    color       VARCHAR(30)  DEFAULT NULL,
    PRIMARY KEY (placa),
    KEY ix_vehiculo_cliente (id_cliente),
    CONSTRAINT ck_vehiculo_anio CHECK (anio IS NULL OR (anio BETWEEN 1900 AND 2100)),
    CONSTRAINT ck_vehiculo_placa CHECK (placa = UPPER(placa)),
    CONSTRAINT fk_vehiculo_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente (id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Configuración de agenda
-- ---------------------------------------------------------------------
CREATE TABLE configuracion_agenda (
    id_configuracion     SMALLINT AUTO_INCREMENT PRIMARY KEY,
    dia_semana           SMALLINT NOT NULL,
    hora_apertura        TIME     NOT NULL,
    hora_cierre          TIME     NOT NULL,
    duracion_bloque_min  SMALLINT NOT NULL,
    activo               BOOLEAN  NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_config_dia (dia_semana),
    CONSTRAINT ck_config_dia CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT ck_config_duracion CHECK (duracion_bloque_min > 0),
    CONSTRAINT ck_config_horas CHECK (hora_cierre > hora_apertura)
) ENGINE=InnoDB;

CREATE TABLE bloqueo_agenda (
    id_bloqueo  VARCHAR(36) NOT NULL DEFAULT (UUID()),
    inicio      DATETIME    NOT NULL,
    fin         DATETIME    NOT NULL,
    tipo        ENUM('MANTENIMIENTO', 'FESTIVO', 'OTRO') NOT NULL,
    motivo      VARCHAR(200) DEFAULT NULL,
    creado_por  VARCHAR(36) NOT NULL,
    creado_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_bloqueo),
    KEY ix_bloqueo_rango (inicio, fin),
    CONSTRAINT ck_bloqueo_rango CHECK (fin > inicio),
    CONSTRAINT fk_bloqueo_empleado FOREIGN KEY (creado_por) 
        REFERENCES empleado (id_usuario)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Cita
-- ---------------------------------------------------------------------
CREATE TABLE cita (
    id_cita     VARCHAR(36) NOT NULL DEFAULT (UUID()),
    placa       VARCHAR(12) NOT NULL,
    inicio      DATETIME    NOT NULL,
    fin         DATETIME    NOT NULL,
    estado      ENUM('PENDIENTE', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    origen      ENUM('WEB', 'TELEFONO') NOT NULL DEFAULT 'WEB',
    creada_por  VARCHAR(36) DEFAULT NULL,
    notas       TEXT        DEFAULT NULL,
    creada_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cita),
    KEY ix_cita_placa (placa),
    KEY ix_cita_inicio (inicio, estado),
    CONSTRAINT ck_cita_rango CHECK (fin > inicio),
    CONSTRAINT ck_cita_origen CHECK (
        (origen = 'WEB'      AND creada_por IS NULL) OR
        (origen = 'TELEFONO' AND creada_por IS NOT NULL)
    ),
    CONSTRAINT fk_cita_vehiculo FOREIGN KEY (placa) 
        REFERENCES vehiculo (placa) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cita_empleado FOREIGN KEY (creada_por) 
        REFERENCES empleado (id_usuario)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Auditoría inmutable (solo inserción)
-- ---------------------------------------------------------------------
CREATE TABLE log_auditoria (
    id_log       BIGINT AUTO_INCREMENT PRIMARY KEY,
    ocurrio_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_empleado  VARCHAR(36) NOT NULL,
    accion       VARCHAR(50) NOT NULL,
    entidad      VARCHAR(50) NOT NULL,
    id_entidad   VARCHAR(64) NOT NULL,
    detalle      JSON        DEFAULT NULL,
    KEY ix_log_fecha (ocurrio_en),
    CONSTRAINT fk_log_empleado FOREIGN KEY (id_empleado) 
        REFERENCES empleado (id_usuario)
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER tg_log_no_update
BEFORE UPDATE ON log_auditoria
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'log_auditoria es de solo inserción';
END$$

CREATE TRIGGER tg_log_no_delete
BEFORE DELETE ON log_auditoria
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'log_auditoria es de solo inserción';
END$$

DELIMITER ;

COMMIT;