# Carpetas del proyecto y su función

El proyecto se divide en tres partes principales:

- **`db/`:** archivos para crear, actualizar y cargar datos de prueba en MySQL. Los datos reales viven en el servidor MySQL, no en esta carpeta.
- **`src/`:** backend Express. Recibe las solicitudes de la interfaz, comprueba permisos y trabaja con la base de datos.
- **`frontend/`:** aplicación React + Vite. Contiene las pantallas que utilizan los clientes y el personal del taller.

Este resumen describe las carpetas presentes en la copia revisada. Se excluyen dependencias, documentación, cachés y resultados generados.

## Mapa de carpetas relevantes

```text
SistemaRESERVAS_KeyTechInc/
├── db/
│   └── migrations/
├── src/                              Backend
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   └── test/
│       ├── helpers/
│       └── integration/
└── frontend/                         Interfaz React
    ├── public/
    ├── src/
    │   ├── adapters/
    │   ├── app/
    │   ├── assets/
    │   ├── components/
    │   │   ├── layout/
    │   │   └── ui/
    │   ├── config/
    │   ├── context/
    │   ├── features/
    │   │   ├── administration/
    │   │   ├── appointments/
    │   │   ├── auth/
    │   │   ├── public-booking/
    │   │   ├── staff/
    │   │   └── workshop/
    │   ├── hooks/
    │   ├── services/
    │   │   └── api/
    │   ├── styles/
    │   └── utils/
    └── test/
```

## Base de datos

| Carpeta | Función |
| --- | --- |
| `db/` | Contiene el esquema MySQL, los procedimientos para controlar reservas y los scripts de datos de demostración. |
| `db/migrations/` | Guarda los cambios que se aplican a una base ya existente, sin volver a crear todas sus tablas. |

Archivos principales:

- **`DataBase(1).sql`:** crea las ocho tablas, los controles de auditoría y los procedimientos de agenda.
- **`routines.v6.sql`:** permite instalar o actualizar los procedimientos de reservas sin recrear las tablas.
- **`seed.demo.sql`:** carga clientes, vehículos, configuración y citas de prueba.
- **`seed.empleados.demo.sql`:** carga empleados de demostración con contraseñas bcrypt para probar el login.
- **`migrations/002_v6.sql`:** adapta la versión anterior de MySQL a los campos, estados y procedimientos de V6.

## Backend: `src/`

| Carpeta | Función |
| --- | --- |
| `src/` | Raíz del backend. `app.js` inicia Express y conecta las rutas, la sesión y el manejo de errores. Tiene su propio `package.json`. |
| `src/config/` | Configura la conexión a MySQL y define el catálogo fijo de servicios que utiliza el sistema. |
| `src/lib/` | Reúne herramientas compartidas del backend: validación de entradas, errores, fechas, intervalos, cálculo de ocupación y transacciones. |
| `src/middleware/` | Contiene comprobaciones que se ejecutan antes de atender una solicitud. `session.js` maneja login, sesión, roles, origen permitido y protección CSRF para las escrituras. |
| `src/models/` | Representa las entidades de la base: usuarios, clientes, empleados, vehículos, citas, agenda, bloqueos y auditoría. `BaseModel.js` reúne operaciones comunes; los modelos pueden compartir una conexión para guardar varios cambios juntos. |
| `src/routes/` | Define las direcciones de la API y qué operación atiende cada una. Las rutas activas están concentradas en `apiRoutes.js`. |
| `src/scripts/` | Contiene herramientas que se ejecutan manualmente. `provisionEmployee.js` crea empleados y genera el hash de su contraseña. |
| `src/services/` | Coordina las reglas del negocio: registrar y editar reservas, consultar disponibilidad, configurar la semana, gestionar cierres y escribir auditoría. Combina modelos, consultas SQL y procedimientos cuando una operación lo necesita. |
| `src/test/` | Contiene pruebas del backend, incluidas las de generación de horarios, fechas y ocupación. |
| `src/test/helpers/` | Guarda utilidades utilizadas por las pruebas, como el importador de scripts SQL. |
| `src/test/integration/` | Comprueba la API contra MySQL real de pruebas: autenticación, permisos, reservas, concurrencia, cierres, migración y auditoría. |

### Servicios principales

- **`agendamientoService.js`:** registra, edita y cambia el estado de las citas; coordina cliente, vehículo, reserva y auditoría en una transacción.
- **`agendaReadService.js`:** prepara listados, detalle de citas, KPIs, tablero Kanban y disponibilidad pública/interna.
- **`adminService.js`:** administra horarios semanales, capacidad, cierres y consultas de auditoría.
- **`auditoriaService.js`:** registra las acciones del personal usando la misma conexión de la operación que se está guardando.

El contrato de los endpoints está en **`src/openapi.json`**.

### Archivos heredados que conviene distinguir

- `usuariosRoutes.js`, `vehiculosRoutes.js` y `citasRoutes.js` todavía aparecen en `src/routes/`, pero `app.js` actualmente monta `apiRoutes.js`. Esos archivos antiguos referencian un controlador de demostración que ya no está presente en esta copia.
- `auth.js`, `roleValidator.js` y `dataSanitazer.js` están vacíos. Las comprobaciones activas se encuentran en `session.js` y en las utilidades de validación.
- Actualmente no existe una carpeta `src/controllers/`. Las rutas activas delegan las operaciones del negocio en los servicios.

