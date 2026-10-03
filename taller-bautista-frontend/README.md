# Grupo Bautista — Front-end de reservas

Front-end en **React** para la página de reservas del taller automotriz "Grupo Bautista".

Este es el **front-end de cliente**: su único objetivo es llevar al visitante a agendar
una cita para el diagnóstico con el **escáner computarizado**. El cliente no elige un
servicio con precio (el taller no vende "servicios a la carta" desde la web): solo pide
día y franja horaria (mañana/tarde), y el taller confirma por correo la hora exacta desde
un panel de administración aparte (fuera del alcance de este proyecto).

Este documento explica **cada carpeta y por qué existe**, para que puedas defenderlo en
clase sin problema.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`). Para ver cómo
se comporta en móvil, abre las herramientas de desarrollador del navegador (F12) y activa
la vista de dispositivo móvil.

Para generar la versión final optimizada (la que se subiría a un hosting):

```bash
npm run build
```

## Estructura del proyecto

```
src/
├── main.jsx                  # Punto de entrada: monta React en el HTML
├── App.jsx                   # Define las rutas (URLs) de la app
├── index.css                  # Todos los estilos, organizados por sección
├── models/                    # Clases (Programación Orientada a Objetos)
│   ├── ServiceCategory.js
│   ├── Appointment.js
│   └── BookingManager.js
├── data/                       # "Base de datos" temporal (sin backend aún)
│   ├── serviceCategories.js
│   └── branchesData.js
├── context/
│   └── BookingContext.jsx      # Comparte el estado de la cita entre páginas
├── components/                  # Piezas reutilizables de UI
│   ├── Layout.jsx
│   ├── Header.jsx
│   ├── BottomNav.jsx
│   ├── Footer.jsx
│   ├── CategoryCard.jsx
│   ├── SloganRotator.jsx
│   ├── StepIndicator.jsx
│   └── Icons.jsx
├── pages/                       # Una página por ruta
│   ├── Home.jsx
│   ├── Services.jsx
│   ├── BookAppointment.jsx
│   ├── Contact.jsx
│   └── NotFound.jsx
└── utils/
    └── calendar.js              # Funciones auxiliares para pintar el calendario
