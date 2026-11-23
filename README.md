# Sistema de reservas · Taller Bautista V7

Backend Express/MySQL y frontend React/Vite conectados mediante `/api`. Se conservan ocho tablas y se registra cliente, vehículo, cita y auditoría en una sola transacción.

## Configuración local

Requisitos: Node.js 22.12 o superior, npm y MySQL 8.0.16 o superior con InnoDB. La implementación se verificó en MySQL 8.0.46. En PowerShell, usar `npm.cmd` si la política bloquea `npm.ps1`.

1. Instalar dependencias desde la raíz:

   ```powershell
   npm.cmd --prefix src ci
   npm.cmd --prefix frontend ci
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

`npm.cmd --prefix src run dev` usa `node --watch app.js` para reiniciar automáticamente el backend con Node 22, sin nodemon.

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
- **V7.1:** respaldar y aplicar `db/migrations/003_servicio_detalle.sql` **antes** de desplegar el backend V7.1. Agrega la columna nullable `cita.servicio_detalle` solo si no existe; es idempotente y no modifica datos. Las instalaciones nuevas ya la reciben en el esquema completo.
- `db/routines.v6.sql` contiene las mismas rutinas que el esquema, para actualizaciones específicas. No agrega columnas.
- `db/seed.demo.sql` es exclusivo de desarrollo/pruebas. Incluye jornada y citas con los cinco estados; no incluye credenciales. No ejecutarlo en producción.
- Para empleados de prueba, ejecutar opcionalmente `db/seed.empleados.demo.sql` después del esquema. Crea una cuenta por cada rol actual con contraseña inicial `DemoTaller2026!`; no cambia cuentas existentes. Este seed es exclusivo de desarrollo; para personal real usar la herramienta de provisión.
- El DDL MySQL puede confirmar implícitamente: el `START TRANSACTION` no vuelve reversible toda la instalación.

## API y reglas

Contrato completo: [src/openapi.json](src/openapi.json), OpenAPI 3.1. El prefijo es `/api`. No duplicarlo en las rutas del cliente.

- Públicos: salud, catálogo, jornada semanal y disponibilidad desde mañana. La jornada omite capacidad e identificadores internos. Cada intervalo público conserva horarios, turno y motivo de cierre, pero solo publica `DISPONIBLE` o `AGOTADO`, sin conteos de capacidad, ocupación o cupos libres. Una ocupación parcial sigue siendo `DISPONIBLE`; un bloqueo es `AGOTADO`. Un día cerrado devuelve `cerrado: true` e intervalos vacíos. Los motivos de cierre son públicos: no escribir información privada en ellos.
- `GET /agenda/disponibilidad` mantiene conteos y estados detallados para personal autenticado; `/configuracion-agenda` conserva la capacidad para Secretaría, Administración y Dueño. La respuesta pública sigue siendo limitada aunque la solicitud incluya una sesión válida. Frontend y backend deben desplegarse juntos por este cambio de contrato.
- Sesión: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`. Cookie firmada de ocho horas, `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El servidor también verifica vencimiento, usuario activo y rol. Logout elimina la cookie del navegador; las copias previas no se revocan individualmente antes del vencimiento.
- Las escrituras requieren `Origin` permitido y `X-CSRF-Token` obtenido de login o `/auth/me`. Enviar JSON también para `DELETE`. React conserva el token solo en memoria.
- Secretaría, Administración y Dueño administran los tres paneles. Jefe consulta tablero y edita/avanza fichas; no administra horarios, cierres, auditoría ni cancela/reactiva canceladas.
- Registro completo: `POST /citas/manuales`, con `cliente`, `vehiculo` y `cita`. El servidor asigna autor y origen interno `TELEFONO`; no acepta permisos ni autor elegidos por el navegador.
- Listado: `GET /citas?q=&fecha=&desde=&hasta=&turno=&estado=&orden=asc&limit=25&offset=0`. `desde`/`hasta` son fechas civiles incluidas; `orden` (`asc` por defecto) ordena por inicio y desempata por `id_cita`. Incluye `pagination.total`. Secretaría abre en “Próximas citas” (desde hoy, ascendente) y ofrece Historial/Todas, “Página X de Y”, primera/última y tamaño de página.
- Taller: `GET /taller/tablero` acepta también `desde`/`hasta`. La vista del jefe abre en la fecha de hoy de El Salvador y ofrece Hoy, Últimos/Próximos 15 días, Último/Próximo mes y rango personalizado.
- Auditoría: `GET /auditoria?desde=&hasta=&accion=&entidad=&q=` limita cada consulta a 30 días (sin fechas: últimos 30). `GET /auditoria/exportar` descarga en CSV UTF-8 todos los resultados filtrados, exige `X-CSRF-Token`, omite claves sensibles, neutraliza fórmulas y registra `EXPORTAR_AUDITORIA`. Mismos roles que la consulta. KPIs y filtros se calculan en servidor. El tablero entrega 25 tarjetas por columna y permite cargar más.
- Kanban y Secretaría usan `PATCH /citas/:id/estado`. Estados: `PENDIENTE`, `EN_DIAGNOSTICO`, `EN_REPARACION`, `COMPLETADA`, `CANCELADA`. Las dos etapas intermedias se muestran como “En taller”. Completadas y canceladas liberan cupo; reactivar vuelve a validarlo.
- Se utilizan UUID, sin folios aleatorios. Las citas se cancelan, no se eliminan.
- Vehículo: solo placa y modelo son obligatorios; marca, año y color son opcionales y el tipo es `GENERAL` por defecto. Omitir un campo no borra el valor guardado de un vehículo existente.
- Editar cliente/vehículo actualiza datos compartidos y registra antes/después. La placa se normaliza sin espacios/guiones y en mayúsculas. Una placa de otro cliente provoca conflicto; no se transfiere su propietario. Revisar variantes equivalentes antes de migrar datos reales.
- Cambiar placa desde una cita asocia otro vehículo del mismo cliente; no renombra las referencias históricas del vehículo anterior.
- Fechas: cadenas civiles `YYYY-MM-DD HH:MM:SS` de `America/El_Salvador`, sin convertir con `toISOString()`. La conexión SQL utiliza `-06:00` y devuelve fechas como cadenas.
- Intervalos `[inicio, fin)`: terminar a las 10:00 no ocupa una cita que comienza a las 10:00. Un cierre de fecha abarca medianoche a medianoche siguiente. Cierres/horarios que invalidan citas activas se rechazan.
- Abrir WhatsApp no crea clientes, citas, mensajes ni cupos. El personal registra la confirmación posteriormente.

Catálogo fijo: `MANTENIMIENTO_PREVENTIVO`, `DIAGNOSTICO_ESCANER`, `FRENOS_SUSPENSION`, `MECANICA_GENERAL`, `ALINEACION_BALANCEO` y `OTROS`. `OTROS` exige `servicio_detalle` (descripción de hasta 200 caracteres); los demás lo guardan como `NULL`. No requiere otra tabla.

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

Documentación de las mejoras V7.1 (técnica, manual de usuario, presentación y rollback): carpeta [docs/](docs/).

Sin `TEST_DB_NAME` la integración se omite explícitamente. Se prueban esquema/migración, seed, login, permisos, CSRF, cupos concurrentes, rollback de maestros, estados, edición, cierres, configuración y auditoría.

Para navegador: ejecutar primero el build y luego `npm.cmd --prefix frontend run test:e2e`. La suite levanta Express local con el build de producción y una base simulada, sin cargar `.env`, credenciales ni escribir datos. Comprueba el calendario, estados disponibles/agotados, cierres, modal, navegación SPA y CSP en escritorio y móvil de 390 px. No necesita backend ni MySQL en ejecución. Por defecto usa Edge instalado; `E2E_BROWSER_CHANNEL` permite elegir otro canal Playwright instalado. Google Fonts se simula para no depender de Internet; no verifica el servicio externo ni el TLS del hosting.

Las pruebas de `npm.cmd --prefix src test` incluyen HTTP con una base simulada: privacidad pública/privada, permisos, CSRF, origen, rate limiting, vencimiento, cookies, cabeceras y solicitudes comprimidas. No sustituyen la integración con MySQL real.

Para consultar vulnerabilidades (requiere acceso al registro npm):

```powershell
npm.cmd --prefix src audit
npm.cmd --prefix src audit --omit=dev
npm.cmd --prefix frontend audit
```

El lockfile del backend actualiza `body-parser` de 2.3.0 a 2.4.0 por GHSA-27r3-jxmh-p828, incorpora Helmet 8.3.0 y retira nodemon junto con minimatch 10.2.6 (GHSA-g3hv-75wg-m249). No se utilizó `npm audit fix --force`. Usar `npm ci` en despliegue para reproducir la resolución corregida.

### Resultados de la revisión de seguridad (16 de noviembre de 2026)

- 13 pruebas unitarias/HTTP aprobadas, sin MySQL ni credenciales reales.
- Build de producción y prueba en Edge a 1440 px y 390 px aprobados con base simulada y sin violaciones CSP.
- OpenAPI parseable, referencias resueltas y contratos públicos contrastados con las respuestas HTTP.
- `npm audit` sin vulnerabilidades reportadas en backend completo, backend de producción y frontend al momento de la consulta.
- Integración MySQL omitida por ausencia de `TEST_DB_NAME`. HTTPS/certificados del hosting no verificados.

### Resultados registrados previamente

- Esquema y migración ejecutados en MySQL 8.0.46 aislado: ocho tablas, sin tocar la base del proyecto.
- Tres pruebas unitarias y doce casos de integración aprobados, incluidos cupos, cierres y configuración concurrentes.
- Flujo completo en Edge aprobado: público sin datos privados/escrituras, login, alta, edición, Kanban, recarga, semana, cierres, auditoría y logout; escritorio y móvil de 390 px.
- Instalación vacía y herramienta de provisión verificadas; Secretaría puede configurar Administración según lo acordado.
- Build de producción y validación del contrato OpenAPI 3.1 aprobados.

## Producción

El Dockerfile ya compila el frontend y configura `NODE_ENV=production`. Express sirve `frontend/dist`, el fallback a `index.html` para `/personal` y la API bajo `/api`. Publicar ambos bajo un mismo origen HTTPS mediante el alojamiento elegido; no usar Vite como servidor de producción. Este cambio no incorpora un proxy ni configura certificados.

Precondiciones:

- `NODE_ENV=production` y `SESSION_SECRET` estable de al menos 32 caracteres. No reutilizar claves de pruebas.
- `APP_ORIGINS` explícito, por ejemplo `https://reservas.example.com`; sin barra final, rutas, credenciales ni comodines. Se permiten varios orígenes HTTPS separados por comas. La aplicación rechaza al arrancar una configuración de producción ausente o inválida.
- HTTPS válido en el acceso del navegador y redirección HTTP a HTTPS en el alojamiento. La cookie mantiene `Secure`, `HttpOnly`, `SameSite=Lax`, ruta `/api` y vencimiento de ocho horas.
- `TRUST_PROXY=1` solamente si existe un único proxy confiable que termina TLS, reemplaza las cabeceras reenviadas y bloquea el acceso directo al backend. Con `0` o sin esta variable no se confía en `X-Forwarded-Proto`. No activar esta opción para topologías desconocidas o con varias rutas de acceso.

