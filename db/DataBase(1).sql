-- =====================================================================
-- BookIt · Migración / Esquema V6 (MySQL 8.0+)
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
-- 3. Configuración de agenda (Incluye capacidad_maxima para V6)
-- ---------------------------------------------------------------------
CREATE TABLE configuracion_agenda (
    id_configuracion     SMALLINT AUTO_INCREMENT PRIMARY KEY,
    dia_semana           SMALLINT NOT NULL,
    hora_apertura        TIME     NOT NULL,
    hora_cierre          TIME     NOT NULL,
    duracion_bloque_min  SMALLINT NOT NULL,
    capacidad_maxima     SMALLINT NOT NULL DEFAULT 1,
    activo               BOOLEAN  NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_config_dia (dia_semana),
    CONSTRAINT ck_config_dia CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT ck_config_duracion CHECK (duracion_bloque_min > 0),
    CONSTRAINT ck_config_horas CHECK (hora_cierre > hora_apertura),
    CONSTRAINT ck_config_capacidad CHECK (capacidad_maxima BETWEEN 1 AND 15)
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
-- 4. Cita (Incluye servicio_codigo para V6)
-- ---------------------------------------------------------------------
CREATE TABLE cita (
    id_cita         VARCHAR(36) NOT NULL DEFAULT (UUID()),
    placa           VARCHAR(12) NOT NULL,
    inicio          DATETIME    NOT NULL,
    fin             DATETIME    NOT NULL,
    estado          ENUM('PENDIENTE', 'EN_DIAGNOSTICO', 'EN_REPARACION', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    origen          ENUM('WEB', 'TELEFONO') NOT NULL DEFAULT 'WEB',
    creada_por      VARCHAR(36) DEFAULT NULL,
    servicio_codigo VARCHAR(50) NOT NULL,
    notas           TEXT        DEFAULT NULL,
    creado_en       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- ---------------------------------------------------------------------
-- 6. Registro transaccional de citas con control de capacidad
-- Todas las altas de citas deben usar este procedimiento; un INSERT directo
-- evita la validación de horario/capacidad y su protección ante concurrencia.
-- Ejemplo: CALL sp_registrar_cita(NULL, 'ABC123', '2026-11-10 09:00:00',
--          '2026-11-10 10:00:00', 'WEB', NULL, 'MECANICA_GENERAL', NULL);
-- El procedimiento administra su propia transacción; no llamarlo dentro de otra.
-- ---------------------------------------------------------------------
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_registrar_cita$$

CREATE PROCEDURE sp_registrar_cita(
    IN p_id_cita         VARCHAR(36),
    IN p_placa           VARCHAR(12),
    IN p_inicio          DATETIME,
    IN p_fin             DATETIME,
    IN p_origen          VARCHAR(20),
    IN p_creada_por      VARCHAR(36),
    IN p_servicio_codigo VARCHAR(50),
    IN p_notas           TEXT
)
proc: BEGIN
    DECLARE v_id_cita          VARCHAR(36);
    DECLARE v_activo           BOOLEAN DEFAULT NULL;
    DECLARE v_hora_apertura    TIME DEFAULT NULL;
    DECLARE v_hora_cierre      TIME DEFAULT NULL;
    DECLARE v_capacidad        SMALLINT DEFAULT NULL;
    DECLARE v_bloqueos         INT DEFAULT 0;
    DECLARE v_ocupacion_maxima INT DEFAULT 0;
    DECLARE v_transaccion_iniciada BOOLEAN DEFAULT FALSE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        IF v_transaccion_iniciada THEN
            ROLLBACK;
        END IF;
        RESIGNAL;
    END;

    IF @@session.in_transaction THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ejecute sp_registrar_cita fuera de una transacción activa.';
    END IF;

    IF p_placa IS NULL OR p_inicio IS NULL OR p_fin IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Vehículo e inicio/fin son obligatorios.';
    END IF;

    IF p_servicio_codigo IS NULL OR CHAR_LENGTH(TRIM(p_servicio_codigo)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El código de servicio es obligatorio.';
    END IF;

    IF p_origen IS NULL OR p_origen NOT IN ('WEB', 'TELEFONO') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El origen debe ser WEB o TELEFONO.';
    END IF;

    IF (p_origen = 'WEB' AND p_creada_por IS NOT NULL)
       OR (p_origen = 'TELEFONO' AND p_creada_por IS NULL) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El origen y el empleado creador no son consistentes.';
    END IF;

    IF p_fin <= p_inicio OR DATE(p_inicio) <> DATE(p_fin) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El intervalo de la cita debe ser válido y estar en un solo día.';
    END IF;

    SET v_id_cita = COALESCE(NULLIF(p_id_cita, ''), UUID());

    START TRANSACTION;
    SET v_transaccion_iniciada = TRUE;

    -- Esta fila actúa como candado por día de semana: serializa todas las
    -- reservas que usan la misma configuración mientras se calcula capacidad.
    SELECT activo, hora_apertura, hora_cierre, capacidad_maxima
      INTO v_activo, v_hora_apertura, v_hora_cierre, v_capacidad
      FROM configuracion_agenda
     WHERE dia_semana = DAYOFWEEK(p_inicio) - 1
     FOR UPDATE;

    IF v_activo IS NULL OR v_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El taller está cerrado o no tiene configuración para ese día.';
    END IF;

    IF TIME(p_inicio) < v_hora_apertura OR TIME(p_fin) > v_hora_cierre THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cita está fuera del horario de atención.';
    END IF;

    SELECT COUNT(*)
      INTO v_bloqueos
      FROM bloqueo_agenda
     WHERE inicio < p_fin
       AND fin > p_inicio;

    IF v_bloqueos > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El horario solicitado está bloqueado.';
    END IF;

    -- Revisa la ocupación al inicio solicitado y en cada inicio de cita
    -- existente dentro del intervalo. El candado de configuración evita que
    -- dos llamadas a este procedimiento ocupen simultáneamente el último cupo.
    SELECT COALESCE(MAX(puntos.ocupacion), 0)
      INTO v_ocupacion_maxima
      FROM (
          SELECT instantes.instante,
                 (SELECT COUNT(*)
                    FROM cita ocupada
                   WHERE ocupada.estado IN ('PENDIENTE', 'EN_DIAGNOSTICO', 'EN_REPARACION')
                     AND ocupada.inicio <= instantes.instante
                     AND ocupada.fin > instantes.instante) AS ocupacion
            FROM (
                SELECT p_inicio AS instante
                UNION
                SELECT existente.inicio AS instante
                  FROM cita existente
                 WHERE existente.estado IN ('PENDIENTE', 'EN_DIAGNOSTICO', 'EN_REPARACION')
                   AND existente.inicio > p_inicio
                   AND existente.inicio < p_fin
                   AND existente.fin > p_inicio
            ) AS instantes
      ) AS puntos;

    IF v_ocupacion_maxima >= v_capacidad THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No hay capacidad disponible para ese intervalo.';
    END IF;

    INSERT INTO cita (
        id_cita, placa, inicio, fin, estado, origen, creada_por,
        servicio_codigo, notas
    ) VALUES (
        v_id_cita, p_placa, p_inicio, p_fin, 'PENDIENTE', p_origen,
        p_creada_por, p_servicio_codigo, p_notas
    );

    COMMIT;
    SET v_transaccion_iniciada = FALSE;

    SELECT v_id_cita AS id_cita;
END$$

DELIMITER ;

COMMIT;
