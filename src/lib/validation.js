const { AppError } = require("./errors");

function invalid(message, fields) {
  throw new AppError(400, "VALIDATION_ERROR", message, fields);
}
function object(value, fields) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid("Se requiere un objeto JSON.");
  if (fields) {
    const unknown = Object.keys(value).filter((key) => !fields.includes(key));
    if (unknown.length)
      invalid("La solicitud contiene campos no permitidos.", unknown);
  }
  return value;
}
function string(value, field, max, required = true) {
  if (value == null || value === "") {
    if (required) invalid(`El campo ${field} es obligatorio.`, [field]);
    return null;
  }
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    invalid(`El campo ${field} no es válido.`, [field]);
  return value.trim();
}
function civilDate(value, field = "fecha") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    invalid(`${field} debe usar YYYY-MM-DD.`, [field]);
  const date = new Date(`${value}T12:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    invalid("La fecha no existe.", [field]);
  return value;
}
function datetime(value, field) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/.test(value)
  )
    invalid(`${field} debe usar YYYY-MM-DD HH:MM:00.`, [field]);
  civilDate(value.slice(0, 10), field);
  if (+value.slice(11, 13) > 23 || +value.slice(14, 16) > 59)
    invalid("Hora no válida.", [field]);
  return value;
}
function plate(value) {
  const normalized = string(value, "placa", 20)
    .replace(/[\s-]/g, "")
    .toUpperCase();
  if (!/^[A-Z0-9]{1,12}$/.test(normalized))
    invalid("La placa debe contener de 1 a 12 letras y números.", ["placa"]);
  return normalized;
}
function pagination(query) {
  const limit = query.limit === undefined ? 25 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  )
    invalid(
      "limit debe estar entre 1 y 100; offset debe ser un entero no negativo.",
    );
  return { limit, offset };
}
module.exports = {
  invalid,
  object,
  string,
  civilDate,
  datetime,
  plate,
  pagination,
};
