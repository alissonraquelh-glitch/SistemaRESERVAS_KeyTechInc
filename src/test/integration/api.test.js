const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const importSql = require("../helpers/importSql");

const database = process.env.TEST_DB_NAME;
describe("API V6 con MySQL real", { skip: !database }, () => {
  let adminConnection, pool, app, admin, jefe, csrf, jefeCsrf, date, employeeId;
  before(async () => {
    if (!/^bookit_v6_[a-z0-9_]*test$/.test(database))
      throw new Error("Usa una base desechable bookit_v6_*test.");
    Object.assign(process.env, {
      DB_HOST: process.env.TEST_DB_HOST || "127.0.0.1",
      DB_PORT: process.env.TEST_DB_PORT || "33077",
      DB_USER: process.env.TEST_DB_USER || "root",
      DB_PASSWORD: process.env.TEST_DB_PASSWORD || "",
      DB_NAME: database,
      SESSION_SECRET: "integration-test-secret-32-characters-long",
      APP_ORIGINS: "http://localhost:5173",
    });
    adminConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dateStrings: true,
    });
    await adminConnection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await adminConnection.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    await adminConnection.query(`USE \`${database}\``);
    await importSql(
      adminConnection,
      path.resolve(__dirname, "../../../db/DataBase(1).sql"),
    );
    await importSql(
      adminConnection,
      path.resolve(__dirname, "../../../db/migrations/002_v6.sql"),
    );
    await importSql(
      adminConnection,
      path.resolve(__dirname, "../../../db/seed.demo.sql"),
    );
    pool = require("../../config/database");
    app = require("../../app").app;
    const Empleado = require("../../models/Empleado");
    const hash = await bcrypt.hash("Test-password-123", 4);
    const employee = await Empleado.create({
      nombre_completo: "Admin Test",
      telefono: "70000000",
      correo: "admin@example.test",
      contrasena_hash: hash,
      rol: "ADMIN",
    });
    employeeId = employee.id_usuario;
    await Empleado.create({
      nombre_completo: "Jefe Test",
      telefono: "70000001",
      correo: "jefe@example.test",
      contrasena_hash: hash,
      rol: "JEFE_TALLER",
    });
    await pool.execute(
      "UPDATE configuracion_agenda SET activo=TRUE,hora_apertura='08:00',hora_cierre='18:00',duracion_bloque_min=120,capacidad_maxima=3",
    );
    const { today, nextDay } = require("../../lib/agenda");
    date = nextDay(nextDay(nextDay(today())));
    admin = request.agent(app);
    jefe = request.agent(app);
    const logged = await admin
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ correo: "admin@example.test", password: "Test-password-123" })
      .expect(200);
    csrf = logged.body.data.csrf;
    const jefeLogged = await jefe
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ correo: "jefe@example.test", password: "Test-password-123" })
      .expect(200);
    jefeCsrf = jefeLogged.body.data.csrf;
  });
  after(async () => {
    if (pool) await pool.end();
    if (adminConnection) await adminConnection.end();
  });
  const body = (index, start = "08:00", end = "10:00") => ({
    cliente: {
      nombre_completo: `Cliente ${index}`,
      documento_identidad: `TEST-${index}`,
      telefono: "70000000",
    },
    vehiculo: {
      placa: `TEST${index}`,
      marca: "Alfa Romeo",
      modelo: "Giulia",
      tipo: "GENERAL",
    },
    cita: {
      inicio: `${date} ${start}:00`,
      fin: `${date} ${end}:00`,
      servicio_codigo: "MECANICA_GENERAL",
      notas: null,
    },
  });
  const post = (url, payload) =>
    admin
      .post(url)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send(payload);
  const put = (url, payload) =>
    admin
      .put(url)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send(payload);
  const patch = (id, estado) =>
    admin
      .patch(`/api/citas/${id}/estado`)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send({ estado });
  let firstId, secondId, thirdId;
  test("autenticación, permisos, CSRF y catálogo", async () => {
    await request(app).get("/api/citas").expect(401);
    await jefe.get("/api/configuracion-agenda").expect(403);
    await jefe.get("/api/taller/tablero").expect(200);
    await admin
      .post("/api/citas/manuales")
      .set("Origin", "http://localhost:5173")
      .send(body(1))
      .expect(403);
    await admin
      .post("/api/citas/manuales")
      .set("Origin", "https://otro.example")
      .set("X-CSRF-Token", csrf)
      .send(body(1))
      .expect(403);
    const me = await admin.get("/api/auth/me").expect(200);
    assert.equal(me.body.data.usuario.contrasena_hash, undefined);
    const catalog = await request(app).get("/api/servicios").expect(200);
    assert.equal(catalog.body.data.length, 5);
  });
  test("tres citas admitidas; cuarto y sus maestros se revierten", async () => {
    for (const i of [1, 2, 3]) {
      const r = await post("/api/citas/manuales", body(i)).expect(201);
      if (i === 1) firstId = r.body.data.id_cita;
      if (i === 2) secondId = r.body.data.id_cita;
      if (i === 3) thirdId = r.body.data.id_cita;
    }
    await post("/api/citas/manuales", body(4)).expect(409);
    const [[row]] = await pool.execute(
      "SELECT COUNT(*) total FROM cliente WHERE documento_identidad='TEST-4'",
    );
    assert.equal(row.total, 0);
    const [[vehicle]] = await pool.execute(
      "SELECT COUNT(*) total FROM vehiculo WHERE placa='TEST4'",
    );
    assert.equal(vehicle.total, 0);
    const availability = await request(app)
      .get("/api/public/disponibilidad")
      .query({ fecha: date })
      .expect(200);
    assert.equal(availability.body.data.intervalos[0].disponibles, 0);
    assert.doesNotMatch(
      JSON.stringify(availability.body),
      /nombre_completo|documento_identidad|telefono|TEST-1/,
    );
  });
  test("editar sin mover y fallo de reprogramación son atómicos", async () => {
    await put(`/api/citas/${firstId}`, body(1)).expect(200);
    const r = await post(
      "/api/citas/manuales",
      body(5, "10:00", "12:00"),
    ).expect(201);
    const changed = body(5);
    changed.cliente.nombre_completo = "No debe guardarse";
    await put(`/api/citas/${r.body.data.id_cita}`, changed).expect(409);
    const detail = await admin
      .get(`/api/citas/${r.body.data.id_cita}`)
      .expect(200);
    assert.equal(detail.body.data.inicio, `${date} 10:00:00`);
    assert.equal(detail.body.data.nombre_completo, "Cliente 5");
  });
  test("último cupo concurrente: solo una llamada confirma", async () => {
    await patch(firstId, "COMPLETADA").expect(200);
    const results = await Promise.all([
      post("/api/citas/manuales", body(6)),
      post("/api/citas/manuales", body(7)),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    await patch(firstId, "PENDIENTE").expect(409);
    await patch(secondId, "CANCELADA").expect(200);
    await patch(firstId, "PENDIENTE").expect(200);
  });
  test("estados detallados se reflejan en resumen y tablero", async () => {
    await patch(firstId, "EN_DIAGNOSTICO").expect(200);
    await patch(thirdId, "EN_REPARACION").expect(200);
    const summary = await admin
      .get("/api/citas/resumen")
      .query({ fecha: date })
      .expect(200);
    assert.ok(summary.body.data.en_taller >= 2);
    const board = await jefe
      .get("/api/taller/tablero")
      .query({ fecha: date })
      .expect(200);
    assert.ok(
      board.body.data.columnas
        .find((c) => c.estado === "EN_REPARACION")
        .data.some((c) => c.id_cita === thirdId),
    );
    await jefe
      .patch(`/api/citas/${thirdId}/estado`)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", jefeCsrf)
      .send({ estado: "CANCELADA" })
      .expect(403);
  });
  test("cierres y cambios de configuración respetan citas activas", async () => {
    await post("/api/bloqueos", { fecha: date, motivo: "Cierre" }).expect(409);
    const days = (await admin.get("/api/configuracion-agenda")).body.data.map(
      ({
        dia_semana,
        hora_apertura,
        hora_cierre,
        duracion_bloque_min,
        capacidad_maxima,
        activo,
      }) => ({
        dia_semana,
        hora_apertura,
        hora_cierre,
        duracion_bloque_min,
        capacidad_maxima,
        activo,
      }),
    );
    const reduced = days.map((d) => ({ ...d, capacidad_maxima: 1 }));
    await put("/api/configuracion-agenda", { dias: reduced }).expect(409);
    const { nextDay } = require("../../lib/agenda");
    const closedDate = nextDay(date);
    const closure = await post("/api/bloqueos", {
      fecha: closedDate,
      motivo: "Mantenimiento",
    }).expect(201);
    const availability = await request(app)
      .get("/api/public/disponibilidad")
      .query({ fecha: closedDate })
      .expect(200);
    assert.equal(availability.body.data.cerrado, true);
    const blocked = body(8);
    blocked.cita.inicio = `${closedDate} 08:00:00`;
    blocked.cita.fin = `${closedDate} 10:00:00`;
    await post("/api/citas/manuales", blocked).expect(409);
    await admin
      .delete(`/api/bloqueos/${closure.body.data.id_bloqueo}`)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send({})
      .expect(200);
  });
  test("datos compartidos, conflictos de propietario y auditoría", async () => {
    const update = body(1);
    update.cliente.nombre_completo = "Nombre actualizado";
    await put(`/api/citas/${firstId}`, update).expect(200);
    const another = body(9, "12:00", "14:00");
    another.vehiculo.placa = "TEST1";
    await post("/api/citas/manuales", another).expect(409);
    const logs = await admin.get("/api/auditoria").expect(200);
    assert.ok(logs.body.pagination.total > 0);
    assert.ok(logs.body.data.some((l) => l.accion === "EDITAR_CITA"));
    await assert.rejects(
      pool.execute("UPDATE log_auditoria SET accion='X' WHERE id_log=1"),
      { code: "ER_SIGNAL_EXCEPTION" },
    );
    const secondAgent = request.agent(app);
    await secondAgent
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ correo: "admin@example.test", password: "Test-password-123" })
      .expect(200);
    const read = await secondAgent.get(`/api/citas/${firstId}`).expect(200);
    assert.equal(read.body.data.nombre_completo, "Nombre actualizado");
  });
  test("no se aceptan autores ni servicios elegidos fuera del contrato", async () => {
    const injected = body(15, "14:00", "16:00");
    injected.cita.creada_por = employeeId;
    await post("/api/citas/manuales", injected).expect(400);
    const unknown = body(16, "14:00", "16:00");
    unknown.cita.servicio_codigo = "INVENTADO";
    await post("/api/citas/manuales", unknown).expect(400);
    const query = await admin
      .get("/api/citas")
      .query({ q: "%", limit: 1 })
      .expect(200);
    assert.equal(query.body.pagination.total, 0);
    await admin.get("/api/citas").query({ limit: 101 }).expect(400);
  });
  test("un cierre concurrente y una reserva no se confirman ambos", async () => {
    const { nextDay } = require("../../lib/agenda");
    const raceDate = nextDay(nextDay(date));
    const appointment = body(17, "14:00", "16:00");
    appointment.cita.inicio = `${raceDate} 14:00:00`;
    appointment.cita.fin = `${raceDate} 16:00:00`;
    const results = await Promise.all([
      post("/api/citas/manuales", appointment),
      post("/api/bloqueos", { fecha: raceDate, motivo: "Cierre concurrente" }),
    ]);
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    assert.equal(results.filter((r) => r.status === 409).length, 1);
  });
  test("cambiar capacidad concurrentemente no sobrevende el intervalo", async () => {
    const { nextDay, weekday, peakOccupancy } = require("../../lib/agenda");
    let raceDate = date;
    for (let i = 0; i < 3; i++) raceDate = nextDay(raceDate);
    // Este día no coincide con el lunes del seed ni con las citas de la prueba principal.
    while (
      [1, weekday(date), weekday(nextDay(nextDay(date)))].includes(
        weekday(raceDate),
      )
    )
      raceDate = nextDay(raceDate);
    const a = body(18, "12:00", "14:00");
    a.cita.inicio = `${raceDate} 12:00:00`;
    a.cita.fin = `${raceDate} 14:00:00`;
    await post("/api/citas/manuales", a).expect(201);
    const days = (await admin.get("/api/configuracion-agenda")).body.data.map(
      ({
        dia_semana,
        hora_apertura,
        hora_cierre,
        duracion_bloque_min,
        capacidad_maxima,
        activo,
      }) => ({
        dia_semana,
        hora_apertura,
        hora_cierre,
        duracion_bloque_min,
        capacidad_maxima:
          dia_semana === weekday(raceDate) ? 1 : capacidad_maxima,
        activo,
      }),
    );
    const b = body(19, "12:00", "14:00");
    b.cita.inicio = a.cita.inicio;
    b.cita.fin = a.cita.fin;
    const results = await Promise.all([
      put("/api/configuracion-agenda", { dias: days }),
      post("/api/citas/manuales", b),
    ]);
    assert.equal(
      results.filter((r) => r.status >= 200 && r.status < 300).length,
      1,
    );
    assert.equal(results.filter((r) => r.status === 409).length, 1);
    const [[configuration]] = await pool.execute(
      "SELECT capacidad_maxima FROM configuracion_agenda WHERE dia_semana=?",
      [weekday(raceDate)],
    );
    const [rows] = await pool.execute(
      "SELECT * FROM cita WHERE inicio>=? AND inicio<?",
      [`${raceDate} 00:00:00`, `${nextDay(raceDate)} 00:00:00`],
    );
    assert.ok(
      peakOccupancy(rows, a.cita.inicio, a.cita.fin) <=
        configuration.capacidad_maxima,
    );
  });
  test("migración desde columnas antiguas conserva la historia sin inventar servicio", async () => {
    const fs = require("node:fs/promises");
    const legacy = database.replace(/test$/, "legacy_test");
    if (!/^bookit_v6_[a-z0-9_]*test$/.test(legacy))
      throw new Error("Nombre de base no permitido.");
    let schema = await fs.readFile(
      path.resolve(__dirname, "../../../db/DataBase(1).sql"),
      "utf8",
    );
    schema = schema
      .slice(0, schema.indexOf("-- Rutinas V6"))
      .replace(/^.*servicio_codigo VARCHAR\(50\).*\r?\n/m, "")
      .replace(/^.*capacidad_maxima\s+SMALLINT.*\r?\n/m, "")
      .replace(/^.*CONSTRAINT ck_config_capacidad.*\r?\n/m, "")
      .replace(/,\s*\)/g, ")")
      .replace(
        "ENUM('PENDIENTE', 'EN_DIAGNOSTICO', 'EN_REPARACION', 'COMPLETADA', 'CANCELADA')",
        "ENUM('PENDIENTE', 'COMPLETADA', 'CANCELADA')",
      )
      .replace(/(notas\s+TEXT[^\n]*\n\s*)creado_en/, "$1creada_en");
    await adminConnection.query(
      `CREATE DATABASE \`${legacy}\` CHARACTER SET utf8mb4`,
    );
    try {
      await adminConnection.query(`USE \`${legacy}\``);
      // El importador utiliza el mismo formato SQL que el esquema y las rutinas.
      const temporary = path.resolve(
        __dirname,
        `../../../.test-runtime/${legacy}.sql`,
      );
      await fs.mkdir(path.dirname(temporary), { recursive: true });
      await fs.writeFile(temporary, schema);
      await importSql(adminConnection, temporary);
      await adminConnection.query(
        "INSERT INTO usuario(id_usuario,tipo,nombre_completo,telefono) VALUES('legacy-client','CLIENTE','Historia','70000000')",
      );
      await adminConnection.query(
        "INSERT INTO cliente(id_usuario,documento_identidad) VALUES('legacy-client','HISTORIA')",
      );
      await adminConnection.query(
        "INSERT INTO vehiculo(placa,id_cliente) VALUES('LEGACY','legacy-client')",
      );
      await adminConnection.query(
        "INSERT INTO cita(id_cita,placa,inicio,fin) VALUES('legacy-cita','LEGACY','2026-01-01 08:00:00','2026-01-01 10:00:00')",
      );
      await importSql(
        adminConnection,
        path.resolve(__dirname, "../../../db/migrations/002_v6.sql"),
      );
      const [[row]] = await adminConnection.query(
        "SELECT id_cita,servicio_codigo,creado_en FROM cita WHERE id_cita='legacy-cita'",
      );
      assert.equal(row.servicio_codigo, null);
      assert.ok(row.creado_en);
      const [columns] = await adminConnection.query(
        "SHOW COLUMNS FROM configuracion_agenda LIKE 'capacidad_maxima'",
      );
      assert.equal(columns.length, 1);
    } finally {
      await adminConnection.query(`USE \`${database}\``);
      await adminConnection.query(`DROP DATABASE \`${legacy}\``);
    }
  });
  test("público desde mañana, sesión inactiva y vencida", async () => {
    const { today } = require("../../lib/agenda");
    await request(app)
      .get("/api/public/disponibilidad")
      .query({ fecha: today() })
      .expect(400);
    await pool.execute("UPDATE usuario SET activo=FALSE WHERE id_usuario=?", [
      employeeId,
    ]);
    await admin.get("/api/auth/me").expect(401);
    await pool.execute("UPDATE usuario SET activo=TRUE WHERE id_usuario=?", [
      employeeId,
    ]);
    await admin
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ correo: "admin@example.test", password: "Test-password-123" })
      .expect(200);
    const original = Date.now;
    try {
      Date.now = () => original() + 9 * 3600000;
      await admin.get("/api/auth/me").expect(401);
    } finally {
      Date.now = original;
    }
  });
});
