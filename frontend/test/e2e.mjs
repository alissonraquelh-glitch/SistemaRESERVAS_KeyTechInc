import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.E2E_BASE_URL;
if (
  !baseURL ||
  !process.env.E2E_EMAIL ||
  !process.env.E2E_PASSWORD ||
  process.env.E2E_ALLOW_WRITES !== "1"
) {
  throw new Error(
    "Configura E2E_BASE_URL, E2E_EMAIL, E2E_PASSWORD y E2E_ALLOW_WRITES=1 para una base de pruebas.",
  );
}
const browser = await chromium.launch({
  channel: process.env.E2E_BROWSER_CHANNEL || "msedge",
  headless: true,
});
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const pageErrors = [],
  publicWrites = [],
  publicReads = [];
let publicPhase = true;
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (req) => {
  if (publicPhase && req.url().includes("/api/")) {
    if (req.method() !== "GET") publicWrites.push(req.url());
    else publicReads.push(new URL(req.url()).pathname);
  }
});
const response = (path, method) =>
  page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === path && r.request().method() === method,
  );
const wait = async (predicate, label) => {
  for (let i = 0; i < 80; i++) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("No se cumplió: " + label);
};
try {
  const availability = response("/api/public/disponibilidad", "GET");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await availability;
  await page
    .getByRole("heading", { name: "Consulta y Reserva de Horarios" })
    .waitFor();
  await page
    .getByRole("button", { name: /Consultar por WhatsApp el horario/ })
    .first()
    .click();
  await page.getByRole("dialog").waitFor();
  await page.evaluate(() => {
    window.__draftLinks = [];
    window.open = (url) => {
      window.__draftLinks.push(url);
      return null;
    };
  });
  await page
    .getByRole("button", { name: "Continuar sin completar mis datos" })
    .click();
  assert.equal(await page.evaluate(() => window.__draftLinks.length), 1);
  assert.deepEqual(publicWrites, []);
  assert.ok(
    !publicReads.some((p) =>
      /^\/api\/(citas|clientes|vehiculos|taller|auditoria)/.test(p),
    ),
  );
  publicPhase = false;
  await page.getByRole("button", { name: "Acceso para empleados" }).click();
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(process.env.E2E_EMAIL);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.E2E_PASSWORD);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page.waitForURL("**/personal");
  await page.getByRole("button", { name: "Secretaría", exact: true }).click();
  await page.getByRole("button", { name: "Registrar Cita Manual" }).click();
  const dialog = page.getByRole("dialog");
  const suffix = Date.now().toString().slice(-8),
    plate = "UI" + suffix;
  await dialog
    .getByLabel("Nombre completo *", { exact: true })
    .fill("Cliente Navegador");
  await dialog
    .getByLabel("Documento de identidad *", { exact: true })
    .fill("UI-" + suffix);
  await dialog.getByLabel("Teléfono *", { exact: true }).fill("+503 7000-0000");
  await dialog.getByLabel("Placa *", { exact: true }).fill(plate);
  await dialog.getByLabel("Marca *", { exact: true }).fill("Alfa Romeo");
  await dialog.getByLabel("Modelo *", { exact: true }).fill("Giulia");
  await dialog
    .getByLabel("Servicio *", { exact: true })
    .selectOption("MECANICA_GENERAL");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const future = new Date(today + "T12:00:00Z");
  future.setUTCDate(future.getUTCDate() + 30);
  const date = future.toISOString().slice(0, 10);
  const internalAvailability = response("/api/agenda/disponibilidad", "GET");
  await dialog.getByLabel("Fecha *", { exact: true }).fill(date);
  await internalAvailability;
  await wait(
    () =>
      dialog.getByRole("button", { name: "Confirmar registro" }).isEnabled(),
    "intervalo disponible",
  );
  const created = response("/api/citas/manuales", "POST");
  await dialog.getByRole("button", { name: "Confirmar registro" }).click();
  assert.equal((await created).status(), 201);
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("textbox", { name: "Buscar citas" }).fill(plate);
  const row = page.getByRole("row").filter({ hasText: plate });
  await row.waitFor();
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await dialog
    .getByLabel("Nombre completo *", { exact: true })
    .fill("Cliente Navegador Editado");
  const edited = page.waitForResponse(
    (r) =>
      /\/api\/citas\/[^/]+$/.test(new URL(r.url()).pathname) &&
      r.request().method() === "PUT",
  );
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  assert.equal((await edited).status(), 200);
  await dialog.waitFor({ state: "hidden" });
  await wait(
    () =>
      row.getByText("Cliente Navegador Editado", { exact: true }).isVisible(),
    "edición persistida",
  );
  const changed = page.waitForResponse(
    (r) => r.url().includes("/estado") && r.request().method() === "PATCH",
  );
  await row.getByRole("combobox").selectOption("EN_TALLER");
  assert.equal((await changed).status(), 200);
  await page
    .getByRole("button", { name: "Jefe de Taller", exact: true })
    .click();
  const card = page.locator("div.bg-white.p-5").filter({ hasText: plate });
  await card.waitFor();
  const moved = page.waitForResponse(
    (r) => r.url().includes("/estado") && r.request().method() === "PATCH",
  );
  await card.getByRole("button", { name: "Sig.", exact: true }).click();
  assert.equal((await moved).status(), 200);
  const persisted = await context.request.get("/api/citas", {
    params: { q: plate },
  });
  assert.equal((await persisted.json()).data[0].estado, "EN_REPARACION");
  await page.reload();
  await page
    .getByRole("button", { name: "Jefe de Taller", exact: true })
    .click();
  await card.waitFor();
  const finished = page.waitForResponse(
    (r) => r.url().includes("/estado") && r.request().method() === "PATCH",
  );
  await card.getByRole("button", { name: "Finalizar", exact: true }).click();
  assert.equal((await finished).status(), 200);
  await page
    .getByRole("button", { name: "Administración", exact: true })
    .click();
  const savedWeek = response("/api/configuracion-agenda", "PUT");
  await page.getByRole("button", { name: "Guardar semana" }).click();
  assert.equal((await savedWeek).status(), 200);
  future.setUTCDate(future.getUTCDate() + 3);
  const closedDate = future.toISOString().slice(0, 10);
  await page.getByLabel("Fecha", { exact: true }).fill(closedDate);
  await page
    .getByLabel("Motivo público", { exact: true })
    .fill("Cierre navegador " + suffix);
  const closure = response("/api/bloqueos", "POST");
  await page.getByRole("button", { name: "Cerrar fecha" }).click();
  assert.equal((await closure).status(), 201);
  const closureRow = page
    .locator("div.p-4.bg-gray-50")
    .filter({ hasText: "Cierre navegador " + suffix });
  await closureRow.waitFor();
  const removed = page.waitForResponse(
    (r) =>
      r.url().includes("/api/bloqueos/") && r.request().method() === "DELETE",
  );
  await closureRow.getByRole("button", { name: "Retirar cierre" }).click();
  assert.equal((await removed).status(), 200);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/personal.png", fullPage: true });
  await page.getByTitle("Cerrar sesión").click();
  await page.waitForURL(baseURL.replace(/\/$/, "") + "/");
  await page.goto("/personal");
  await page.waitForURL(baseURL.replace(/\/$/, "") + "/");
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Cerrar modal" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/public-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    "sin desbordamiento horizontal en móvil",
  );
  assert.deepEqual(pageErrors, []);
  console.log(
    "E2E_OK: público sin datos privados/escrituras, login, alta, edición, Kanban, recarga, semana, cierres, auditoría, logout y móvil.",
  );
} catch (error) {
  console.error("Errores React:", pageErrors);
  console.error("URL al fallar:", page.url());
  console.error((await page.locator("body").innerText()).slice(0, 1800));
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/error.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
