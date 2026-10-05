const BaseModel = require('./BaseModel');

class Usuario extends BaseModel {
	static table = 'usuario';
	static primaryKey = 'id_usuario';
	static columns = [
		'id_usuario',
		'tipo',
		'nombre_completo',
		'telefono',
		'correo',
		'activo',
		'creado_en',
	];
	static createFields = ['id_usuario', 'tipo', 'nombre_completo', 'telefono', 'correo', 'activo'];
	static updateFields = ['nombre_completo', 'telefono', 'correo', 'activo'];
	static generatedId = true;

	static async create() {
		throw new Error('Crea un usuario mediante Cliente o Empleado.');
	}
}

module.exports = Usuario;
