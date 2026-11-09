const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  generateSlots,
  peakOccupancy,
  nextDay,
  weekday,
} = require("../lib/agenda");
test("intervalos respetan minutos, mediodía y cierre temprano", () => {
  assert.deepEqual(
    generateSlots({
      activo: true,
      hora_apertura: "08:30",
      hora_cierre: "11:00",
      duracion_bloque_min: 120,
    }),
    [
      ["08:30", "09:00"],
      ["09:00", "11:00"],
    ],
  );
  assert.deepEqual(
    generateSlots({
      activo: true,
      hora_apertura: "11:30",
      hora_cierre: "14:00",
      duracion_bloque_min: 120,
    }),
    [
      ["11:30", "12:00"],
      ["12:00", "14:00"],
    ],
  );
  assert.deepEqual(generateSlots({ activo: false }), []);
});
test("capacidad usa el máximo simultáneo y límites semiabiertos", () => {
  const rows = [
    { id_cita: "1", inicio: "08:00", fin: "09:00", estado: "PENDIENTE" },
    { id_cita: "2", inicio: "09:00", fin: "10:00", estado: "EN_REPARACION" },
    { id_cita: "3", inicio: "08:00", fin: "10:00", estado: "COMPLETADA" },
  ];
  assert.equal(peakOccupancy(rows, "08:00", "10:00"), 1);
  assert.equal(peakOccupancy(rows, "08:00", "09:00", "1"), 0);
});
test("fechas civiles no dependen de la zona del proceso", () => {
  assert.equal(nextDay("2026-12-31"), "2027-01-01");
  assert.equal(weekday("2026-11-08"), 0);
});
