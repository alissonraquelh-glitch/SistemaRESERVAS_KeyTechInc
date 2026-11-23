const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { gzipSync } = require("node:zlib");
const { configuredOrigins } = require("../lib/origins");
const securityHeaders = require("../middleware/securityHeaders");
const { nextDay, today, weekday } = require("../lib/agenda");

// Replace the database before importing the app: these tests never load .env or use MySQL.
const date = nextDay(today());
let appointments = [], closures = [], active = true;
const hash = bcrypt.hashSync("Security-test-password", 4);
const employee = { id_usuario: "test-user", nombre_completo: "Test", correo: "test@example.test", activo: 1, rol: "ADMIN", contrasena_hash: hash };
const configuration = () => ({ id_configuracion: 1, dia_semana: weekday(date), hora_apertura: "08:00:00", hora_cierre: "12:00:00", duracion_bloque_min: 120, capacidad_maxima: 3, activo: active });
const pool = {
  execute: async (sql) => {
    if (sql.includes("configuracion_agenda")) return [[configuration()]];
    if (sql.includes("bloqueo_agenda")) return [closures];
    if (sql.includes("FROM cita WHERE")) return [appointments];
    if (sql.includes("JOIN empleado")) return [[{ ...employee }]];
    if (sql === "SELECT 1") return [[{ ok: 1 }]];
    throw new Error("Unexpected test query");
  },
};
require.cache[require.resolve("../config/database")] = { exports: pool };

function loadApp(production = false, trusted = false) {
  const values = { NODE_ENV: production ? "production" : "test", SESSION_SECRET: "security-test-only-secret-at-least-32-characters", APP_ORIGINS: production ? "https://taller.example" : "http://localhost:5173", TRUST_PROXY: trusted ? "1" : "0" };
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    for (const path of ["../app", "../routes/apiRoutes", "../middleware/session"])
      delete require.cache[require.resolve(path)];
    return require("../app").app;
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
const credentials = { correo: employee.correo, password: "Security-test-password" };
function assertPrivateFieldsAbsent(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!["capacidad", "capacidad_maxima", "ocupados", "disponibles", "id_configuracion"].includes(key), key);
    assertPrivateFieldsAbsent(child);
  }
}

test("production requires explicit HTTPS origins; development keeps HTTP", () => {
  assert.deepEqual(configuredOrigins({}), ["http://localhost:5173", "http://localhost:3000"]);
  assert.deepEqual(configuredOrigins({ NODE_ENV: "production", APP_ORIGINS: "https://a.example, https://b.example:8443" }), ["https://a.example", "https://b.example:8443"]);
  for (const origin of [undefined, "", "http://a.example", "https://a.example/", "https://a.example/path", "https://user:pass@a.example", "https://a.example,", "*", "https://a.example?x=1"])
    assert.throws(() => configuredOrigins({ NODE_ENV: "production", APP_ORIGINS: origin }), /APP_ORIGINS/);
});

