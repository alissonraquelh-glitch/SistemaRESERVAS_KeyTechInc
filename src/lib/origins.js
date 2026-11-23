function configuredOrigins(env = process.env) {
  const production = env.NODE_ENV === "production";
  const origins = (env.APP_ORIGINS || (production ? "" : "http://localhost:5173,http://localhost:3000"))
    .split(",")
    .map((origin) => origin.trim());
  if (production) {
    const valid = origins.every((origin) => {
      try {
        const url = new URL(origin);
        return url.protocol === "https:" && url.origin === origin;
      } catch {
        return false;
      }
    });
    if (!valid)
      throw new Error("Configura APP_ORIGINS con orígenes HTTPS explícitos, separados por comas y sin rutas.");
  }
  return origins;
}

module.exports = { configuredOrigins };
