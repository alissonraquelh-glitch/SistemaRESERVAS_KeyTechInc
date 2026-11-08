const BaseModel = require('./BaseModel');

class ConfiguracionAgenda extends BaseModel {
  static table = 'configuracion_agenda';
  static primaryKey = 'id_configuracion';
  static columns = ['id_configuracion', 'dia_semana', 'hora_apertura', 'hora_cierre', 'duracion_bloque_min', 'activo'];
  static createFields = ['dia_semana', 'hora_apertura', 'hora_cierre', 'duracion_bloque_min', 'activo'];
  static updateFields = this.createFields;
}

module.exports = ConfiguracionAgenda;