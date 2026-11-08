const BaseModel = require('./BaseModel');

class LogAuditoria extends BaseModel {
  static table = 'log_auditoria';
  static primaryKey = 'id_log';
  static columns = ['id_log', 'ocurrio_en', 'id_empleado', 'accion', 'entidad', 'id_entidad', 'detalle'];
  static createFields = ['id_empleado', 'accion', 'entidad', 'id_entidad', 'detalle'];
  static updateFields = [];

  static async create(data) {
    const values = { ...data };
    if (values.detalle && typeof values.detalle !== 'string') {
      values.detalle = JSON.stringify(values.detalle);
    }
    return super.create(values);
  }

  static async update() {
    throw new Error('La auditoría es de solo inserción.');
  }

  static async delete() {
    throw new Error('La auditoría es de solo inserción.');
  }
}

module.exports = LogAuditoria;