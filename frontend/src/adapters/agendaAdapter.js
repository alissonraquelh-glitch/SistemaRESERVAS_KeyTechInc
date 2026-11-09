/**
 * Adaptador de Agenda y Disponibilidad Pública.
 * 
 * REGLA DE CALIDAD Y PRIVACIDAD:
 * Para el portal público, la disponibilidad se debe consultar mediante un endpoint
 * agregado que únicamente devuelva intervalos, cupos disponibles/ocupados y estado.
 * NUNCA se deben descargar citas ni datos personales de clientes en el navegador
 * para calcular disponibilidad en cliente.
 */

/**
 * @typedef {Object} SlotAvailability
 * @property {string} slot - "08:00 - 10:00"
 * @property {number} bookedCount - Cantidad de citas reservadas
 * @property {number} maxCapacity - Capacidad máxima
 * @property {boolean} isFull - Si el cupo está agotado
 * @property {boolean} isAlmostFull - Si la ocupación >= 60%
 * @property {('Disponible'|'Casi Lleno'|'Agotado')} status - Etiqueta
 */

/**
 * @typedef {Object} DayAvailabilityResponse
 * @property {string} date - YYYY-MM-DD
 * @property {boolean} isBlocked - Si la fecha está completamente cerrada
 * @property {string|null} blockReason - Motivo público de cierre si aplica
 * @property {SlotAvailability[]} slots - Lista de franjas horarias
 */

/**
 * Propuesta de contrato para consulta de disponibilidad pública.
 * TODO: Acordar con el backend la implementación de GET /api/public/disponibilidad?fecha=YYYY-MM-DD
 */
export const PUBLIC_AVAILABILITY_CONTRACT_PROPOSAL = {
  endpoint: '/api/public/disponibilidad',
  method: 'GET',
  params: {
    fecha: 'YYYY-MM-DD',
  },
  responseShape: {
    fecha: '2026-09-28',
    cerrado: false,
    motivo_cierre: null,
    intervalos: [
      {
        intervalo: '08:00 - 10:00',
        ocupados: 2,
        capacidad_maxima: 3,
        estado: 'CASI_LLENO',
      },
    ],
  },
};
