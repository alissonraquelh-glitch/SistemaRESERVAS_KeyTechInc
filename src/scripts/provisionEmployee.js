// Recibe JSON por stdin. Nunca acepta la contraseña como argumento ni la imprime.
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const Empleado = require("../models/Empleado");
const { transaction } = require("../lib/transaction");
const { clientInput } = require("../services/agendamientoService");

async function main() {
  let text = "";
  for await (const chunk of process.stdin) {
    text += chunk;
    if (text.length > 10000) throw new Error("Entrada demasiado grande.");
  }
  const input = JSON.parse(text);
  if (!["SECRETARIA", "JEFE_TALLER", "ADMIN", "DUENO"].includes(input.rol))
    throw new Error("Rol no válido.");
  if (
    typeof input.password !== "string" ||
    input.password.length < 8 ||
    Buffer.byteLength(input.password) > 72
  )
    throw new Error(
      "Usa una contraseña de al menos 8 caracteres y hasta 72 bytes.",
    );
  const { documento_identidad, ...user } = clientInput({
    nombre_completo: input.nombre_completo,
    telefono: input.telefono,
    correo: input.correo,
    documento_identidad: "EMPLEADO",
  });
  if (!user.correo) throw new Error("El correo es obligatorio.");
  const hash = await bcrypt.hash(input.password, 12);
  const result = await transaction((connection) =>
    Empleado.create(
      { ...user, rol: input.rol, contrasena_hash: hash },
      connection,
    ),
  );
  console.log(
    JSON.stringify({
      id_usuario: result.id_usuario,
      correo: result.correo,
      rol: result.rol,
    }),
  );
}
main()
  .catch((error) => {
    console.error(
      error.code === "ER_DUP_ENTRY" ? "El correo ya existe." : error.message,
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
