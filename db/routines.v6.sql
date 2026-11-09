-- Rutinas V6 MySQL 8.0.16+. Instalar con un cliente que soporte DELIMITER.
-- *_tx participa en la transacción del llamador; no confirma ni revierte cambios.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_registrar_cita$$
DROP PROCEDURE IF EXISTS sp_registrar_cita_tx$$
DROP PROCEDURE IF EXISTS sp_validar_intervalo_tx$$
CREATE PROCEDURE sp_validar_intervalo_tx(IN p_inicio DATETIME, IN p_fin DATETIME, IN p_excluir VARCHAR(36))
BEGIN
  DECLARE v_activo BOOLEAN DEFAULT NULL;
  DECLARE v_apertura TIME;
  DECLARE v_cierre TIME;
  DECLARE v_capacidad SMALLINT;
  DECLARE v_bloqueos INT DEFAULT 0;
  DECLARE v_ocupacion INT DEFAULT 0;
  IF p_inicio IS NULL OR p_fin IS NULL OR p_fin <= p_inicio OR DATE(p_inicio) <> DATE(p_fin) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30001, MESSAGE_TEXT='El intervalo debe ser válido y estar en un solo día.';
  END IF;
  SELECT activo, hora_apertura, hora_cierre, capacidad_maxima
    INTO v_activo, v_apertura, v_cierre, v_capacidad
    FROM configuracion_agenda WHERE dia_semana=DAYOFWEEK(p_inicio)-1 FOR UPDATE;
  IF v_activo IS NULL OR v_activo=FALSE THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30003, MESSAGE_TEXT='El taller está cerrado o no tiene configuración.';
  END IF;
  IF TIME(p_inicio)<v_apertura OR TIME(p_fin)>v_cierre THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30001, MESSAGE_TEXT='La cita está fuera del horario de atención.';
  END IF;
  SELECT COUNT(*) INTO v_bloqueos FROM bloqueo_agenda WHERE inicio<p_fin AND fin>p_inicio;
  IF v_bloqueos>0 THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30003, MESSAGE_TEXT='El horario solicitado está bloqueado.';
  END IF;
  SELECT COALESCE(MAX(puntos.ocupacion),0) INTO v_ocupacion FROM (
    SELECT instantes.instante,
      (SELECT COUNT(*) FROM cita ocupada
       WHERE ocupada.estado IN ('PENDIENTE','EN_DIAGNOSTICO','EN_REPARACION')
       AND (p_excluir IS NULL OR ocupada.id_cita<>p_excluir)
       AND ocupada.inicio<=instantes.instante AND ocupada.fin>instantes.instante) AS ocupacion
    FROM (
      SELECT p_inicio AS instante UNION
      SELECT existente.inicio FROM cita existente
       WHERE existente.estado IN ('PENDIENTE','EN_DIAGNOSTICO','EN_REPARACION')
       AND (p_excluir IS NULL OR existente.id_cita<>p_excluir)
       AND existente.inicio>p_inicio AND existente.inicio<p_fin
    ) AS instantes
  ) AS puntos;
  IF v_ocupacion>=v_capacidad THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30002, MESSAGE_TEXT='No hay capacidad disponible para ese intervalo.';
  END IF;
END$$

CREATE PROCEDURE sp_registrar_cita_tx(
  IN p_id_cita VARCHAR(36), IN p_placa VARCHAR(12), IN p_inicio DATETIME,
  IN p_fin DATETIME, IN p_origen VARCHAR(20), IN p_creada_por VARCHAR(36),
  IN p_servicio_codigo VARCHAR(50), IN p_notas TEXT
)
BEGIN
  DECLARE v_id VARCHAR(36);
  IF p_placa IS NULL OR p_servicio_codigo IS NULL OR CHAR_LENGTH(TRIM(p_servicio_codigo))=0 THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30001, MESSAGE_TEXT='Vehículo y servicio son obligatorios.';
  END IF;
  IF p_origen IS NULL OR p_origen NOT IN ('WEB','TELEFONO')
    OR (p_origen='WEB' AND p_creada_por IS NOT NULL)
    OR (p_origen='TELEFONO' AND p_creada_por IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO=30001, MESSAGE_TEXT='Origen y empleado no son consistentes.';
  END IF;
  CALL sp_validar_intervalo_tx(p_inicio,p_fin,NULL);
  SET v_id=COALESCE(NULLIF(p_id_cita,''),UUID());
  INSERT INTO cita(id_cita,placa,inicio,fin,estado,origen,creada_por,servicio_codigo,notas)
    VALUES(v_id,p_placa,p_inicio,p_fin,'PENDIENTE',p_origen,p_creada_por,p_servicio_codigo,p_notas);
  SELECT v_id AS id_cita;
END$$

-- Solo para llamadas independientes, fuera de otra transacción.
CREATE PROCEDURE sp_registrar_cita(
  IN p_id_cita VARCHAR(36), IN p_placa VARCHAR(12), IN p_inicio DATETIME,
  IN p_fin DATETIME, IN p_origen VARCHAR(20), IN p_creada_por VARCHAR(36),
  IN p_servicio_codigo VARCHAR(50), IN p_notas TEXT
)
BEGIN
  DECLARE v_id VARCHAR(36);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
  START TRANSACTION;
  SET v_id=COALESCE(NULLIF(p_id_cita,''),UUID());
  CALL sp_registrar_cita_tx(v_id,p_placa,p_inicio,p_fin,p_origen,p_creada_por,p_servicio_codigo,p_notas);
  IF p_creada_por IS NOT NULL THEN
    INSERT INTO log_auditoria(id_empleado,accion,entidad,id_entidad,detalle)
      VALUES(p_creada_por,'CREAR_CITA','cita',v_id,JSON_OBJECT('placa',p_placa,'inicio',p_inicio,'fin',p_fin));
  END IF;
  COMMIT;
END$$
DELIMITER ;
