/**
 * Generador y evaluador de intervalos de horario (time slots).
 * 
 * CORRECCIÓN RESPECTO AL PROTOTIPO V6:
 * En el JS original, generateTimeSlots ignoraba minutos y podía generar intervalos
 * fuera de horario si el cierre era antes de mediodía. Esta versión respeta minutos,
 * maneja aperturas/cierres arbitrarios, preserva la división mañana/tarde en 12:00,
 * y genera bloques nominales de 2 horas con posibles residuales de 1 hora.
 */

/**
 * Convierte cadena "HH:MM" a minutos desde medianoche.
 * @param {string} timeStr - "HH:MM"
 * @returns {number} Minutos
 */
function timeToMinutes(timeStr) {
  const [h, m] = (timeStr || "08:00").split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Convierte minutos desde medianoche a "HH:MM".
 * @param {number} totalMinutes 
 * @returns {string} "HH:MM"
 */
function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Genera la lista de intervalos de atención basados en los horarios de apertura y cierre.
 * @param {string} [openHour="08:00"] 
 * @param {string} [closeHour="18:00"] 
 * @returns {string[]} Lista de intervalos ej: ["08:00 - 10:00", "10:00 - 12:00", ...]
 */
export function generateTimeSlots(openHour = "08:00", closeHour = "18:00") {
  const startMins = timeToMinutes(openHour);
  const endMins = timeToMinutes(closeHour);
  const noonMins = 12 * 60; // 12:00 PM
  const slots = [];

  if (startMins >= endMins) return slots;

  // 1. Bloque de Mañana (desde startMins hasta min(endMins, noonMins))
  if (startMins < noonMins) {
    const morningEndMins = Math.min(endMins, noonMins);
    let current = startMins;
    
    // Si la diferencia hasta el mediodía no es múltiplo de 2 horas (120 mins),
    // el primer bloque se ajusta para alinearse en horas pares o bloque de 1 hora
    const remainingMorning = morningEndMins - current;
    if (remainingMorning % 120 !== 0 && remainingMorning >= 60) {
      const next = current + (remainingMorning % 120);
      slots.push(`${minutesToTime(current)} - ${minutesToTime(next)}`);
      current = next;
    }

    while (current + 120 <= morningEndMins) {
      const next = current + 120;
      slots.push(`${minutesToTime(current)} - ${minutesToTime(next)}`);
      current = next;
    }

    if (current < morningEndMins) {
      slots.push(`${minutesToTime(current)} - ${minutesToTime(morningEndMins)}`);
    }
  }

  // 2. Bloque de Tarde (desde max(noonMins, startMins) hasta endMins)
  if (endMins > noonMins) {
    let current = Math.max(noonMins, startMins);
    
    while (current + 120 <= endMins) {
      const next = current + 120;
      slots.push(`${minutesToTime(current)} - ${minutesToTime(next)}`);
      current = next;
    }

    // Segmento residual al final de la tarde si sobra tiempo
    if (current < endMins) {
      slots.push(`${minutesToTime(current)} - ${minutesToTime(endMins)}`);
    }
  }

  return slots;
}

/**
 * Determina si un intervalo corresponde al turno de mañana o tarde.
 * @param {string} slotStr - "08:00 - 10:00"
 * @returns {'MANANA' | 'TARDE'}
 */
export function getSlotShift(slotStr) {
  if (!slotStr) return 'MANANA';
  const startHour = parseInt(slotStr.split(':')[0], 10);
  return startHour < 12 ? 'MANANA' : 'TARDE';
}

/**
 * Calcula el estado de ocupación de un intervalo según la capacidad máxima.
 * @param {number} bookedCount - Número de citas reservadas
 * @param {number} maxCapacity - Capacidad máxima permitida (ej: 3)
 * @returns {{
 *   percentage: number,
 *   isFull: boolean,
 *   isAlmostFull: boolean,
 *   statusText: 'Disponible' | 'Casi Lleno' | 'Agotado',
 *   badgeColor: string,
 *   barColor: string,
 *   cardColor: string
 * }}
 */
export function calculateSlotOccupancy(bookedCount, maxCapacity) {
  const safeMax = Math.max(1, maxCapacity || 1);
  const percentage = Math.min(100, (bookedCount / safeMax) * 100);
  const isFull = bookedCount >= safeMax;
  const isAlmostFull = !isFull && percentage >= 60;

  let statusText = 'Disponible';
  let badgeColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  let barColor = 'bg-emerald-500';
  let cardColor = 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-lg cursor-pointer transform hover:-translate-y-1';

  if (isFull) {
    statusText = 'Agotado';
    badgeColor = 'bg-gray-200 text-gray-600';
    barColor = 'bg-gray-400';
    cardColor = 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale';
  } else if (isAlmostFull) {
    statusText = 'Casi Lleno';
    badgeColor = 'bg-amber-100 text-amber-700 border border-amber-200';
    barColor = 'bg-amber-500';
  }

  return {
    percentage,
    isFull,
    isAlmostFull,
    statusText,
    badgeColor,
    barColor,
    cardColor,
  };
}
