const { randomUUID } = require("node:crypto");
const pool = require("../config/database");
const Cliente = require("../models/Cliente");
const Vehiculo = require("../models/Vehiculo");
const Cita = require("../models/Cita");
const audit = require("./auditoriaService");
const reads = require("./agendaReadService");
const services = require("../config/services");
const v = require("../lib/validation");
const { AppError } = require("../lib/errors");
const { transaction, lockDays } = require("../lib/transaction");
const { ACTIVE_STATES, STATES, weekday, interval } = require("../lib/agenda");

function citaInput(input, allowPast = false) {
  v.object(input, ["inicio", "fin", "servicio_codigo", "notas"]);
  const times = interval(input, { allowPast });
  if (!services.some((s) => s.codigo === input.servicio_codigo))
    v.invalid("Selecciona un servicio válido.", ["servicio_codigo"]);
  return {
    ...times,
    servicio_codigo: input.servicio_codigo,
    notas: v.string(input.notas, "notas", 10000, false),
  };
}
function clientInput(input) {
  v.object(input, [
    "nombre_completo",
    "documento_identidad",
    "telefono",
    "correo",
  ]);
  const correo = v.string(input.correo, "correo", 254, false);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    v.invalid("Correo no válido.", ["correo"]);
  return {
    nombre_completo: v.string(input.nombre_completo, "nombre_completo", 150),
    telefono: v.string(input.telefono, "telefono", 20),
    documento_identidad: v.string(
      input.documento_identidad,
      "documento_identidad",
      20,
    ),
    ...(input.correo !== undefined
      ? { correo: correo?.toLowerCase() || null }
      : {}),
  };
}
function vehicleInput(input) {
  v.object(input, ["placa", "marca", "modelo", "tipo", "anio", "color"]);
  if (!["GENERAL", "PESADO"].includes(input.tipo))
    v.invalid("Tipo de vehículo no válido.");
  if (
    input.anio != null &&
    (!Number.isInteger(input.anio) || input.anio < 1900 || input.anio > 2100)
  )
    v.invalid("Año no válido.");
  return {
    placa: v.plate(input.placa),
    marca: v.string(input.marca, "marca", 50),
    modelo: v.string(input.modelo, "modelo", 50),
    tipo: input.tipo,
    ...(input.anio !== undefined ? { anio: input.anio } : {}),
    ...(input.color !== undefined
      ? { color: v.string(input.color, "color", 30, false) }
      : {}),
  };
}
async function masters(connection, cliente, vehiculo, currentClientId = null) {
  let existingClient;
  if (currentClientId)
    existingClient = await Cliente.findById(currentClientId, connection);
  else {
    const [[row]] = await connection.execute(
      "SELECT id_usuario FROM cliente WHERE documento_identidad=? FOR UPDATE",
      [cliente.documento_identidad],
    );
    if (row)
      existingClient = await Cliente.findById(row.id_usuario, connection);
  }
  const beforeClient = existingClient;
  const savedClient = existingClient
    ? await Cliente.update(existingClient.id_usuario, cliente, connection)
    : await Cliente.create(cliente, connection);
  const [[existingVehicle]] = await connection.execute(
    "SELECT * FROM vehiculo WHERE placa=? FOR UPDATE",
    [vehiculo.placa],
  );
  if (existingVehicle && existingVehicle.id_cliente !== savedClient.id_usuario)
    throw new AppError(
      409,
      "OWNER_CONFLICT",
      "La placa pertenece a otro cliente. No se cambió su propietario.",
    );
  const savedVehicle = existingVehicle
    ? await Vehiculo.update(
        vehiculo.placa,
        Object.fromEntries(
          Object.entries(vehiculo).filter(([k]) => k !== "placa"),
        ),
        connection,
      )
    : await Vehiculo.create(
        { ...vehiculo, id_cliente: savedClient.id_usuario },
        connection,
      );
  return {
    cliente: savedClient,
    vehiculo: savedVehicle,
    antes: { cliente: beforeClient || null, vehiculo: existingVehicle || null },
  };
}
async function manual(body, user) {
  v.object(body, ["cliente", "vehiculo", "cita"]);
  const cliente = clientInput(body.cliente),
    vehiculo = vehicleInput(body.vehiculo),
    cita = citaInput(body.cita);
  return transaction(async (connection) => {
    await lockDays(connection, [weekday(cita.inicio.slice(0, 10))]);
    const saved = await masters(connection, cliente, vehiculo);
    const created = await Cita.create(
      {
        ...cita,
        id_cita: randomUUID(),
        placa: saved.vehiculo.placa,
        origen: "TELEFONO",
        creada_por: user.id_usuario,
      },
      connection,
    );
    await audit(connection, user, "CREAR_CITA", "cita", created.id_cita, {
      antes: saved.antes,
      despues: { ...saved, cita: created },
    });
    return reads.detail(created.id_cita, connection);
  });
}
async function existing(body, user) {
  v.object(body, ["placa", "inicio", "fin", "servicio_codigo", "notas"]);
  const placa = v.plate(body.placa);
  const { placa: ignored, ...data } = body;
  const cita = citaInput(data);
  return transaction(async (connection) => {
    await lockDays(connection, [weekday(cita.inicio.slice(0, 10))]);
    const created = await Cita.create(
      {
        ...cita,
        placa,
        id_cita: randomUUID(),
        origen: "TELEFONO",
        creada_por: user.id_usuario,
      },
      connection,
    );
    await audit(connection, user, "CREAR_CITA", "cita", created.id_cita, {
      despues: created,
    });
    return reads.detail(created.id_cita, connection);
  });
}
async function mutate(id, user, action) {
  const before = await reads.detail(id);
  return transaction(async (connection) => {
    const days = [
      weekday(before.inicio.slice(0, 10)),
      ...(action.date ? [weekday(action.date)] : []),
    ];
    await lockDays(connection, days);
    const [[locked]] = await connection.execute(
      "SELECT * FROM cita WHERE id_cita=? FOR UPDATE",
      [id],
    );
    if (!locked) throw new AppError(404, "NOT_FOUND", "La cita no existe.");
    if (
      locked.inicio !== before.inicio ||
      locked.fin !== before.fin ||
      locked.estado !== before.estado
    )
      throw new AppError(
        409,
        "CITA_CHANGED",
        "La cita cambió. Actualiza y vuelve a intentar.",
      );
    return action.run(connection, locked, before);
  });
}
async function update(id, body, user) {
  v.object(body, ["cliente", "vehiculo", "cita"]);
  const cliente = clientInput(body.cliente),
    vehiculo = vehicleInput(body.vehiculo),
    cita = citaInput(body.cita, true);
  return mutate(id, user, {
    date: cita.inicio.slice(0, 10),
    run: async (connection, locked, before) => {
      const moved = locked.inicio !== cita.inicio || locked.fin !== cita.fin;
      if (moved) interval(cita);
      if (ACTIVE_STATES.includes(locked.estado) && moved)
        await connection.execute("CALL sp_validar_intervalo_tx(?,?,?)", [
          cita.inicio,
          cita.fin,
          id,
        ]);
      else if (moved && !ACTIVE_STATES.includes(locked.estado))
        throw new AppError(
          409,
          "INACTIVE_APPOINTMENT",
          "Reactiva la cita antes de reprogramarla.",
        );
      const saved = await masters(
        connection,
        cliente,
        vehiculo,
        before.id_cliente,
      );
      await Cita.update(
        id,
        { ...cita, placa: saved.vehiculo.placa },
        connection,
      );
      const after = await reads.detail(id, connection);
      await audit(connection, user, "EDITAR_CITA", "cita", id, {
        antes: { cita: before, ...saved.antes },
        despues: after,
      });
      return after;
    },
  });
}
async function changeStatus(id, body, user) {
  v.object(body, ["estado"]);
  if (!STATES.includes(body.estado)) v.invalid("Estado no válido.");
  if (user.rol === "JEFE_TALLER" && body.estado === "CANCELADA")
    throw new AppError(
      403,
      "FORBIDDEN",
      "Solo recepción o administración pueden cancelar citas.",
    );
  return mutate(id, user, {
    run: async (connection, locked, before) => {
      if (user.rol === "JEFE_TALLER" && locked.estado === "CANCELADA")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Solo recepción o administración pueden reactivar canceladas.",
        );
      if (
        ACTIVE_STATES.includes(body.estado) &&
        !ACTIVE_STATES.includes(locked.estado)
      )
        await connection.execute("CALL sp_validar_intervalo_tx(?,?,?)", [
          locked.inicio,
          locked.fin,
          id,
        ]);
      await Cita.update(id, { estado: body.estado }, connection);
      const after = await reads.detail(id, connection);
      await audit(connection, user, "CAMBIAR_ESTADO", "cita", id, {
        antes: before.estado,
        despues: body.estado,
      });
      return after;
    },
  });
}
module.exports = {
  manual,
  existing,
  update,
  changeStatus,
  clientInput,
  vehicleInput,
};
