-- Datos de demostracion para desarrollo local. No ejecutar en produccion.
-- Aplicar despues de db/DataBase(1).sql.
-- Reejecutar actualiza unicamente los registros con estos identificadores.

START TRANSACTION;

INSERT INTO usuario (id_usuario, tipo, nombre_completo, telefono, correo)
VALUES
    ('00000000-0000-4000-8000-000000000101', 'CLIENTE', 'Ana Garcia', '5551000101', 'ana.garcia@example.test'),
    ('00000000-0000-4000-8000-000000000102', 'CLIENTE', 'Luis Torres', '5551000102', 'luis.torres@example.test'),
    ('00000000-0000-4000-8000-000000000103', 'CLIENTE', 'Sofia Ruiz', '5551000103', 'sofia.ruiz@example.test')
ON DUPLICATE KEY UPDATE
    tipo = VALUES(tipo),
    nombre_completo = VALUES(nombre_completo),
    telefono = VALUES(telefono),
    correo = VALUES(correo);

INSERT INTO cliente (id_usuario, tipo, documento_identidad)
VALUES
    ('00000000-0000-4000-8000-000000000101', 'CLIENTE', 'DEMO-CLIENTE-101'),
    ('00000000-0000-4000-8000-000000000102', 'CLIENTE', 'DEMO-CLIENTE-102'),
    ('00000000-0000-4000-8000-000000000103', 'CLIENTE', 'DEMO-CLIENTE-103')
ON DUPLICATE KEY UPDATE
    tipo = VALUES(tipo),
    documento_identidad = VALUES(documento_identidad);

INSERT INTO vehiculo (placa, id_cliente, marca, modelo, tipo, anio, color)
VALUES
    ('DEMO001', '00000000-0000-4000-8000-000000000101', 'Toyota', 'Corolla', 'GENERAL', 2021, 'Blanco'),
    ('DEMO002', '00000000-0000-4000-8000-000000000102', 'Nissan', 'Frontier', 'PESADO', 2020, 'Gris'),
    ('DEMO003', '00000000-0000-4000-8000-000000000103', 'Honda', 'Civic', 'GENERAL', 2019, 'Azul')
ON DUPLICATE KEY UPDATE
    id_cliente = VALUES(id_cliente),
    marca = VALUES(marca),
    modelo = VALUES(modelo),
    tipo = VALUES(tipo),
    anio = VALUES(anio),
    color = VALUES(color);

INSERT INTO configuracion_agenda
    (dia_semana, hora_apertura, hora_cierre, duracion_bloque_min, activo)
VALUES
    (0, '00:00:00', '00:01:00', 30, FALSE),
    (1, '08:00:00', '17:00:00', 30, TRUE),
    (2, '08:00:00', '17:00:00', 30, TRUE),
    (3, '08:00:00', '17:00:00', 30, TRUE),
    (4, '08:00:00', '17:00:00', 30, TRUE),
    (5, '08:00:00', '17:00:00', 30, TRUE),
    (6, '09:00:00', '13:00:00', 30, TRUE)
ON DUPLICATE KEY UPDATE
    hora_apertura = VALUES(hora_apertura),
    hora_cierre = VALUES(hora_cierre),
    duracion_bloque_min = VALUES(duracion_bloque_min),
    activo = VALUES(activo);

INSERT INTO cita
    (id_cita, placa, inicio, fin, estado, origen, creada_por, notas)
VALUES
    (
        '00000000-0000-4000-8000-000000000201',
        'DEMO001',
        TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:00:00'),
        TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '10:00:00'),
        'PENDIENTE', 'WEB', NULL, 'Revision general de demostracion'
    ),
    (
        '00000000-0000-4000-8000-000000000202',
        'DEMO002',
        TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '11:00:00'),
        TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '12:30:00'),
        'PENDIENTE', 'WEB', NULL, 'Inspeccion de vehiculo pesado'
    ),
    (
        '00000000-0000-4000-8000-000000000203',
        'DEMO003',
        TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '14:00:00'),
        TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '15:00:00'),
        'COMPLETADA', 'WEB', NULL, 'Servicio de demostracion completado'
    )
ON DUPLICATE KEY UPDATE
    placa = VALUES(placa),
    inicio = VALUES(inicio),
    fin = VALUES(fin),
    estado = VALUES(estado),
    origen = VALUES(origen),
    creada_por = VALUES(creada_por),
    notas = VALUES(notas);

COMMIT;