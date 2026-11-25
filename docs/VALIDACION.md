# Validación V7.1 — pruebas ejecutadas

Entorno: rama `feature/mejoras-feedback-cliente`, MySQL 8 local desechable en Docker y Chrome. **No se usó Railway ni datos de producción.**

## Automatizadas

| Suite | Resultado |
|---|---|
| Unitarias backend (`npm --prefix src test`) | 6/6 aprobadas |
| Integración backend con MySQL desechable (`bookit_v6_feedback_test`) | 17/17 aprobadas |
| Build frontend (`npm --prefix frontend run build`) | Aprobado |
| E2E Playwright (`test:e2e`) | **Aprobada** tras restaurarse `frontend/test/e2e.mjs` (PR #12): humo a 1440 px y 390 px con `E2E_BROWSER_CHANNEL=chromium` |

## Funcionales en navegador

| Caso | Resultado |
|---|---|
| RF-01: “Otros” muestra la descripción obligatoria; sin descripción no se puede confirmar; se guarda y se muestra “Otros: …”; los servicios estándar no muestran el campo | Aprobado |
| RF-02: reserva sin marca; placa y modelo obligatorios | Aprobado |
| RF-03: Próximas/ascendente por defecto, Historial, Todas, orden descendente, 10/25/50/100 por página, salto directo, Primera/Última; 17 páginas recorridas con 161 IDs únicos, sin duplicados | Aprobado |
| RF-04/05: Hoy (El Salvador), ±15 días, último/próximo mes (luego cambiado a mes calendario completo y verificado con script), rango personalizado, error en rango inverso, Cargar más (de 25 a 36 tarjetas) | Aprobado |
| RF-06: 30 días por defecto; 31 días muestra error y bloquea la exportación; filtros de acción y módulo | Aprobado |
| RF-06 CSV: descarga desde la UI con CSRF; BOM y cabecera; 3/3 y 28/28 filas (resultado de 2 páginas exportado completo) | Aprobado |
| Seguridad: exportación sin CSRF devuelve 403; Jefe sin acceso a Auditoría (403); sin sesión devuelve 401 | Aprobado |
| Regresión: login/logout (Admin, Secretaría, Jefe), edición de cita y vehículo, cancelar/reactivar, Kanban, horarios, cierres, portal público | Aprobado |
| Vehículo existente: una petición sin marca/tipo conserva los valores guardados | Aprobado (también con prueba de integración) |

## No ejecutadas / fuera de alcance
- Suite E2E Playwright (falta el archivo de pruebas en el repositorio).
- Pruebas en Railway/producción: no autorizadas.
- Gestión de usuarios y administración de servicios en la UI: estos módulos no existen en la aplicación.

## Observación
El primer guardado de horarios fue rechazado con `409 EXISTING_APPOINTMENTS` porque los datos sintéticos superaban la capacidad, y el sistema se comportó como corresponde. Después de corregir esos datos locales, el guardado pasó.
