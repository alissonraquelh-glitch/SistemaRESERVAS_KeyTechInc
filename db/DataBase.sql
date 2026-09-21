-- =====================================================================
-- BookIt · Migración 001 · Esquema inicial (PostgreSQL 14+)
-- Ubicación sugerida: db/migrations/001_esquema_inicial.sql
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------
CREATE TYPE tipo_usuario   AS ENUM ('CLIENTE', 'EMPLEADO');
CREATE TYPE rol_empleado   AS ENUM ('SECRETARIA', 'JEFE_TALLER', 'DUENO', 'ADMIN');
CREATE TYPE tipo_vehiculo AS ENUM ('GENERAL', 'PESADO');
CREATE TYPE estado_cita   AS ENUM ('PENDIENTE', 'COMPLETADA', 'CANCELADA');
CREATE TYPE origen_cita   AS ENUM ('WEB', 'TELEFONO');
CREATE TYPE tipo_bloqueo  AS ENUM ('MANTENIMIENTO', 'FESTIVO', 'OTRO');

-- ---------------------------------------------------------------------
-- 2. Usuario (superclase abstracta) + Cliente / Empleado
--    Herencia por "tabla por subclase". La FK compuesta (id_usuario, tipo)
--    garantiza que un usuario sea Cliente O Empleado, nunca ambos.
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo             tipo_usuario NOT NULL,
    nombre_completo  VARCHAR(150) NOT NULL,
    telefono         VARCHAR(20)  NOT NULL,
    correo           VARCHAR(254),          -- opcional para clientes; el service lo exige a empleados
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,   -- baja lógica
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (id_usuario, tipo),
    CONSTRAINT ck_usuario_nombre CHECK (length(btrim(nombre_completo)) > 0)
);
CREATE UNIQUE INDEX ux_usuario_correo ON usuario (lower(correo)) WHERE correo IS NOT NULL;

CREATE TABLE cliente (
    id_usuario           UUID         PRIMARY KEY,
    tipo                 tipo_usuario NOT NULL DEFAULT 'CLIENTE'
                         CONSTRAINT ck_cliente_tipo CHECK (tipo = 'CLIENTE'),
    documento_identidad  VARCHAR(20)  NOT NULL UNIQUE,     -- DUI / NIT
    fecha_registro       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    FOREIGN KEY (id_usuario, tipo) REFERENCES usuario (id_usuario, tipo) ON DELETE CASCADE
);

