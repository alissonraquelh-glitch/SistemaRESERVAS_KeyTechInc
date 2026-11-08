/**
 * Utilidades de fecha y zona horaria para Taller Bautista.
 * Zona oficial del negocio: America/El_Salvador (UTC-6 sin horario de verano).
 * 
 * Regla de calidad: Trabajar con fechas civiles YYYY-MM-DD y evitar
 * new Date('YYYY-MM-DD') para visualización que sufra desfases de zona local del navegador.
 */

export const TIMEZONE_EL_SALVADOR = 'America/El_Salvador';

/**
 * Obtiene la fecha civil de hoy en la zona horaria de El Salvador en formato YYYY-MM-DD.
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getTodayCivilDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_EL_SALVADOR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Obtiene la fecha civil de mañana en la zona horaria de El Salvador en formato YYYY-MM-DD.
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getTomorrowCivilDate() {
  const todayStr = getTodayCivilDate();
  const [year, month, day] = todayStr.split('-').map(Number);
  
  // Usar Date UTC para cálculos puros de calendario civil
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  dateObj.setUTCDate(dateObj.getUTCDate() + 1);
  
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene la fecha mínima permitida para agendamiento.
 * Para portal público: mañana (cumpliendo provisionalmente la regla de 24h de anticipación).
 * Para registro manual interno: hoy (el personal puede agendar el mismo día si hay cupo).
 * 
 * @param {boolean} isStaffManual - Indica si es registro manual de secretaría
 * @returns {string} YYYY-MM-DD
 */
export function getMinimumBookingDate(isStaffManual = false) {
  return isStaffManual ? getTodayCivilDate() : getTomorrowCivilDate();
}

/**
 * Formatea una fecha civil YYYY-MM-DD a texto legible en español
 * (ejemplo: "lunes, 28 de septiembre de 2026") sin desfase horario.
 * 
 * @param {string} dateStr - Cadena YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
export function formatDateLongEs(dateStr) {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  return dateObj.toLocaleDateString('es-ES', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Verifica si una fecha YYYY-MM-DD es anterior a la fecha actual en El Salvador.
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isDateInPast(dateStr) {
  const today = getTodayCivilDate();
  return dateStr < today;
}
