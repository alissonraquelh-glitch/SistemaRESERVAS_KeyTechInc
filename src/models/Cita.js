const BaseModel = require("./BaseModel");

class Cita extends BaseModel {
  static table = "cita";
  static primaryKey = "id_cita";
  static columns = [
    "id_cita",
    "placa",
    "inicio",
    "fin",
    "estado",
    "origen",
    "creada_por",
    "servicio_codigo",
    "notas",
    "creado_en",
  ];
  static createFields = [
    "id_cita",
    "placa",
    "inicio",
    "fin",
    "estado",
    "origen",
    "creada_por",
    "servicio_codigo",
    "notas",
  ];
  static updateFields = [
    "placa",
    "inicio",
    "fin",
    "estado",
    "servicio_codigo",
    "notas",
  ];
  static generatedId = true;

  static async create(data, connection) {
    if (!connection)
      throw new Error("Las citas se registran mediante agendamientoService.");
    const { randomUUID } = require("node:crypto");
    const id = data.id_cita || randomUUID();
    await connection.execute(
      "CALL sp_registrar_cita_tx(?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        data.placa,
        data.inicio,
        data.fin,
        data.origen,
        data.creada_por,
        data.servicio_codigo,
        data.notas ?? null,
      ],
    );
    return this.findById(id, connection);
  }

  static async update(id, data, connection) {
    if (!connection)
      throw new Error("Las citas se modifican mediante agendamientoService.");
    return super.update(id, data, connection);
  }

  static async delete() {
    throw new Error("Las citas se cancelan; no se eliminan.");
  }
}

module.exports = Cita;
