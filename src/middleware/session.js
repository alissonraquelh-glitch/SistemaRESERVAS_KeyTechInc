const { randomBytes, timingSafeEqual } = require("node:crypto");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { AppError } = require("../lib/errors");
const { object, string, invalid } = require("../lib/validation");
const ROLES = ["SECRETARIA", "JEFE_TALLER", "ADMIN", "DUENO"];
const MANAGERS = ["SECRETARIA", "ADMIN", "DUENO"];
const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
)
  throw new Error("Configura SESSION_SECRET con al menos 32 caracteres.");
const secret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const session = cookieSession({
  name: "bookit.sid",
  keys: [secret],
  httpOnly: true,
  sameSite: "lax",
  secure: production,
  maxAge: 8 * 60 * 60 * 1000,
  path: "/api",
});
const permittedOrigins = () =>
  (process.env.APP_ORIGINS || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((s) => s.trim());
function originCheck(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin || !permittedOrigins().includes(origin))
    throw new AppError(
      403,
      "INVALID_ORIGIN",
      "El origen de la solicitud no está permitido.",
    );
  if (!req.is("application/json"))
    throw new AppError(400, "JSON_REQUIRED", "Envía la solicitud como JSON.");
  next();
}
async function loadUser(id) {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario, u.nombre_completo, u.correo, u.activo, e.rol
    FROM usuario u JOIN empleado e ON e.id_usuario=u.id_usuario WHERE u.id_usuario=?`,
    [id],
  );
  return rows[0] ? { ...rows[0], activo: Boolean(rows[0].activo) } : null;
}
async function requireAuth(req, res, next) {
  if (
    !req.session?.uid ||
    !Number.isFinite(req.session.exp) ||
    req.session.exp <= Date.now()
  ) {
    req.session = null;
    throw new AppError(401, "AUTH_REQUIRED", "Inicia sesión para continuar.");
  }
  const user = await loadUser(req.session.uid);
  if (!user?.activo || !ROLES.includes(user.rol)) {
    req.session = null;
    throw new AppError(401, "SESSION_INVALID", "La sesión no es válida.");
  }
  req.user = user;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const supplied = Buffer.from(req.get("x-csrf-token") || "");
    const expected = Buffer.from(req.session.csrf || "");
    if (
      !expected.length ||
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      throw new AppError(
        403,
        "INVALID_CSRF",
        "Actualiza la sesión y vuelve a intentar.",
      );
  }
  next();
}
const requireRoles =
  (roles = MANAGERS) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.rol))
      throw new AppError(
        403,
        "FORBIDDEN",
        "No tienes permiso para esta operación.",
      );
    next();
  };
const attempts = new Map();
async function login(req, res) {
  object(req.body, ["correo", "password"]);
  const correo = string(req.body.correo, "correo", 254).toLowerCase();
  const password = req.body.password;
  if (
    typeof password !== "string" ||
    !password.length ||
    Buffer.byteLength(password) > 72
  )
    invalid("La contraseña no es válida.");
  const key = `${req.ip}:${correo}`;
  const entry = attempts.get(key);
  if (entry && entry.until > Date.now() && entry.count >= 10)
    throw new AppError(
      429,
      "LOGIN_LIMIT",
      "Demasiados intentos. Espera 15 minutos.",
    );
  for (const [k, item] of attempts)
    if (item.until <= Date.now()) attempts.delete(k);
  const [rows] = await pool.execute(
    `SELECT u.id_usuario, u.nombre_completo, u.correo, u.activo, e.rol, e.contrasena_hash
    FROM usuario u JOIN empleado e ON e.id_usuario=u.id_usuario WHERE LOWER(u.correo)=? LIMIT 1`,
    [correo],
  );
  const user = rows[0];
  const matches =
    user && (await bcrypt.compare(password, user.contrasena_hash));
  if (!matches || !user.activo || !ROLES.includes(user.rol)) {
    attempts.set(key, {
      count: entry && entry.until > Date.now() ? entry.count + 1 : 1,
      until: Date.now() + 15 * 60 * 1000,
    });
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Correo o contraseña incorrectos.",
    );
  }
  attempts.delete(key);
  req.session = {
    uid: user.id_usuario,
    exp: Date.now() + 8 * 60 * 60 * 1000,
    csrf: randomBytes(32).toString("hex"),
  };
  delete user.contrasena_hash;
  user.activo = Boolean(user.activo);
  res.json({ data: { usuario: user, csrf: req.session.csrf } });
}
module.exports = {
  session,
  originCheck,
  requireAuth,
  requireRoles,
  login,
  MANAGERS,
  ROLES,
};
