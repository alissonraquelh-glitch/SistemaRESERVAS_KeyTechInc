-- Empleados de demostración para MySQL 8.0+.
-- Ejecutar DESPUÉS del esquema, con la base del proyecto seleccionada.
-- Solo desarrollo/pruebas. No ejecutar en producción.
--
-- Cuentas nuevas (todas con contraseña inicial: DemoTaller2026!):
-- secretaria@taller.example.test -> SECRETARIA
-- jefe@taller.example.test       -> JEFE_TALLER
-- admin@taller.example.test      -> ADMIN
-- dueno@taller.example.test      -> DUENO
--
-- El hash es bcrypt con costo 12, compatible con el login del backend.
-- No usar SHA2(), MD5() ni texto plano en contrasena_hash.
-- Al repetir el script NO se cambian contraseñas, roles ni datos existentes.
-- Si un correo/UUID ya pertenece a otra cuenta, no se reemplaza esa cuenta.

SET @demo_password_hash = '$2b$12$bQwkE7q.sk3Lm7HGIQh16ON8hdkclHFc9Cy5i4Z3XfBzUEcjVy8eO';

START TRANSACTION;

-- Primero se crean los datos generales; ambas tablas comparten id_usuario.
INSERT INTO usuario
    (id_usuario, tipo, nombre_completo, telefono, correo, activo)
VALUES
    ('00000000-0000-4000-8000-000000000301', 'EMPLEADO', 'Secretaría Demo', '7000-0301', 'secretaria@taller.example.test', TRUE),
    ('00000000-0000-4000-8000-000000000302', 'EMPLEADO', 'Jefe de Taller Demo', '7000-0302', 'jefe@taller.example.test', TRUE),
    ('00000000-0000-4000-8000-000000000303', 'EMPLEADO', 'Administrador Demo', '7000-0303', 'admin@taller.example.test', TRUE),
    ('00000000-0000-4000-8000-000000000304', 'EMPLEADO', 'Dueño Demo', '7000-0304', 'dueno@taller.example.test', TRUE)
ON DUPLICATE KEY UPDATE
    id_usuario = usuario.id_usuario;

-- Luego se crean sus datos de empleado, solo cuando coinciden UUID, correo
-- y tipo. Así una colisión no convierte un cliente u otra cuenta en empleado.
INSERT INTO empleado (id_usuario, tipo, contrasena_hash, rol)
SELECT u.id_usuario, 'EMPLEADO', @demo_password_hash, semilla.rol
FROM usuario u
JOIN (
    SELECT '00000000-0000-4000-8000-000000000301' AS id_usuario,
           'secretaria@taller.example.test' AS correo, 'SECRETARIA' AS rol
    UNION ALL
    SELECT '00000000-0000-4000-8000-000000000302',
           'jefe@taller.example.test', 'JEFE_TALLER'
    UNION ALL
    SELECT '00000000-0000-4000-8000-000000000303',
           'admin@taller.example.test', 'ADMIN'
    UNION ALL
    SELECT '00000000-0000-4000-8000-000000000304',
           'dueno@taller.example.test', 'DUENO'
) AS semilla ON semilla.id_usuario = u.id_usuario AND semilla.correo = u.correo
WHERE u.tipo = 'EMPLEADO'
ON DUPLICATE KEY UPDATE
    id_usuario = empleado.id_usuario;

COMMIT;
SET @demo_password_hash = NULL;

-- Resultado: verificar que aparecen las cuentas esperadas y activo = 1.
-- Si hubo conflictos de identificador/correo, revisar los registros existentes.
SELECT u.id_usuario, u.nombre_completo, u.correo, e.rol, u.activo
FROM usuario u
JOIN empleado e ON e.id_usuario = u.id_usuario
WHERE u.id_usuario IN (
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000303',
    '00000000-0000-4000-8000-000000000304'
)
AND u.correo IN (
    'secretaria@taller.example.test',
    'jefe@taller.example.test',
    'admin@taller.example.test',
    'dueno@taller.example.test'
)
ORDER BY u.correo;
