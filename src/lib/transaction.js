const pool = require("../config/database");
const { AppError } = require("./errors");
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function lockDays(connection, days, { createMissing = false } = {}) {
  for (const day of [...new Set(days)].sort((a, b) => a - b)) {
    let [rows] = await connection.execute(
      "SELECT id_configuracion FROM configuracion_agenda WHERE dia_semana = ? FOR UPDATE",
      [day],
    );
    if (!rows.length && createMissing) {
      // Crear el candado antes de la primera configuración, siempre INACTIVO.
      await connection.execute(
        `INSERT INTO configuracion_agenda
        (dia_semana,hora_apertura,hora_cierre,duracion_bloque_min,capacidad_maxima,activo)
        VALUES(?,'08:00:00','18:00:00',120,1,FALSE)
        ON DUPLICATE KEY UPDATE id_configuracion=id_configuracion`,
        [day],
      );
      [rows] = await connection.execute(
        "SELECT id_configuracion FROM configuracion_agenda WHERE dia_semana = ? FOR UPDATE",
        [day],
      );
    }
    if (!rows.length)
      throw new AppError(
        409,
        "AGENDA_NOT_CONFIGURED",
        "Configura primero los siete días de la agenda.",
      );
  }
}
module.exports = { transaction, lockDays };