test("headers cover API success, parser errors, unauthorized and missing routes", async () => {
  const app = loadApp();
  for (const url of ["/api/health", "/health", "/api/servicios", "/api/citas", "/api/missing"]) {
    const result = await request(app).get(url);
    assert.equal(result.headers["x-frame-options"], "DENY");
    assert.equal(result.headers["x-content-type-options"], "nosniff");
    assert.equal(result.headers["referrer-policy"], "no-referrer");
    assert.match(result.headers["content-security-policy"], /default-src 'none'/);
    assert.equal(result.headers["strict-transport-security"], undefined);
    assert.equal(result.headers["x-powered-by"], undefined);
  }
  const invalid = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{").expect(400);
  assert.equal(invalid.body.code, "INVALID_JSON");
  assert.equal(invalid.headers["x-content-type-options"], "nosniff");
  await request(app).post("/api/auth/login").send({ payload: "x".repeat(65536) }).expect(413);
});

test("public projections hide counts for free, occupied, full and blocked slots", async () => {
  const app = loadApp();
  for (const count of [0, 2, 3, 4]) {
    active = true;
    closures = [];
    appointments = Array.from({ length: count }, (_, i) => ({ id_cita: String(i), inicio: `${date} 08:00:00`, fin: `${date} 10:00:00`, estado: "PENDIENTE" }));
    const result = await request(app).get("/api/public/disponibilidad").query({ fecha: date }).expect(200);
    assertPrivateFieldsAbsent(result.body);
    assert.equal(result.body.data.intervalos[0].estado, count < 3 ? "DISPONIBLE" : "AGOTADO");
    assert.ok(result.body.data.intervalos.every((slot) => ["DISPONIBLE", "AGOTADO"].includes(slot.estado)));
  }
  closures = [{ inicio: `${date} 08:00:00`, fin: `${date} 10:00:00`, motivo: "Cierre público de prueba" }];
  let result = await request(app).get("/api/public/disponibilidad").query({ fecha: date }).expect(200);
  assert.equal(result.body.data.intervalos[0].estado, "AGOTADO");
  assert.equal(result.body.data.intervalos[0].motivo_cierre, closures[0].motivo);
  assertPrivateFieldsAbsent(result.body);
  active = false;
  result = await request(app).get("/api/public/disponibilidad").query({ fecha: date }).expect(200);
  assert.equal(result.body.data.cerrado, true);
  assert.deepEqual(result.body.data.intervalos, []);
  active = true;
  closures = [{ inicio: `${date} 00:00:00`, fin: `${nextDay(date)} 00:00:00`, motivo: "Cierre de día" }];
  result = await request(app).get("/api/public/disponibilidad").query({ fecha: date }).expect(200);
  assert.equal(result.body.data.motivo_cierre, "Cierre de día");
  assert.deepEqual(result.body.data.intervalos, []);
  closures = [];
  appointments = [];
  const agenda = await request(app).get("/api/public/agenda").expect(200);
  assertPrivateFieldsAbsent(agenda.body);
  assert.equal(agenda.body.data[0].duracion_bloque_min, 120);
  await request(app).get("/api/public/disponibilidad").query({ fecha: date, excluir_cita: "123" }).expect(400);
  await request(app).get("/api/public/disponibilidad").query({ fecha: today() }).expect(400);
  await request(app).get("/api/agenda/disponibilidad").query({ fecha: date }).expect(401);
});

test("internal counts, authentication, CSRF, origin, roles and logout remain enforced", async () => {
  const app = loadApp();
  const agent = request.agent(app);
  const logged = await agent.post("/api/auth/login").set("Origin", "http://localhost:5173").send(credentials).expect(200);
  const cookies = logged.headers["set-cookie"].join(";");
  assert.match(cookies, /httponly/i);
  assert.match(cookies, /samesite=lax/i);
  assert.doesNotMatch(cookies, /; secure/i);
  assert.match(cookies, /path=\/api/i);
  const result = await agent.get("/api/agenda/disponibilidad").query({ fecha: date }).expect(200);
  assert.equal(result.body.data.intervalos[0].capacidad_maxima, 3);
  assert.equal(result.body.data.intervalos[0].disponibles, 3);
  assertPrivateFieldsAbsent((await agent.get("/api/public/disponibilidad").query({ fecha: date }).expect(200)).body);
  await agent.get("/api/auth/me").expect(200);
  await agent.post("/api/auth/logout").set("Origin", "http://localhost:5173").send({}).expect(403);
  await agent.post("/api/auth/logout").set("Origin", "https://other.example").set("X-CSRF-Token", logged.body.data.csrf).send({}).expect(403);
  employee.rol = "JEFE_TALLER";
  await agent.get("/api/configuracion-agenda").expect(403);
  employee.rol = "ADMIN";
  await agent.post("/api/auth/logout").set("Origin", "http://localhost:5173").set("X-CSRF-Token", logged.body.data.csrf).send({}).expect(200);
  await agent.get("/api/auth/me").expect(401);
});

test("login rate limit remains active", async () => {
  const app = loadApp();
  for (let i = 0; i < 10; i++)
    await request(app).post("/api/auth/login").set("Origin", "http://localhost:5173").send({ ...credentials, password: "wrong" }).expect(401);
  await request(app).post("/api/auth/login").set("Origin", "http://localhost:5173").send(credentials).expect(429);
});

test("production cookie and HSTS require HTTPS through the trusted proxy", async () => {
  const app = loadApp(true, true);
  const logged = await request(app).post("/api/auth/login").set("X-Forwarded-Proto", "https").set("Origin", "https://taller.example").send(credentials).expect(200);
  const cookies = logged.headers["set-cookie"];
  assert.ok(cookies.every((cookie) => /; secure/i.test(cookie)));
  assert.equal(logged.headers["strict-transport-security"], "max-age=86400");
  const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
  await request(app).get("/api/auth/me").set("X-Forwarded-Proto", "https").set("Cookie", cookie).expect(200);
  await request(app).post("/api/auth/logout").set("X-Forwarded-Proto", "https").set("Cookie", cookie).set("Origin", "https://taller.example").set("X-CSRF-Token", logged.body.data.csrf).send({}).expect(200);
  const http = await request(app).post("/api/auth/login").set("Origin", "https://taller.example").send(credentials);
  assert.equal(http.headers["set-cookie"], undefined);
  assert.equal(http.headers["strict-transport-security"], undefined);
  const untrusted = loadApp(true, false);
  const forged = await request(untrusted).get("/api/servicios").set("X-Forwarded-Proto", "https").expect(200);
  assert.equal(forged.headers["strict-transport-security"], undefined);
});

test("expired sessions are rejected server-side", async () => {
  const app = loadApp();
  const issuer = express();
  issuer.use(cookieSession({ name: "bookit.sid", keys: ["security-test-only-secret-at-least-32-characters"], path: "/api" }));
  issuer.get("/api/expired", (req, res) => {
    req.session = { uid: employee.id_usuario, exp: Date.now() - 1000, csrf: "expired" };
    res.json({ ok: true });
  });
  const issued = await request(issuer).get("/api/expired");
  const cookie = issued.headers["set-cookie"].map((value) => value.split(";")[0]).join("; ");
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
});

test("production document CSP permits bundled resources and Google Fonts", async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(...securityHeaders(true));
  app.get(["/", "/personal", "/assets/test.css"], (req, res) => res.send("test"));
  for (const url of ["/", "/personal", "/assets/test.css"]) {
    const result = await request(app).get(url).set("X-Forwarded-Proto", "https").expect(200);
    const csp = result.headers["content-security-policy"];
    assert.match(csp, /script-src 'self'/);
    assert.match(csp, /style-src 'self' https:\/\/fonts.googleapis.com/);
    assert.match(csp, /font-src 'self' https:\/\/fonts.gstatic.com/);
    assert.match(csp, /connect-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
    assert.equal(result.headers["strict-transport-security"], "max-age=86400");
    assert.equal(result.headers["cross-origin-embedder-policy"], undefined);
  }
});

test("malformed compressed JSON cannot crash the parser process", async () => {
  const app = loadApp();
  const valid = gzipSync(Buffer.from(JSON.stringify(credentials)));
  await request(app).post("/api/auth/login").set("Origin", "http://localhost:5173").set("Content-Type", "application/json").set("Content-Encoding", "gzip").serialize(() => valid).send({}).expect(200);
  const payload = Buffer.concat([gzipSync(Buffer.from('{}')), Buffer.from('trailing-invalid-gzip')]);
  const result = await request(app).post("/api/auth/login").set("Origin", "http://localhost:5173").set("Content-Type", "application/json").set("Content-Encoding", "gzip").serialize(() => payload).send({});
  assert.ok(result.status >= 400 && result.status < 500);
  // Allow late decompression events to run before checking that the server still responds.
  await new Promise((resolve) => setImmediate(resolve));
  await request(app).get("/api/servicios").expect(200);
});

test("OpenAPI separates public and internal contracts and resolves every schema reference", async () => {
  const api = require("../openapi.json");
  function inspect(value) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) {
      const target = value.$ref.slice(2).split("/").reduce((node, key) => node?.[key], api);
      assert.ok(target, value.$ref);
    }
    Object.values(value).forEach(inspect);
  }
  inspect(api);
  const schema = (route) => api.paths[route].get.responses['200'].content['application/json'].schema.properties.data;
  assert.equal(schema('/public/disponibilidad').$ref, '#/components/schemas/DisponibilidadPublica');
  assert.equal(schema('/agenda/disponibilidad').$ref, '#/components/schemas/Disponibilidad');
  const app = loadApp();
  for (const [route, name] of [['/api/public/agenda','DiaPublico'], ['/api/public/disponibilidad','IntervaloPublico']]) {
    const result = await request(app).get(route).query({ fecha: date }).expect(200);
    const entries = Array.isArray(result.body.data) ? result.body.data : result.body.data.intervalos;
    const contract = api.components.schemas[name];
    assert.equal(contract.additionalProperties, false);
    for (const entry of entries) {
      for (const key of Object.keys(entry)) assert.ok(key in contract.properties, key);
      for (const key of contract.required) assert.ok(key in entry, key);
    }
  }
});
