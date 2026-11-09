const express = require("express");
const { requireAuth, requireRoles, login } = require("../middleware/session");
const pool = require("../config/database");
const services = require("../config/services");
const reads = require("../services/agendaReadService");
const bookings = require("../services/agendamientoService");
const admin = require("../services/adminService");
const Cliente = require("../models/Cliente");
const Vehiculo = require("../models/Vehiculo");
const { transaction } = require("../lib/transaction");
const audit = require("../services/auditoriaService");
const v = require("../lib/validation");
const { AppError } = require("../lib/errors");
const router = express.Router();
const data = (action) => async (req, res) =>
  res.json({ data: await action(req) });
const created = (action) => async (req, res) =>
  res.status(201).json({ data: await action(req) });

router.post("/auth/login", login);
router.get("/servicios", (req, res) => res.json({ data: services }));
router.get(
  "/public/agenda",
  data(() => reads.configurations()),
);
router.get(
  "/public/disponibilidad",
  data((req) => reads.availability(req.query)),
);
router.use(requireAuth);
router.get(
  "/auth/me",
  data((req) => ({ usuario: req.user, csrf: req.session.csrf })),
);
router.post("/auth/logout", (req, res) => {
  req.session = null;
  res.json({ data: { cerrada: true } });
});
router.get(
  "/agenda/disponibilidad",
  data((req) => reads.availability(req.query, true)),
);
router.get(
  "/citas/resumen",
  requireRoles(),
  data((req) => reads.summary(req.query)),
);
router.get("/citas", async (req, res) => res.json(await reads.list(req.query)));
router.get(
  "/citas/:id",
  data((req) => reads.detail(req.params.id)),
);
router.post(
  "/citas/manuales",
  requireRoles(),
  created((req) => bookings.manual(req.body, req.user)),
);
router.post(
  "/citas",
  requireRoles(),
  created((req) => bookings.existing(req.body, req.user)),
);
router.put(
  "/citas/:id",
  data((req) => bookings.update(req.params.id, req.body, req.user)),
);
router.patch(
  "/citas/:id/estado",
  data((req) => bookings.changeStatus(req.params.id, req.body, req.user)),
);
router.get(
  "/taller/tablero",
  data((req) => reads.board(req.query)),
);
router.get(
  "/configuracion-agenda",
  requireRoles(),
  data(() => reads.configurations()),
);
router.put(
  "/configuracion-agenda",
  requireRoles(),
  data((req) => admin.updateConfig(req.body, req.user)),
);
router.get(
  "/bloqueos",
  requireRoles(),
  data(() => admin.listClosures()),
);
router.post(
  "/bloqueos",
  requireRoles(),
  created((req) => admin.createClosure(req.body, req.user)),
);
router.delete(
  "/bloqueos/:id",
  requireRoles(),
  data((req) => admin.removeClosure(req.params.id, req.user)),
);
router.get("/auditoria", requireRoles(), async (req, res) =>
  res.json(await admin.logs(req.query)),
);

for (const [resource, Model] of [
  ["clientes", Cliente],
  ["vehiculos", Vehiculo],
]) {
  router.get(`/${resource}`, requireRoles(), async (req, res) => {
    const { limit, offset } = v.pagination(req.query);
    const [[count]] = await pool.execute(
      `SELECT COUNT(*) total FROM \`${Model.table}\``,
    );
    const rows =
      resource === "clientes"
        ? (
            await pool.query(
              `SELECT u.id_usuario,u.nombre_completo,u.telefono,u.correo,u.activo,u.creado_en,c.documento_identidad,c.fecha_registro FROM cliente c JOIN usuario u ON u.id_usuario=c.id_usuario ORDER BY c.id_usuario LIMIT ? OFFSET ?`,
              [limit, offset],
            )
          )[0]
        : (
            await pool.query(
              "SELECT * FROM vehiculo ORDER BY placa LIMIT ? OFFSET ?",
              [limit, offset],
            )
          )[0];
    res.json({ data: rows, pagination: { limit, offset, total: count.total } });
  });
  router.get(
    `/${resource}/:id`,
    requireRoles(),
    data(async (req) => {
      const row = await Model.findById(
        resource === "vehiculos" ? v.plate(req.params.id) : req.params.id,
      );
      if (!row) throw new AppError(404, "NOT_FOUND", "El registro no existe.");
      return row;
    }),
  );
  router.post(
    `/${resource}`,
    requireRoles(),
    created((req) =>
      transaction(async (connection) => {
        let input;
        if (resource === "clientes") input = bookings.clientInput(req.body);
        else {
          v.object(req.body, [
            "placa",
            "id_cliente",
            "marca",
            "modelo",
            "tipo",
            "anio",
            "color",
          ]);
          const { id_cliente, ...vehicle } = req.body;
          // Las altas históricas solo exigían placa y cliente; conservar campos opcionales.
          input = {
            placa: v.plate(vehicle.placa),
            id_cliente: v.string(id_cliente, "id_cliente", 36),
          };
          for (const field of ["marca", "modelo", "color"])
            if (vehicle[field] !== undefined)
              input[field] = v.string(
                vehicle[field],
                field,
                field === "color" ? 30 : 50,
                false,
              );
          if (vehicle.tipo !== undefined) {
            if (!["GENERAL", "PESADO"].includes(vehicle.tipo))
              v.invalid("Tipo no válido.");
            input.tipo = vehicle.tipo;
          }
          if (vehicle.anio !== undefined) {
            if (
              vehicle.anio !== null &&
              (!Number.isInteger(vehicle.anio) ||
                vehicle.anio < 1900 ||
                vehicle.anio > 2100)
            )
              v.invalid("Año no válido.");
            input.anio = vehicle.anio;
          }
        }
        const result = await Model.create(input, connection);
        await audit(
          connection,
          req.user,
          "CREAR_REGISTRO",
          Model.table,
          result[Model.primaryKey],
          { despues: result },
        );
        return result;
      }),
    ),
  );
}
module.exports = router;
