const BaseModel = require('./BaseModel');

class BloqueoAgenda extends BaseModel {
  static table = 'bloqueo_agenda';
  static primaryKey = 'id_bloqueo';
  static columns = ['id_bloqueo', 'inicio', 'fin', 'tipo', 'motivo', 'creado_por', 'creado_en'];
  static createFields = ['id_bloqueo', 'inicio', 'fin', 'tipo', 'motivo', 'creado_por'];
  static updateFields = ['inicio', 'fin', 'tipo', 'motivo'];
  static generatedId = true;
}

module.exports = BloqueoAgenda;