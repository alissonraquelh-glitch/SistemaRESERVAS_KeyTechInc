const { randomUUID } = require('node:crypto');
const BaseModel = require('./BaseModel');
const pool = require('../config/database');

class Cliente extends BaseModel {
	static table = 'cliente';
	static primaryKey = 'id_usuario';
	static columns = ['id_usuario', 'tipo', 'documento_identidad', 'fecha_registro'];
	static createFields = ['nombre_completo', 'telefono', 'correo', 'documento_identidad'];
	static updateFields = ['nombre_completo', 'telefono', 'correo', 'documento_identidad'];

	static async findAll({ limit = 100, offset = 0 } = {}) {
		if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(offset) || offset < 0) {
			throw new RangeError('limit y offset deben ser enteros válidos.');
		}

		const [rows] = await pool.execute(
			`SELECT u.id_usuario, u.nombre_completo, u.telefono, u.correo, u.activo, u.creado_en,
							c.documento_identidad, c.fecha_registro
			 FROM cliente c JOIN usuario u ON u.id_usuario = c.id_usuario
			 LIMIT ? OFFSET ?`,
			[limit, offset],
		);
		return rows;
	}

	static async findById(id) {
		const [rows] = await pool.execute(
			`SELECT u.id_usuario, u.nombre_completo, u.telefono, u.correo, u.activo, u.creado_en,
							c.documento_identidad, c.fecha_registro
			 FROM cliente c JOIN usuario u ON u.id_usuario = c.id_usuario
			 WHERE c.id_usuario = ? LIMIT 1`,
			[id],
		);
		return rows[0] || null;
	}

	static async create(data) {
		this.validateFields(data, this.createFields);
		const id = randomUUID();
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();
			await connection.execute(
				`INSERT INTO usuario (id_usuario, tipo, nombre_completo, telefono, correo)
				 VALUES (?, 'CLIENTE', ?, ?, ?)`,
				[id, data.nombre_completo, data.telefono, data.correo ?? null],
			);
			await connection.execute(
				'INSERT INTO cliente (id_usuario, documento_identidad) VALUES (?, ?)',
				[id, data.documento_identidad],
			);
			await connection.commit();
			return this.findById(id);
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	static async update(id, data) {
		this.validateFields(data, this.updateFields);
		const userFields = ['nombre_completo', 'telefono', 'correo'].filter((field) => field in data);
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();
			if (userFields.length) {
				await connection.execute(
					`UPDATE usuario SET ${userFields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE id_usuario = ?`,
					[...userFields.map((field) => data[field]), id],
				);
			}
			if ('documento_identidad' in data) {
				await connection.execute(
					'UPDATE cliente SET documento_identidad = ? WHERE id_usuario = ?',
					[data.documento_identidad, id],
				);
			}
			await connection.commit();
			return this.findById(id);
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	static async delete(id) {
		const [result] = await pool.execute('DELETE FROM usuario WHERE id_usuario = ? AND tipo = \'CLIENTE\'', [id]);
		return result.affectedRows > 0;
	}
}

module.exports = Cliente;
