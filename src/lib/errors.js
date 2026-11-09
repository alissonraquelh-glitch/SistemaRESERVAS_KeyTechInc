class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const sqlErrors = {
    ER_DUP_ENTRY: [409, "DUPLICATE", "Ya existe un registro con esos datos."],
    ER_NO_REFERENCED_ROW_2: [
      400,
      "INVALID_REFERENCE",
      "El registro relacionado no existe.",
    ],
    ER_ROW_IS_REFERENCED_2: [
      409,
      "IN_USE",
      "El registro tiene datos asociados.",
    ],
    ER_CHECK_CONSTRAINT_VIOLATED: [
      400,
      "INVALID_DATA",
      "Los datos no cumplen las restricciones.",
    ],
    ER_DATA_TOO_LONG: [
      400,
      "INVALID_DATA",
      "Un campo excede la longitud permitida.",
    ],
    WARN_DATA_TRUNCATED: [
      400,
      "INVALID_DATA",
      "Uno de los valores no es válido.",
    ],
    ER_BAD_NULL_ERROR: [400, "INVALID_DATA", "Faltan campos obligatorios."],
    ER_LOCK_DEADLOCK: [
      409,
      "RETRY_OPERATION",
      "Otra operación modificó la agenda. Actualiza y vuelve a intentar.",
    ],
    ER_LOCK_WAIT_TIMEOUT: [
      409,
      "RETRY_OPERATION",
      "La agenda está ocupada. Vuelve a intentar.",
    ],
    ECONNREFUSED: [
      503,
      "DATABASE_UNAVAILABLE",
      "La base de datos no está disponible.",
    ],
    ETIMEDOUT: [503, "DATABASE_UNAVAILABLE", "La base de datos no responde."],
    PROTOCOL_CONNECTION_LOST: [
      503,
      "DATABASE_UNAVAILABLE",
      "Se perdió la conexión con la base de datos.",
    ],
  };
  let mapped = sqlErrors[error.code];
  if (error.errno === 30001)
    mapped = [400, "INVALID_INTERVAL", error.sqlMessage];
  if (error.errno === 30002) mapped = [409, "CAPACITY_FULL", error.sqlMessage];
  if (error.errno === 30003) mapped = [409, "AGENDA_CLOSED", error.sqlMessage];
  if (error.type === "entity.parse.failed")
    mapped = [400, "INVALID_JSON", "El cuerpo no es JSON válido."];
  const [status, code, message] = mapped || [
    error.status || 500,
    error.code || "INTERNAL_ERROR",
    error.message,
  ];
  if (status >= 500)
    console.error("Solicitud fallida:", error.code || error.name);
  return res.status(status).json({
    code: status >= 500 && status !== 503 ? "INTERNAL_ERROR" : code,
    message:
      status >= 500 && status !== 503 ? "Ocurrió un error interno." : message,
    ...(error.fields ? { fields: error.fields } : {}),
  });
}

module.exports = { AppError, errorHandler };
