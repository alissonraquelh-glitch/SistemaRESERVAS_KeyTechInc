const LogAuditoria = require("../models/LogAuditoria");
module.exports = function audit(
  connection,
  user,
  accion,
  entidad,
  id,
  detalle,
) {
  return LogAuditoria.create(
    {
      id_empleado: user.id_usuario,
      accion,
      entidad,
      id_entidad: String(id),
      detalle,
    },
    connection,
  );
};
