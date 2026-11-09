# Sistema de reservas · Taller Bautista V6

Backend Express/MySQL y frontend React/Vite conectados mediante `/api`. Se conservan ocho tablas y se registra cliente, vehículo, cita y auditoría en una sola transacción.

## Configuración local

Requisitos: Node.js 22.12 o superior, npm y MySQL 8.0.16 o superior con InnoDB. La implementación se verificó en MySQL 8.0.46. En PowerShell, usar `npm.cmd` si la política bloquea `npm.ps1`.

1. Instalar dependencias desde la raíz:

   ```powershell
   npm.cmd --prefix src install
   npm.cmd --prefix frontend install
   ```

2. Crear una base MySQL vacía y ejecutar `db/DataBase(1).sql` en ella mediante Workbench o el cliente MySQL. El script incluye procedimientos y utiliza `DELIMITER`.
3. Crear `.env` en la raíz tomando `.env.example` como referencia; configurar conexión, `PORT`, `SESSION_SECRET` y `APP_ORIGINS`. No usar la cuenta administrativa del servidor para la aplicación desplegada.
4. Provisionar al menos un empleado con la herramienta descrita abajo. No existen cuentas ni contraseñas predeterminadas.
5. Iniciar ambos procesos en terminales distintas:

   ```powershell
   npm.cmd --prefix src start
   npm.cmd --prefix frontend run dev
   ```

6. Abrir `http://localhost:5173`. El backend usa 3000 y el proxy Vite envía `/api` a ese puerto. Para cambiar el destino, configurar `VITE_API_BACKEND_URL`; ver `frontend/.env.example`.
7. Guardar los siete días desde Administración. Días sin configuración o inactivos se consideran cerrados. Configurar duración y capacidad reales; no se presuponen cupos.

`SESSION_SECRET` debe tener al menos 32 caracteres. Puede generarse localmente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

En desarrollo, omitirla genera una clave temporal que invalida sesiones al reiniciar. En producción es obligatoria. `APP_ORIGINS` contiene orígenes permitidos separados por comas; para desarrollo usar `http://localhost:5173`.

## Provisionar empleados

La herramienta recibe JSON por entrada estándar y calcula un hash bcrypt. Roles: `SECRETARIA`, `JEFE_TALLER`, `ADMIN`, `DUENO`. Ejemplo interactivo en PowerShell, sin guardar la contraseña en un archivo:

```powershell
$employeePassword = Read-Host 'Contraseña (mínimo 8 caracteres)' -AsSecureString
$employeeInput = @{
  nombre_completo = Read-Host 'Nombre completo'
  telefono = Read-Host 'Teléfono'
  correo = Read-Host 'Correo'
  rol = Read-Host 'Rol'
  password = [System.Net.NetworkCredential]::new('', $employeePassword).Password
}
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$employeeInput | ConvertTo-Json -Compress | node src/scripts/provisionEmployee.js
$employeeInput.Clear()
Remove-Variable employeeInput, employeePassword
```

La contraseña admite hasta 72 bytes. Solo se imprime identificador, correo y rol. La herramienta no reemplaza cuentas con correo duplicado. No hay registro público de empleados.

## Migración y datos de demostración

- Para una base de la demo MySQL anterior, respaldar y aplicar `db/migrations/002_v6.sql`. No ejecutar otra vez el esquema completo sobre tablas existentes.
- La migración agrega columnas faltantes, estados, `creado_en` y rutinas. Los servicios históricos desconocidos quedan `NULL`; al editar esas citas se debe seleccionar un servicio real. Las nuevas altas siempre lo exigen.
- Revisar capacidad por día: si la columna no existía, la migración utiliza inicialmente 1. No inventa servicios ni modifica horarios de citas.
- `db/routines.v6.sql` contiene las mismas rutinas que el esquema, para actualizaciones específicas. No agrega columnas.
- `db/seed.demo.sql` es exclusivo de desarrollo/pruebas. Incluye jornada y citas con los cinco estados; no incluye credenciales. No ejecutarlo en producción.
- Para empleados de prueba, ejecutar opcionalmente `db/seed.empleados.demo.sql` después del esquema. Crea una cuenta por cada rol actual con contraseña inicial `DemoTaller2026!`; no cambia cuentas existentes. Este seed es exclusivo de desarrollo; para personal real usar la herramienta de provisión.
- El DDL MySQL puede confirmar implícitamente: el `START TRANSACTION` no vuelve reversible toda la instalación.

## API y reglas

Contrato completo: [src/openapi.json](src/openapi.json), OpenAPI 3.1. El prefijo es `/api`. No duplicarlo en las rutas del cliente.

