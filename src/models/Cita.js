const BaseModel = require('./BaseModel');

class Cita extends BaseModel {
	static table = 'cita';
	static primaryKey = 'id_cita';
	static columns = [
		'id_cita',
		'placa',
		'inicio',
		'fin',
		'estado',
		'origen',
		'creada_por',
		'notas',
		'creada_en',
	];
	static createFields = [
		'id_cita',
		'placa',
		'inicio',
		'fin',
		'estado',
		'origen',
		'creada_por',
		'notas',
	];
	static updateFields = ['placa', 'inicio', 'fin', 'estado', 'origen', 'creada_por', 'notas'];
	static generatedId = true;
}

module.exports = Cita;