## Frontend: `frontend/`

| Carpeta | Función |
| --- | --- |
| `frontend/` | Raíz de React + Vite. Contiene el HTML inicial, las dependencias y la configuración de Vite, Tailwind y PostCSS. |
| `frontend/public/` | Recursos públicos que se sirven por una dirección fija, como `/logo.png`. |
| `frontend/src/` | Código de la interfaz. `main.jsx` inicia React, el navegador de rutas y los contextos compartidos. No es la carpeta del backend. |
| `frontend/src/app/` | Organiza las rutas de pantalla y la estructura principal. Decide cuándo mostrar el portal público o el portal del personal según la sesión. |
| `frontend/src/adapters/` | Traduce los datos y estados de la API al formato que necesitan las pantallas. También define cómo se muestran los roles y qué vistas puede ver cada uno. |
| `frontend/src/assets/` | Imágenes y otros recursos importados desde los componentes para que Vite los incluya en la compilación. |
| `frontend/src/components/` | Elementos visuales reutilizables que pueden aparecer en distintas partes del sistema. |
| `frontend/src/components/layout/` | Partes compartidas de la página, principalmente `Header.jsx` y `Footer.jsx`. |
| `frontend/src/components/ui/` | Piezas pequeñas de interfaz: ventanas modales, indicadores de estado y mensajes de carga/error. |
| `frontend/src/config/` | Información pública y valores de referencia de la interfaz, como contactos y tipos de vehículo. Los horarios y el catálogo de servicios se obtienen de la API. |
| `frontend/src/context/` | Comparte estado entre pantallas: usuario autenticado, sesión, datos generales de agenda, actualización de consultas y notificaciones. |
| `frontend/src/features/` | Agrupa las pantallas y componentes por función del negocio. Cada subcarpeta corresponde a un módulo del sistema. |
| `frontend/src/features/public-booking/` | Portal público: presentación del taller, servicios, calendario de disponibilidad y preparación del mensaje por WhatsApp. Abrir WhatsApp no crea una reserva en la DB. |
| `frontend/src/features/auth/` | Formulario de inicio de sesión del personal. |
| `frontend/src/features/staff/` | Contenedor del portal interno y sus pestañas de Secretaría, Jefe de Taller y Administración. |
| `frontend/src/features/appointments/` | Gestión de citas de Secretaría: tabla, búsqueda, filtros, KPIs y formularios de registro/edición. `BookingForm.jsx` comparte el formulario entre alta y edición. |
| `frontend/src/features/workshop/` | Tablero Kanban del taller, tarjetas de vehículos, detalle de contacto y acciones para cambiar de etapa. |
| `frontend/src/features/administration/` | Configuración de horarios y capacidad por día, gestión de cierres y consulta de auditoría. |
| `frontend/src/hooks/` | Funciones reutilizables de React. `useApiQuery.js` consulta la API y maneja carga, errores, cancelación y recarga de datos. |
| `frontend/src/services/` | Agrupa el código de comunicación del frontend con servicios externos; actualmente contiene el acceso a la API del backend. |
| `frontend/src/services/api/` | `client.js` centraliza las solicitudes HTTP, la sesión y CSRF; `routes.js` registra métodos y direcciones de los endpoints. |
| `frontend/src/styles/` | Estilos globales de la aplicación y base de Tailwind. |
| `frontend/src/utils/` | Funciones auxiliares de fechas, formatos de teléfono/documento, validación de texto y manejo de turnos/horarios. |
| `frontend/test/` | Pruebas de navegador del flujo completo: portal público, login, citas, Kanban, Administración, recarga y logout. |

**Diferencia entre `public/` y `assets/`:** un recurso de `public/` se solicita mediante una ruta fija; uno de `assets/` se importa desde el código y Vite prepara su archivo final al compilar.

## Cómo se conectan las carpetas

En el registro de una cita, el recorrido general es:

1. El usuario completa un formulario de `frontend/src/features/appointments/`.
2. Los contextos y adaptadores preparan la operación y sus datos.
3. `frontend/src/services/api/` envía la solicitud HTTP al backend.
4. `src/app.js` y `src/routes/` reciben la solicitud; el middleware verifica sesión y permisos.
5. `src/services/` coordina las validaciones y la operación con modelos, consultas y procedimientos MySQL.
6. La respuesta vuelve al frontend; este actualiza la vista y muestra el resultado.

En una consulta pública de disponibilidad se envían intervalos y cupos, sin entregar al navegador los datos personales de las citas.

## Carpetas excluidas

No se detallan porque no forman parte del código funcional que mantiene el equipo:

- `node_modules/`: dependencias instaladas.
- `docs/`: documentación adicional, excluida expresamente de este resumen.
- `.git/`: historial y metadatos de Git.
- `.npm-cache/` y `.test-runtime/`: cachés y recursos temporales.
- `dist/`: resultado generado al compilar el frontend.
- `test-results/` y `playwright-report/`: capturas y reportes generados por las pruebas.

Para instalación, variables de entorno, ejecución y uso de los scripts, consultar [README.md](README.md).
