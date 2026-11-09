const { civilDate, datetime, invalid } = require("./validation");
const ACTIVE_STATES = ["PENDIENTE", "EN_DIAGNOSTICO", "EN_REPARACION"];
const STATES = [...ACTIVE_STATES, "COMPLETADA", "CANCELADA"];
const TIMEZONE = "America/El_Salvador";
function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function nextDay(date) {
  civilDate(date);
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function weekday(date) {
  return new Date(`${civilDate(date)}T12:00:00Z`).getUTCDay();
}
function minutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function clock(minute) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
function generateSlots(config) {
  if (!config || !config.activo) return [];
  const start = minutes(config.hora_apertura),
    end = minutes(config.hora_cierre),
    duration = config.duracion_bloque_min;
  const slots = [];
  function segment(a, b, alignEnd) {
    if (a >= b) return;
    if (alignEnd && (b - a) % duration) {
      const next = a + ((b - a) % duration);
      slots.push([clock(a), clock(next)]);
      a = next;
    }
    while (a < b) {
      const next = Math.min(a + duration, b);
      slots.push([clock(a), clock(next)]);
      a = next;
    }
  }
  segment(start, Math.min(end, 720), true);
  segment(Math.max(start, 720), end, false);
  return slots;
}
function peakOccupancy(rows, start, end, excludeId = null) {
  const overlapping = rows.filter(
    (r) =>
      r.id_cita !== excludeId &&
      ACTIVE_STATES.includes(r.estado) &&
      r.inicio < end &&
      r.fin > start,
  );
  return Math.max(
    0,
    ...[
      start,
      ...overlapping.map((r) => r.inicio).filter((t) => t > start && t < end),
    ].map(
      (time) =>
        overlapping.filter((r) => r.inicio <= time && r.fin > time).length,
    ),
  );
}
function interval(input, { allowPast = false } = {}) {
  const inicio = datetime(input.inicio, "inicio"),
    fin = datetime(input.fin, "fin");
  if (fin <= inicio || inicio.slice(0, 10) !== fin.slice(0, 10))
    invalid(
      "El intervalo debe estar en un solo día y terminar después de comenzar.",
    );
  if (!allowPast && inicio.slice(0, 10) < today())
    invalid("No se puede agendar en una fecha pasada.");
  return { inicio, fin };
}
module.exports = {
  ACTIVE_STATES,
  STATES,
  TIMEZONE,
  today,
  nextDay,
  weekday,
  minutes,
  generateSlots,
  peakOccupancy,
  interval,
};
