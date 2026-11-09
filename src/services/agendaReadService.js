const pool = require("../config/database");
const { civilDate, invalid, pagination } = require("../lib/validation");
const {
  ACTIVE_STATES,
  STATES,
  today,
  nextDay,
  weekday,
  generateSlots,
  peakOccupancy,
  TIMEZONE,
} = require("../lib/agenda");
const { AppError } = require("../lib/errors");
const COLUMNS = `c.id_cita,c.placa,c.inicio,c.fin,c.estado,c.origen,c.creada_por,c.servicio_codigo,c.notas,c.creado_en,
  v.id_cliente,v.marca,v.modelo,v.tipo,v.anio,v.color,u.nombre_completo,u.telefono,u.correo,cl.documento_identidad`;
const FROM =
  "FROM cita c JOIN vehiculo v ON v.placa=c.placa JOIN cliente cl ON cl.id_usuario=v.id_cliente JOIN usuario u ON u.id_usuario=cl.id_usuario";
function filters(query = {}) {
  const parts = [],
    values = [];
  if (query.fecha) {
    const fecha = civilDate(query.fecha);
    parts.push("c.inicio>=? AND c.inicio<?");
    values.push(`${fecha} 00:00:00`, `${nextDay(fecha)} 00:00:00`);
  }
  if (query.turno && query.turno !== "ALL") {
    if (!["MANANA", "TARDE"].includes(query.turno)) invalid("Turno no válido.");
    parts.push(
      `TIME(c.inicio) ${query.turno === "MANANA" ? "<" : ">="} '12:00:00'`,
    );
  }
  if (query.estado && query.estado !== "ALL") {
    const aliases = { COMPLETADO: "COMPLETADA", CANCELADO: "CANCELADA" };
    const state = aliases[query.estado] || query.estado;
    if (state === "EN_TALLER")
      parts.push("c.estado IN ('EN_DIAGNOSTICO','EN_REPARACION')");
    else {
      if (!STATES.includes(state)) invalid("Estado no válido.");
      parts.push("c.estado=?");
      values.push(state);
    }
  }
  if (query.q) {
    if (typeof query.q !== "string" || query.q.length > 150)
      invalid("Búsqueda no válida.");
    parts.push(
      "(u.nombre_completo LIKE ? OR cl.documento_identidad LIKE ? OR c.placa LIKE ? OR c.id_cita LIKE ?)",
    );
    const pattern = `%${query.q.trim().replace(/[\\%_]/g, "\\$&")}%`;
    values.push(pattern, pattern, pattern, pattern);
  }
  return { where: parts.length ? ` WHERE ${parts.join(" AND ")}` : "", values };
}
async function list(query, connection = pool) {
  const { limit, offset } = pagination(query);
  const { where, values } = filters(query);
  const [[count]] = await connection.execute(
    `SELECT COUNT(*) AS total ${FROM}${where}`,
    values,
  );
  // LIMIT values are validated integers. Text protocol avoids mysql2/MySQL LIMIT binding incompatibilities.
  const [data] = await connection.query(
    `SELECT ${COLUMNS} ${FROM}${where} ORDER BY c.inicio,c.id_cita LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  return { data, pagination: { limit, offset, total: count.total } };
}
async function detail(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${COLUMNS} ${FROM} WHERE c.id_cita=?`,
    [id],
  );
  if (!rows[0]) throw new AppError(404, "NOT_FOUND", "La cita no existe.");
  return rows[0];
}
async function summary(query = {}, connection = pool) {
  const { where, values } = filters(query);
  const [[data]] = await connection.execute(
    `SELECT COUNT(*) total,
    COALESCE(SUM(c.estado='PENDIENTE'),0) pendientes,
    COALESCE(SUM(c.estado IN ('EN_DIAGNOSTICO','EN_REPARACION')),0) en_taller,
    COALESCE(SUM(c.estado='COMPLETADA'),0) completadas ${FROM}${where}`,
    values,
  );
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, Number(value)]),
  );
}
async function board(query = {}) {
  const columnas = await Promise.all(
    ["PENDIENTE", "EN_DIAGNOSTICO", "EN_REPARACION", "COMPLETADA"].map(
      async (estado) => {
        const result = await list({ ...query, estado, limit: 25, offset: 0 });
        return { estado, ...result };
      },
    ),
  );
  return { columnas };
}
async function configurations(connection = pool) {
  const [rows] = await connection.execute(
    "SELECT * FROM configuracion_agenda ORDER BY dia_semana",
  );
  return rows.map((r) => ({ ...r, activo: Boolean(r.activo) }));
}
async function availability(query, internal = false, connection = pool) {
  const fecha = civilDate(query.fecha);
  if (fecha < (internal ? today() : nextDay(today())))
    invalid(
      internal
        ? "Selecciona hoy o una fecha futura."
        : "Selecciona una fecha a partir de mañana.",
    );
  if (!internal && query.excluir_cita)
    invalid("La consulta pública no admite excluir citas.");
  if (query.excluir_cita) await detail(query.excluir_cita, connection);
  const config = (await configurations(connection)).find(
    (r) => r.dia_semana === weekday(fecha),
  );
  const start = `${fecha} 00:00:00`,
    end = `${nextDay(fecha)} 00:00:00`;
  const [closures] = await connection.execute(
    "SELECT inicio,fin,motivo FROM bloqueo_agenda WHERE inicio<? AND fin>? ORDER BY inicio,id_bloqueo",
    [end, start],
  );
  const [rows] = await connection.execute(
    "SELECT id_cita,inicio,fin,estado FROM cita WHERE inicio<? AND fin>?",
    [end, start],
  );
  const fullClosure = closures.find((b) => b.inicio <= start && b.fin >= end);
  const cerrado = !config?.activo || Boolean(fullClosure);
  const intervalos = cerrado
    ? []
    : generateSlots(config).map(([a, b]) => {
        const inicio = `${fecha} ${a}:00`,
          fin = `${fecha} ${b}:00`;
        const closure = closures.find((c) => c.inicio < fin && c.fin > inicio);
        const ocupados = peakOccupancy(rows, inicio, fin, query.excluir_cita);
        const disponibles = closure
          ? 0
          : Math.max(0, config.capacidad_maxima - ocupados);
        return {
          inicio,
          fin,
          intervalo: `${a} - ${b}`,
          turno: a < "12:00" ? "MANANA" : "TARDE",
          capacidad_maxima: config.capacidad_maxima,
          ocupados,
          disponibles,
          estado: closure
            ? "BLOQUEADO"
            : !disponibles
              ? "AGOTADO"
              : ocupados / config.capacidad_maxima >= 0.6
                ? "CASI_LLENO"
                : "DISPONIBLE",
          motivo_cierre: closure?.motivo || null,
        };
      });
  return {
    fecha,
    zona_horaria: TIMEZONE,
    cerrado,
    motivo_cierre:
      fullClosure?.motivo ||
      (cerrado ? "Taller cerrado o sin configuración." : null),
    intervalos,
  };
}
module.exports = {
  list,
  detail,
  summary,
  board,
  configurations,
  availability,
  filters,
  ACTIVE_STATES,
};
