import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { access } from "node:fs/promises";
import { chromium } from "playwright";

// Local production build with a simulated database. No credentials, external app or writes.
const backend = createRequire(new URL("../../src/package.json", import.meta.url));
await access(new URL("../dist/index.html", import.meta.url));
process.env.NODE_ENV = "production";
process.env.SESSION_SECRET = "browser-test-only-secret-at-least-32-characters";
process.env.APP_ORIGINS = "https://browser-test.example";
process.env.TRUST_PROXY = "0";
const { today, nextDay } = backend("./lib/agenda");
const date = nextDay(today());
let closed = false;
const pool = {
  execute: async (sql) => {
    if (sql.includes("configuracion_agenda")) return [Array.from({ length: 7 }, (_, dia_semana) => ({ id_configuracion: dia_semana + 1, dia_semana, hora_apertura: "08:00:00", hora_cierre: "16:00:00", duracion_bloque_min: 120, capacidad_maxima: 3, activo: true }))];
    if (sql.includes("bloqueo_agenda")) return [[closed
      ? { inicio: `${date} 00:00:00`, fin: `${nextDay(date)} 00:00:00`, motivo: "Cierre de prueba de día completo" }
      : { inicio: `${date} 12:00:00`, fin: `${date} 14:00:00`, motivo: "Cierre de prueba por mantenimiento" }]];
    if (sql.includes("FROM cita WHERE")) return [[
      ...Array.from({ length: 3 }, (_, i) => ({ id_cita: `full-${i}`, inicio: `${date} 08:00:00`, fin: `${date} 10:00:00`, estado: "PENDIENTE" })),
      ...Array.from({ length: 2 }, (_, i) => ({ id_cita: `partial-${i}`, inicio: `${date} 10:00:00`, fin: `${date} 12:00:00`, estado: "PENDIENTE" })),
    ]];
    if (sql === "SELECT 1") return [[{ ok: 1 }]];
    throw new Error("Unexpected browser fixture query");
  },
};
backend.cache[backend.resolve("./config/database")] = { exports: pool };
const { app } = backend("./app");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || "msedge", headless: true });
  for (const width of [1440, 390]) {
    closed = false;
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    // Keep the run independent of internet access; the CSP still checks these requests.
    await context.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
    await context.route("https://fonts.gstatic.com/**", (route) => route.abort());
    const page = await context.newPage();
    const errors = [], writes = [], violations = [], assetFailures = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (req) => { if (!["GET", "HEAD"].includes(req.method())) writes.push(req.method()); });
    page.on("response", (res) => { if (res.url().startsWith(`${base}/assets/`) && res.status() >= 400) assetFailures.push(res.url()); });
    await page.exposeFunction("recordCspViolation", (directive) => violations.push(directive));
    await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (event) => window.recordCspViolation(event.violatedDirective)));
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    assert.match(response.headers()["content-security-policy"], /script-src 'self'/);
    const full = page.getByRole("button", { name: "Sin cupos para 08:00 - 10:00", exact: true });
    await full.waitFor();
    assert.equal(await full.isDisabled(), true);
    const partial = page.getByRole("button", { name: "Consultar por WhatsApp el horario 10:00 - 12:00", exact: true });
    assert.equal(await partial.isEnabled(), true);
    assert.equal(await page.getByText("Casi lleno", { exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Sin cupos para 12:00 - 14:00", exact: true }).isDisabled(), true);
    await page.getByText("Cierre de prueba por mantenimiento", { exact: true }).waitFor();
    await partial.click();
    await page.getByText("Consultar este horario por WhatsApp", { exact: true }).waitFor();
    await page.reload();
    await full.waitFor();
    const data = await (await context.request.get(`${base}/api/public/disponibilidad?fecha=${date}`)).json();
    assert.doesNotMatch(JSON.stringify(data), /capacidad_maxima|ocupados|disponibles|CASI_LLENO|BLOQUEADO/);
    const agenda = await (await context.request.get(`${base}/api/public/agenda`)).json();
    assert.doesNotMatch(JSON.stringify(agenda), /capacidad_maxima|id_configuracion/);
    closed = true;
    await page.reload();
    await page.getByText("Cierre de prueba de día completo", { exact: true }).waitFor();
    assert.equal((await page.goto(`${base}/personal`)).status(), 200);
    await page.waitForFunction(() => document.getElementById("root").childElementCount > 0);
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(errors, []);
    assert.deepEqual(violations, []);
    assert.deepEqual(assetFailures, []);
    assert.deepEqual(writes, []);
    await context.close();
    console.log(`Public security smoke passed (${width}px): production CSP, states, closures, modal and SPA navigation.`);
  }
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
