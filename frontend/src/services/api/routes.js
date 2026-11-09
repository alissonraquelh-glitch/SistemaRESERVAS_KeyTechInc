export const API_ROUTES = {
  HEALTH: {
    method: "GET",
    path: "/health",
    status: "CONFIRMED",
  },
  AUTH_LOGIN: {
    method: "POST",
    path: "/auth/login",
    status: "CONFIRMED",
  },
  AUTH_LOGOUT: {
    method: "POST",
    path: "/auth/logout",
    status: "CONFIRMED",
  },
  AUTH_ME: {
    method: "GET",
    path: "/auth/me",
    status: "CONFIRMED",
  },
  SERVICES: {
    method: "GET",
    path: "/servicios",
    status: "CONFIRMED",
  },
  PUBLIC_AGENDA: {
    method: "GET",
    path: "/public/agenda",
    status: "CONFIRMED",
  },
  PUBLIC_AVAILABILITY: {
    method: "GET",
    path: "/public/disponibilidad",
    status: "CONFIRMED",
  },
  INTERNAL_AVAILABILITY: {
    method: "GET",
    path: "/agenda/disponibilidad",
    status: "CONFIRMED",
  },
  CITAS_LIST: {
    method: "GET",
    path: "/citas",
    status: "CONFIRMED",
  },
  CITAS_DETAIL: {
    method: "GET",
    path: "/citas/:id",
    status: "CONFIRMED",
  },
  CITAS_SUMMARY: {
    method: "GET",
    path: "/citas/resumen",
    status: "CONFIRMED",
  },
  CITAS_CREATE_MANUAL: {
    method: "POST",
    path: "/citas/manuales",
    status: "CONFIRMED",
  },
  CITAS_UPDATE: {
    method: "PUT",
    path: "/citas/:id",
    status: "CONFIRMED",
  },
  CITAS_CHANGE_STATUS: {
    method: "PATCH",
    path: "/citas/:id/estado",
    status: "CONFIRMED",
  },
  WORKSHOP: {
    method: "GET",
    path: "/taller/tablero",
    status: "CONFIRMED",
  },
  CONFIG_AGENDA_GET: {
    method: "GET",
    path: "/configuracion-agenda",
    status: "CONFIRMED",
  },
  CONFIG_AGENDA_UPDATE: {
    method: "PUT",
    path: "/configuracion-agenda",
    status: "CONFIRMED",
  },
  BLOQUEOS_LIST: {
    method: "GET",
    path: "/bloqueos",
    status: "CONFIRMED",
  },
  BLOQUEOS_CREATE: {
    method: "POST",
    path: "/bloqueos",
    status: "CONFIRMED",
  },
  BLOQUEOS_DELETE: {
    method: "DELETE",
    path: "/bloqueos/:id",
    status: "CONFIRMED",
  },
  AUDITORIA_LOGS: {
    method: "GET",
    path: "/auditoria",
    status: "CONFIRMED",
  },
};
