const path = require("node:path");
const express = require("express");
const pool = require("./config/database");
const { session, originCheck } = require("./middleware/session");
const { AppError, errorHandler } = require("./lib/errors");
const apiRoutes = require("./routes/apiRoutes");
const app = express();

app.disable("x-powered-by");

if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb" }));

async function health(req, res) {
  try {
    await pool.execute("SELECT 1");
    res.json({ data: { ok: true } });
  } catch {
    res.status(503).json({
      code: "DATABASE_UNAVAILABLE",
      message: "La base de datos no est? disponible.",
    });
  }
}
app.get(["/health", "/api/health"], health);

app.use("/api", session, originCheck, apiRoutes);

if (process.env.NODE_ENV !== "production") {
  app.get("/", (req, res) =>
    res.json({ message: "Backend de Taller Bautista V6" }),
  );
}

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  // Permite recargar las páginas de React sin afectar los errores de la API.
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.use((req, res, next) =>
  next(new AppError(404, "NOT_FOUND", "La ruta no existe.")),
);

app.use(errorHandler);
function start(port = Number(process.env.PORT) || 3000) {
  return app.listen(port, () =>
    console.log("Servidor en http://localhost:" + port),
  );
}
if (require.main === module) start();
module.exports = { app, start };
