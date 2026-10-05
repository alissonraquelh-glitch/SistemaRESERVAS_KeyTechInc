const BaseModel = require('./BaseModel');

class Vehiculo extends BaseModel {
	static table = 'vehiculo';
	static primaryKey = 'placa';
	static columns = ['placa', 'id_cliente', 'marca', 'modelo', 'tipo', 'anio', 'color'];
	static createFields = this.columns;
	static updateFields = ['id_cliente', 'marca', 'modelo', 'tipo', 'anio', 'color'];
}

module.exports = Vehiculo;
