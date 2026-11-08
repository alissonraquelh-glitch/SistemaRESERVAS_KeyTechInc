/**
 * Registro central de rutas de API.
 * 
 * REGLA DE ARQUITECTURA:
 * - Cada ruta declara su método, path y su estado: 'CONFIRMED' o 'PENDING'.
 * - Para rutas pendientes ('PENDING'), el path es explícitamente null o no confirmado.
 * - Si no hay un endpoint verificado en backend, el servicio debe retornar un error
 *   controlado 'ENDPOINT_NOT_CONFIGURED' sin realizar peticiones de red ficticias.
 */

export const API_ROUTES = {
  // Verificación del sistema / healthcheck
  HEALTH: {
    method: 'GET',
    path: '/health',
    status: 'PENDING',
    description: 'Comprobación de salud de la API y conexión a base de datos',
  },

  // Autenticación de personal
  AUTH_LOGIN: {
    method: 'POST',
    path: null, // Pendiente de confirmar endpoint en backend
    status: 'PENDING',
    description: 'Inicio de sesión de empleados (correo/contraseña)',
  },
  AUTH_LOGOUT: {
    method: 'POST',
    path: null,
    status: 'PENDING',
    description: 'Cierre de sesión seguro',
  },
  AUTH_ME: {
    method: 'GET',
    path: null,
    status: 'PENDING',
    description: 'Perfil y rol del empleado autenticado',
  },

  // Agenda Pública / Disponibilidad agregada (RF-01 / RF-02)
  PUBLIC_AVAILABILITY: {
    method: 'GET',
    path: null, // Propuesta futura: '/api/public/disponibilidad?fecha=YYYY-MM-DD'
    status: 'PENDING',
    description: 'Consulta agregada de cupos por intervalo sin exponer datos de clientes',
  },

  // Citas (Gestión interna)
  CITAS_LIST: {
    method: 'GET',
    path: null, // Referencia histórica: '/api/citas', pero requiere soporte de filtros/etapa/servicio
    status: 'PENDING',
    description: 'Listado filtrado y paginado de citas con cliente y vehículo',
  },
  CITAS_CREATE_MANUAL: {
    method: 'POST',
    path: null, // Requiere operación coordinada en backend (usuario + cliente + vehiculo + cita)
    status: 'PENDING',
    description: 'Registro manual de citas telefónicas u offline',
  },
  CITAS_UPDATE: {
    method: 'PUT',
    path: null, // ':id'
    status: 'PENDING',
    description: 'Edición de datos de cita, cliente, vehículo y reprogramación',
  },
  CITAS_CHANGE_STATUS: {
    method: 'PATCH',
    path: null, // ':id/estado'
    status: 'PENDING',
    description: 'Cambio de estado (PENDIENTE, EN_TALLER, COMPLETADO, CANCELADO)',
  },
  CITAS_CHANGE_KANBAN_STEP: {
    method: 'PATCH',
    path: null, // ':id/etapa-kanban'
    status: 'PENDING',
    description: 'Avance o retroceso de etapa operativa en el taller',
  },

  // Configuración de Agenda y Bloqueos
  CONFIG_AGENDA_GET: {
    method: 'GET',
    path: null,
    status: 'PENDING',
    description: 'Obtención de horarios de apertura/cierre y capacidad máxima',
  },
  CONFIG_AGENDA_UPDATE: {
    method: 'PUT',
    path: null,
    status: 'PENDING',
    description: 'Actualización de horarios y capacidad máxima',
  },
  BLOQUEOS_LIST: {
    method: 'GET',
    path: null,
    status: 'PENDING',
    description: 'Listado de fechas bloqueadas / cierres programados',
  },
  BLOQUEOS_CREATE: {
    method: 'POST',
    path: null,
    status: 'PENDING',
    description: 'Registro de nuevo bloqueo de agenda puntual',
  },
  BLOQUEOS_DELETE: {
    method: 'DELETE',
    path: null, // ':id'
    status: 'PENDING',
    description: 'Eliminación de bloqueo de agenda',
  },

  // Auditoría
  AUDITORIA_LOGS: {
    method: 'GET',
    path: null,
    status: 'PENDING',
    description: 'Consulta de logs de auditoría inmutables del servidor',
  },
};