```

## 1. La parte de Programación Orientada a Objetos (`src/models/`)

Igual que antes, los datos importantes no se manejan como objetos sueltos
(`{ nombre: 'x' }`), sino como **instancias de clases**:

- **`ServiceCategory`** (`models/ServiceCategory.js`): representa un área que cubre el
  taller (Mecánica general, Eléctrico, A/C, Alineado y Balanceo). Encapsula su ícono,
  nombre, descripción y la lista de cosas que incluye (`items`), y tiene un método propio:
  - `getItemsLabel()` → arma el texto "Mantenimiento general, Sistema de frenos, ..."
    listo para mostrar, sin repetir ese `.join(', ')` en cada componente que lo necesite.

  Esta clase reemplaza a la antigua `Service` (que tenía precio y calificación). El
  cambio de fondo es conceptual: ya no modelamos "un servicio que el cliente compra",
  sino "una categoría informativa que el cliente puede consultar".

- **`Appointment`** (`models/Appointment.js`): representa una **solicitud** de cita (no
  una cita confirmada). Encapsula el día elegido, la preferencia de horario (Mañana/Tarde,
  sin hora exacta) y los datos del cliente (`{ name, dui, brand, model, year, plate,
  email, phone }`), y expone métodos propios:
  - `getFormattedDate()` → arma la fecha en español completo ("lunes 12 de octubre de 2026").
  - `getVehicleLabel()` → arma "Toyota Corolla 2018" a partir de marca/modelo/año.

  Toda solicitud nace con estado `"Pendiente de confirmación"`, porque la hora exacta la
  fija el taller después (desde su propio panel, que no es parte de este proyecto).

- **`BookingManager`** (`models/BookingManager.js`): **administra** la creación de
  solicitudes. Tiene un método `addAppointment({ date, timePreference, client })` que
  arma y devuelve una `Appointment`, y `getLast()` para consultar la última creada. Es el
  mismo patrón de "manager"/repositorio que antes: centraliza la regla de "cómo se crea
  una solicitud de cita" en un solo lugar, en vez de repetirla en cada página.

En `src/data/serviceCategories.js` no se guardan objetos planos, sino **instancias de
`ServiceCategory`** (`new ServiceCategory({...})`), por eso en cualquier componente se
puede llamar directamente `category.getItemsLabel()`.

## 2. Cómo React usa esas clases (`src/context/BookingContext.jsx`)

Las clases de arriba son JavaScript "puro", no saben nada de React. El puente entre esas
clases y las pantallas es `BookingContext.jsx`:

- Crea **una sola instancia** de `BookingManager` (con `useRef`, que no se reinicia entre
  renders).
- `addAppointment(...)` llama al manager, guarda la solicitud creada en un `useState`
  (`lastAppointment`) y la devuelve, para que la pantalla de confirmación pueda mostrarla
  de inmediato.
- Expone todo esto mediante `useContext`, así que **cualquier página** puede pedir una
  cita con `const { addAppointment } = useBooking()`, sin pasar props manualmente de
  componente en componente.

## 3. Navegación entre pantallas (`src/App.jsx` + React Router)

Se usó la librería **react-router-dom** para que cada pantalla tenga su propia URL real
(`/`, `/servicios`, `/agenda`, `/contacto`), en vez de simular la navegación con
`if/else`.

- `<Layout />` (en `components/Layout.jsx`) es la ruta "molde": pinta el header, la barra
  inferior y el footer una sola vez, y el contenido de cada página se inyecta en
  `<Outlet />` según la URL activa.
- `useNavigate()`/`<Link>` se usan para mandar al cliente de Home o Servicios directo a
  `/agenda` con el botón "Reservar Cita".

> Nota: la pantalla `ServiceDetail` (detalle de un servicio con precio) del diseño
> original se eliminó a propósito, porque el cliente ya no elige un servicio específico:
> solo agenda un diagnóstico.

## 4. La Agenda como asistente de pasos (`src/pages/BookAppointment.jsx`)

Antes de este cambio, Agendar Cita era un formulario largo en una sola pantalla. Ahora es
un **wizard de 4 pasos**, controlado con un solo `useState` (`step`), siguiendo
exactamente el flujo que se definió para el cliente:

1. **Selecciona el día** — el mismo calendario de antes (`utils/calendar.js`), pero solo
   para elegir la fecha en que el cliente llevará su vehículo.
2. **Disponibilidad** — el cliente elige **Mañana** o **Tarde** (`TIME_PREFERENCE`), no
   una hora exacta. Ese detalle lo confirma el taller después por correo desde su panel
   de administración.
3. **Tus datos** — formulario con DUI, datos del vehículo (marca/modelo/año/placa),
   correo y teléfono.
4. **Confirmación** — resume la solicitud (día, preferencia, vehículo) y explica que se
   enviará un correo con la hora exacta.

`<StepIndicator />` (`components/StepIndicator.jsx`) es el componente reutilizable que
dibuja los círculos numerados de arriba, marcando cuál paso está activo y cuáles ya se
completaron, a partir de dos props (`steps`, `currentStep`) — no sabe nada de citas, solo
sabe dibujar pasos, por lo que se podría reusar en cualquier otro flujo futuro.

## 5. Home: enfocada en un solo objetivo (`src/pages/Home.jsx`)

El rediseño más importante es conceptual: Home ya no es un catálogo de servicios con
precio, sino una pantalla enfocada en **una sola acción**: agendar el diagnóstico.

- El **logo aparece grande** en la parte superior (`.hero__logo`), seguido de un eslogan
  que rota cada pocos segundos (`<SloganRotator />`, con `useEffect` + `setInterval`) con
  frases como "Más de 45 años de calidad".
- El botón principal (`.btn--cta`) es intencionalmente llamativo: más grande que los
  botones normales, con sombra y una animación sutil de pulso (`@keyframes pulse` en
  `index.css`), para que sea imposible no verlo.
- Debajo, la sección "¿Qué revisamos?" muestra las 4 áreas del taller como tarjetas tipo
  **acordeón** (`<CategoryCard />`): cada una se puede expandir/contraer con un `useState`
  local (`open`) para ver qué incluye, sin mostrar precios en ningún momento.
- Al final hay un segundo llamado a la acción, para no perder al cliente que llegó hasta
  abajo sin agendar.

## 6. Diseño responsivo (móvil vs. escritorio)

La maqueta original está pensada como app de celular (con barra de navegación abajo). La
versión web mantiene esa experiencia en pantallas pequeñas, pero en escritorio se
convierte en un sitio web normal:

- `Header.jsx` muestra solo el logo en móvil, y un menú horizontal completo en pantallas
  ≥768px (ver `@media (min-width: 768px)` en `index.css`).
- `BottomNav.jsx` (la barra con Home/Servicios/Agenda/Contacto) se oculta por completo en
  escritorio con esa misma media query.
- Las tarjetas de categoría se acomodan en una columna en celular y en cuadrícula de 2
  columnas en escritorio; lo mismo pasa con el formulario de datos del cliente
  (`.form-grid`).

Todo el color, tipografía y medidas "de marca" están centralizados como variables CSS al
inicio de `index.css` (`--color-primary`, `--radius-md`, etc.), para poder ajustar el
estilo del sitio completo desde un solo lugar.

## 7. Cosas para dejar claras al presentar

- **No hay precios en ningún lugar del sitio**, a propósito: el cliente no elige ni paga
  un servicio específico desde la web, solo agenda el diagnóstico.
- **La hora exacta no se pide ni se muestra aquí**: este es el front-end del cliente. Un
  front-end aparte para el personal del taller (fuera de este proyecto) sería el que
  confirma la hora exacta dentro de la franja elegida.
- **Los datos son temporales**: `serviceCategories.js` y `branchesData.js` simulan lo que
  en el futuro vendría de una base de datos/backend. Cuando el compañero de back-end
  tenga una API lista, esos archivos se reemplazan por llamadas `fetch`.
- **Las fotos son de muestra** (Unsplash), puestas solo para que el diseño se vea
  completo. Se reemplazan cambiando el campo `image` en `serviceCategories.js` y
  `branchesData.js` por fotos reales del taller.
- **La última solicitud se guarda solo en memoria** (mientras el navegador sigue
  abierto): al recargar la página se pierde. Eso es intencional por ahora, ya que aún no
  hay backend/base de datos real.
- **Redes sociales**: el footer (`components/Footer.jsx`) incluye enlaces de Instagram y
  Facebook; hoy apuntan a `#` como placeholder — solo hay que reemplazar el `href` en
  `data/branchesData.js` (`contactInfo`) por los enlaces reales de la página del taller.

## 8. Diferencias respecto a la versión anterior de este mismo proyecto

- Se eliminó el catálogo de servicios con precio y calificación, y la pantalla de detalle
  de servicio (`ServiceDetail.jsx`).
- Los "servicios" se convirtieron en 4 categorías informativas, sin precio, mostradas
  como acordeón.
- Agendar Cita pasó de un formulario de una sola pantalla a un asistente de 4 pasos, y ya
  no se elige la hora exacta (solo mañana/tarde).
- El formulario ahora pide DUI, datos del vehículo y placa (antes no se pedían).
- Se agregó un logo grande y eslogan rotativo en Home, un botón "Reservar" más llamativo,
  y un footer con redes sociales.