CREATE TABLE empleado (
    id_usuario       UUID          PRIMARY KEY,
    tipo             tipo_usuario  NOT NULL DEFAULT 'EMPLEADO'
                     CONSTRAINT ck_empleado_tipo CHECK (tipo = 'EMPLEADO'),
    contrasena_hash  VARCHAR(255)  NOT NULL,
    rol              rol_empleado  NOT NULL,
    FOREIGN KEY (id_usuario, tipo) REFERENCES usuario (id_usuario, tipo) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. Vehículo (PK natural: placa)
--    marca/modelo/anio/color son NULLables porque el formulario público
--    (RF-02) solo captura placa; la secretaria puede completarlos luego.
-- ---------------------------------------------------------------------
CREATE TABLE vehiculo (
    placa       VARCHAR(12)   PRIMARY KEY,
    id_cliente  UUID          NOT NULL REFERENCES cliente (id_usuario) ON DELETE RESTRICT,
    marca       VARCHAR(50),
    modelo      VARCHAR(50),
    tipo        tipo_vehiculo NOT NULL DEFAULT 'GENERAL',
    anio        SMALLINT      CHECK (anio BETWEEN 1900 AND 2100),
    color       VARCHAR(30),
    CONSTRAINT ck_vehiculo_placa CHECK (placa = upper(placa))
);
CREATE INDEX ix_vehiculo_cliente ON vehiculo (id_cliente);

-- ---------------------------------------------------------------------
-- 4. Configuración de agenda
--    configuracion_agenda: horario base por día de la semana.
--    bloqueo_agenda: cierres puntuales (mantenimiento, festivos).
-- ---------------------------------------------------------------------
CREATE TABLE configuracion_agenda (
    id_configuracion     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dia_semana           SMALLINT NOT NULL UNIQUE CHECK (dia_semana BETWEEN 0 AND 6),  -- 0 = domingo
    hora_apertura        TIME     NOT NULL,
    hora_cierre          TIME     NOT NULL,
    duracion_bloque_min  SMALLINT NOT NULL CHECK (duracion_bloque_min > 0),
    activo               BOOLEAN  NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_config_horas CHECK (hora_cierre > hora_apertura)
);

CREATE TABLE bloqueo_agenda (
    id_bloqueo  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    inicio      TIMESTAMPTZ  NOT NULL,
    fin         TIMESTAMPTZ  NOT NULL,
    tipo        tipo_bloqueo NOT NULL,
    motivo      VARCHAR(200),
    creado_por  UUID         NOT NULL REFERENCES empleado (id_usuario),
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_bloqueo_rango CHECK (fin > inicio)
);
CREATE INDEX ix_bloqueo_rango ON bloqueo_agenda (inicio, fin);

-- ---------------------------------------------------------------------
-- 5. Cita (clase asociativa)
--    El cliente NO se guarda aquí: se obtiene vía placa -> vehiculo (3NF).
--    La restricción EXCLUDE impide traslapes de horario a nivel de BD:
--    es la garantía final contra dobles reservas (error SQLSTATE 23P01).
--    Las citas CANCELADAS liberan el bloque.
-- ---------------------------------------------------------------------
CREATE TABLE cita (
    id_cita     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    placa       VARCHAR(12)  NOT NULL REFERENCES vehiculo (placa)
                             ON UPDATE CASCADE ON DELETE RESTRICT,
    inicio      TIMESTAMPTZ  NOT NULL,
    fin         TIMESTAMPTZ  NOT NULL,
    estado      estado_cita  NOT NULL DEFAULT 'PENDIENTE',
    origen      origen_cita  NOT NULL DEFAULT 'WEB',
    creada_por  UUID         REFERENCES empleado (id_usuario),   -- NULL = portal público
    notas       TEXT,
    creada_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_cita_rango  CHECK (fin > inicio),
    CONSTRAINT ck_cita_origen CHECK (
        (origen = 'WEB'      AND creada_por IS NULL) OR
        (origen = 'TELEFONO' AND creada_por IS NOT NULL)
    ),
    CONSTRAINT ex_cita_sin_traslape
        EXCLUDE USING gist (tstzrange(inicio, fin) WITH &&)
        WHERE (estado <> 'CANCELADA')
);
CREATE INDEX ix_cita_placa  ON cita (placa);
CREATE INDEX ix_cita_inicio ON cita (inicio, estado);

-- ---------------------------------------------------------------------
-- 6. Auditoría inmutable (solo inserción)
-- ---------------------------------------------------------------------
CREATE TABLE log_auditoria (
    id_log       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocurrio_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_empleado  UUID        NOT NULL REFERENCES empleado (id_usuario),
    accion       VARCHAR(50) NOT NULL,     -- p. ej. CREAR_CITA, EDITAR_CITA, BLOQUEAR_AGENDA
    entidad      VARCHAR(50) NOT NULL,     -- p. ej. cita, bloqueo_agenda
    id_entidad   VARCHAR(64) NOT NULL,
    detalle      JSONB
);
CREATE INDEX ix_log_fecha ON log_auditoria (ocurrio_en);

CREATE FUNCTION fn_log_inmutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'log_auditoria es de solo inserción';
END;
$$;

CREATE TRIGGER tg_log_no_update_delete
    BEFORE UPDATE OR DELETE ON log_auditoria
    FOR EACH ROW EXECUTE FUNCTION fn_log_inmutable();

CREATE TRIGGER tg_log_no_truncate
    BEFORE TRUNCATE ON log_auditoria
    FOR EACH STATEMENT EXECUTE FUNCTION fn_log_inmutable();

COMMIT;