Helmet aplica cabeceras antes de rutas, parser y archivos estáticos, incluidos errores. API/salud usan CSP `default-src 'none'`; el frontend de producción permite scripts y conexiones propios, Google Fonts e imágenes propias/`data:`, sin scripts o estilos inline. No se añade CORS: se conserva la arquitectura de mismo origen y la validación de Origin/CSRF existente.

HSTS se emite solo en producción cuando Express reconoce HTTPS: `max-age=86400`, sin `includeSubDomains` ni `preload`. Desarrollo HTTP no recibe HSTS ni actualización automática de recursos a HTTPS. Si otro servidor/CDN sirve el HTML o los estáticos directamente, debe reproducir allí las cabeceras del frontend; las cabeceras de la API no protegen documentos entregados por otro servidor.

Antes de publicar, verificar en un entorno HTTPS de pruebas:

1. HTTP redirige a HTTPS y no expone directamente Express. Revisar certificado y límites de confianza del proxy.
2. `/`, `/personal`, un archivo `/assets/...` y respuestas API de éxito/error incluyen las cabeceras esperadas. HTTPS incluye HSTS; revisar que el proxy no duplique o reemplace CSP de forma incompatible.
3. Iniciar sesión con una cuenta de pruebas e inspeccionar los atributos de la cookie en DevTools, sin copiar ni registrar su valor. Recargar `/personal`, consultar `/api/auth/me`, efectuar una escritura de prueba con CSRF y cerrar sesión.
4. Una escritura sin CSRF o con Origin ajeno debe fallar. Una petición HTTP de producción no debe entregar una cookie de sesión. Comprobar vencimiento y roles con las suites y una base aislada.
5. Comprobar fuentes, iconos, imágenes, modal de WhatsApp y ausencia de errores CSP. Confirmar que las dos rutas públicas no entregan conteos y que el personal conserva su información.

La comprobación de HTTPS/cookies en el hosting y las pruebas con MySQL real deben registrarse por separado; las pruebas locales con simulaciones no certifican el despliegue.
