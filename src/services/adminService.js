const pool = require("../config/database");
const { randomUUID } = require("node:crypto");
const { transaction, lockDays } = require("../lib/transaction");
const { AppError } = require("../lib/errors");
const v = require("../lib/validation");
const {
  today,
  nextDay,
  weekday,
  peakOccupancy,
  ACTIVE_STATES,
} = require("../lib/agenda");
const reads = require("./agendaReadService");
const audit = require("./auditoriaService");

function validateDay(day) {
  v.object(day, [
    "dia_semana",
    "hora_apertura",
    "hora_cierre",
    "duracion_bloque_min",
    "capacidad_maxima",
    "activo",
  ]);
  if (
    !Number.isInteger(day.dia_semana) ||
    day.dia_semana < 0 ||
    day.dia_semana > 6 ||
    typeof day.activo !== "boolean"
  )
    v.invalid("Día o estado de apertura no válido.");
  for (const field of ["hora_apertura", "hora_cierre"])
    if (
      typeof day[field] !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(day[field])
    )
      v.invalid("Horario no válido.", [field]);
  if (day.hora_cierre <= day.hora_apertura)
    v.invalid("El cierre debe ser posterior a la apertura.");
  if (
    !Number.isInteger(day.duracion_bloque_min) ||
    day.duracion_bloque_min < 1 ||
    day.duracion_bloque_min > 1440
  )
    v.invalid("Duración de bloque no válida.");
  if (
    !Number.isInteger(day.capacidad_maxima) ||
    day.capacidad_maxima < 1 ||
    day.capacidad_maxima > 15
  )
    v.invalid("La capacidad debe estar entre 1 y 15.");
  return {
    ...day,
    hora_apertura: day.hora_apertura.slice(0, 5),
    hora_cierre: day.hora_cierre.slice(0, 5),
  };
}
async function updateConfig(body, user) {
  v.object(body, ["dias"]);
  if (!Array.isArray(body.dias) || body.dias.length !== 7)
    v.invalid("Envía la configuración de los siete días.");
  const days = body.dias.map(validateDay);
  if (new Set(days.map((d) => d.dia_semana)).size !== 7)
    v.invalid("Cada día debe aparecer una sola vez.");
  return transaction(async (connection) => {
    await lockDays(connection, [0, 1, 2, 3, 4, 5, 6], { createMissing: true });
    const before = await reads.configurations(connection);
    const [appointments] = await connection.execute(
      "SELECT id_cita,inicio,fin,estado FROM cita WHERE estado IN ('PENDIENTE','EN_DIAGNOSTICO','EN_REPARACION') AND inicio>=?",
      [`${today()} 00:00:00`],
    );
    const byDate = new Map();
    for (const cita of appointments) {
      const date = cita.inicio.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(cita);
    }
    for (const cita of appointments) {
      const day = days.find(
        (d) => d.dia_semana === weekday(cita.inicio.slice(0, 10)),
      );
      if (
        !day.activo ||
        cita.inicio.slice(11, 16) < day.hora_apertura ||
        cita.fin.slice(11, 16) > day.hora_cierre ||
        peakOccupancy(
          byDate.get(cita.inicio.slice(0, 10)),
          cita.inicio,
          cita.fin,
        ) > day.capacidad_maxima
      ) {
        throw new AppError(
          409,
          "EXISTING_APPOINTMENTS",
          "La configuración dejaría citas activas fuera de horario o sin capacidad.",
        );
      }
    }
    for (const d of days.sort((a, b) => a.dia_semana - b.dia_semana)) {
      await connection.execute(
        `UPDATE configuracion_agenda SET hora_apertura=?,hora_cierre=?,duracion_bloque_min=?,capacidad_maxima=?,activo=? WHERE dia_semana=?`,
        [
          d.hora_apertura,
          d.hora_cierre,
          d.duracion_bloque_min,
          d.capacidad_maxima,
          d.activo,
          d.dia_semana,
        ],
      );
    }
    const after = await reads.configurations(connection);
    await audit(
      connection,
      user,
      "CONFIGURAR_AGENDA",
      "configuracion_agenda",
      "semana",
      { antes: before, despues: after },
    );
    return after;
  });
}
async function listClosures(connection = pool) {
  const [rows] = await connection.execute(
    "SELECT * FROM bloqueo_agenda ORDER BY inicio,id_bloqueo",
  );
  return rows.map((r) => ({ ...r, fecha: r.inicio.slice(0, 10) }));
}
async function createClosure(body, user) {
  v.object(body, ["fecha", "motivo", "tipo"]);
  const fecha = v.civilDate(body.fecha),
    motivo = v.string(body.motivo, "motivo", 200),
    tipo = body.tipo || "OTRO";
  if (fecha < today()) v.invalid("No se puede cerrar una fecha pasada.");
  if (!["MANTENIMIENTO", "FESTIVO", "OTRO"].includes(tipo))
    v.invalid("Tipo de cierre no válido.");
  const inicio = `${fecha} 00:00:00`,
    fin = `${nextDay(fecha)} 00:00:00`;
  return transaction(async (connection) => {
    await lockDays(connection, [weekday(fecha)]);
    const [[existing]] = await connection.execute(
      "SELECT COUNT(*) total FROM bloqueo_agenda WHERE inicio<? AND fin>?",
      [fin, inicio],
    );
    if (existing.total)
      throw new AppError(
        409,
        "CLOSURE_EXISTS",
        "Ya existe un cierre para esa fecha.",
      );
    const [[count]] = await connection.execute(
      "SELECT COUNT(*) total FROM cita WHERE inicio<? AND fin>? AND estado IN ('PENDIENTE','EN_DIAGNOSTICO','EN_REPARACION')",
      [fin, inicio],
    );
    if (count.total)
      throw new AppError(
        409,
        "EXISTING_APPOINTMENTS",
        "Hay citas activas. Reprográmalas o cancélalas antes de cerrar la fecha.",
      );
    const id = randomUUID();
    await connection.execute(
      "INSERT INTO bloqueo_agenda(id_bloqueo,inicio,fin,tipo,motivo,creado_por) VALUES(?,?,?,?,?,?)",
      [id, inicio, fin, tipo, motivo, user.id_usuario],
    );
    const [[created]] = await connection.execute(
      "SELECT * FROM bloqueo_agenda WHERE id_bloqueo=?",
      [id],
    );
    await audit(connection, user, "BLOQUEAR_AGENDA", "bloqueo_agenda", id, {
      despues: created,
    });
    return { ...created, fecha };
  });
}
async function removeClosure(id, user) {
  const [[before]] = await pool.execute(
    "SELECT * FROM bloqueo_agenda WHERE id_bloqueo=?",
    [id],
  );
  if (!before) throw new AppError(404, "NOT_FOUND", "El cierre no existe.");
  // Cubre todos los días de semana: también permite retirar cierres heredados de varios días.
  return transaction(async (connection) => {
    await lockDays(connection, [0, 1, 2, 3, 4, 5, 6]);
    const [[current]] = await connection.execute(
      "SELECT * FROM bloqueo_agenda WHERE id_bloqueo=? FOR UPDATE",
      [id],
    );
    if (!current) throw new AppError(404, "NOT_FOUND", "El cierre no existe.");
    await connection.execute("DELETE FROM bloqueo_agenda WHERE id_bloqueo=?", [
      id,
    ]);
    await audit(connection, user, "RETIRAR_BLOQUEO", "bloqueo_agenda", id, {
      antes: current,
    });
    return { id_bloqueo: id };
  });
}
async function logs(query) {
  const { limit, offset } = v.pagination(query);
  const [[count]] = await pool.execute(
    "SELECT COUNT(*) total FROM log_auditoria",
  );
  const [data] = await pool.query(
    `SELECT l.*,u.nombre_completo empleado FROM log_auditoria l JOIN usuario u ON u.id_usuario=l.id_empleado ORDER BY l.ocurrio_en DESC,l.id_log DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return { data, pagination: { limit, offset, total: count.total } };
}
module.exports = {
  updateConfig,
  listClosures,
  createClosure,
  removeClosure,
  logs,
  validateDay,
};