- Públicos: salud, catálogo, jornada semanal y disponibilidad desde mañana. La disponibilidad no expone documentos, teléfonos ni citas individuales.
- Sesión: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`. Cookie firmada de ocho horas, `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El servidor también verifica vencimiento, usuario activo y rol. Logout elimina la cookie del navegador; las copias previas no se revocan individualmente antes del vencimiento.
- Las escrituras requieren `Origin` permitido y `X-CSRF-Token` obtenido de login o `/auth/me`. Enviar JSON también para `DELETE`. React conserva el token solo en memoria.
- Secretaría, Administración y Dueño administran los tres paneles. Jefe consulta tablero y edita/avanza fichas; no administra horarios, cierres, auditoría ni cancela/reactiva canceladas.
- Registro completo: `POST /citas/manuales`, con `cliente`, `vehiculo` y `cita`. El servidor asigna autor y origen interno `TELEFONO`; no acepta permisos ni autor elegidos por el navegador.
- Listado: `GET /citas?q=&fecha=&turno=&estado=&limit=25&offset=0`. Incluye `pagination.total`. KPIs y filtros se calculan en servidor. El tablero entrega 25 tarjetas por columna y permite cargar más.
- Kanban y Secretaría usan `PATCH /citas/:id/estado`. Estados: `PENDIENTE`, `EN_DIAGNOSTICO`, `EN_REPARACION`, `COMPLETADA`, `CANCELADA`. Las dos etapas intermedias se muestran como “En taller”. Completadas y canceladas liberan cupo; reactivar vuelve a validarlo.
- Se utilizan UUID, sin folios aleatorios. Las citas se cancelan, no se eliminan.
- Editar cliente/vehículo actualiza datos compartidos y registra antes/después. La placa se normaliza sin espacios/guiones y en mayúsculas. Una placa de otro cliente provoca conflicto; no se transfiere su propietario. Revisar variantes equivalentes antes de migrar datos reales.
- Cambiar placa desde una cita asocia otro vehículo del mismo cliente; no renombra las referencias históricas del vehículo anterior.
- Fechas: cadenas civiles `YYYY-MM-DD HH:MM:SS` de `America/El_Salvador`, sin convertir con `toISOString()`. La conexión SQL utiliza `-06:00` y devuelve fechas como cadenas.
- Intervalos `[inicio, fin)`: terminar a las 10:00 no ocupa una cita que comienza a las 10:00. Un cierre de fecha abarca medianoche a medianoche siguiente. Cierres/horarios que invalidan citas activas se rechazan.
- Abrir WhatsApp no crea clientes, citas, mensajes ni cupos. El personal registra la confirmación posteriormente.

Catálogo fijo: `MANTENIMIENTO_PREVENTIVO`, `DIAGNOSTICO_ESCANER`, `FRENOS_SUSPENSION`, `MECANICA_GENERAL`, `ALINEACION_BALANCEO`. No requiere otra tabla.

## Transacciones

Los servicios controlan una conexión `READ COMMITTED`. Los modelos comparten esa conexión sin confirmar operaciones intermedias. Se utiliza `sp_registrar_cita_tx` para altas y `sp_validar_intervalo_tx` para reprogramar/reactivar. Cambio y auditoría se confirman o revierten juntos.

Las escrituras bloquean configuraciones semanales afectadas en orden estable antes de validar cupo. Cambiar toda la semana bloquea los siete días. Este mecanismo serializa también fechas distintas que comparten día de semana: prioriza simplicidad para un taller.

`sp_registrar_cita` conserva un envoltorio para llamadas independientes: no ejecutarlo dentro de otra transacción. El backend utiliza `_tx`. No introducir escrituras directas alternativas de citas: omitirían el protocolo de validación y concurrencia.

## Verificación

```powershell
npm.cmd --prefix src test
npm.cmd --prefix frontend run build
```

La integración requiere una instancia MySQL de pruebas. **Recrea una base desechable cuyo nombre comienza por `bookit_v6_` y termina en `test`**. No utiliza automáticamente las credenciales de `.env`:

```powershell
$env:TEST_DB_NAME = 'bookit_v6_test'
$env:TEST_DB_HOST = '127.0.0.1'
$env:TEST_DB_PORT = '33077'
$env:TEST_DB_USER = 'root'
# Configurar TEST_DB_PASSWORD solo si esa instancia aislada lo requiere.
npm.cmd --prefix src run test:integration
```

Sin `TEST_DB_NAME` la integración se omite explícitamente. Se prueban esquema/migración, seed, login, permisos, CSRF, cupos concurrentes, rollback de maestros, estados, edición, cierres, configuración y auditoría.

Para navegador: iniciar backend y Vite contra esa base desechable. Configurar `E2E_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD` y `E2E_ALLOW_WRITES=1`; ejecutar `npm.cmd --prefix frontend run test:e2e`. La suite crea/modifica datos de prueba: no apuntarla a producción. Por defecto usa Edge instalado; `E2E_BROWSER_CHANNEL` permite elegir otro canal Playwright instalado.

### Resultados verificados

- Esquema y migración ejecutados en MySQL 8.0.46 aislado: ocho tablas, sin tocar la base del proyecto.
- Tres pruebas unitarias y doce casos de integración aprobados, incluidos cupos, cierres y configuración concurrentes.
- Flujo completo en Edge aprobado: público sin datos privados/escrituras, login, alta, edición, Kanban, recarga, semana, cierres, auditoría y logout; escritorio y móvil de 390 px.
- Instalación vacía y herramienta de provisión verificadas; Secretaría puede configurar Administración según lo acordado.
- Build de producción y validación del contrato OpenAPI 3.1 aprobados.

## Producción

Compilar el frontend y servir `frontend/dist`, con fallback a `index.html` para `/personal` y proxy `/api` al backend bajo el mismo origen HTTPS.

Configurar `NODE_ENV=production`, `SESSION_SECRET` estable y origen HTTPS exacto en `APP_ORIGINS`. Usar `TRUST_PROXY=1` solamente si existe un único proxy confiable que termina TLS. Vite no configura el proxy de producción.
