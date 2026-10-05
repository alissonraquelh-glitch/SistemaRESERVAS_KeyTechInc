const { randomUUID } = require('node:crypto');
const pool = require('../config/database');

class BaseModel {
  static validateFields(data, allowedFields) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeError('Los datos deben ser un objeto.');
    }

    const unknownFields = Object.keys(data).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) {
      throw new Error(`Campos no permitidos: ${unknownFields.join(', ')}`);
    }
  }

  static async findAll({ limit = 100, offset = 0 } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(offset) || offset < 0) {
      throw new RangeError('limit y offset deben ser enteros válidos.');
    }

    const [rows] = await pool.execute(
      `SELECT * FROM \`${this.table}\` LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM \`${this.table}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const values = { ...data };
    if (this.generatedId && !values[this.primaryKey]) {
      values[this.primaryKey] = randomUUID();
    }
    this.validateFields(values, this.createFields);

    const fields = Object.keys(values);
    if (!fields.length) {
      throw new Error('Se requiere al menos un campo para crear el registro.');
    }

    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO \`${this.table}\` (${fields.map((field) => `\`${field}\``).join(', ')}) VALUES (${placeholders})`,
      fields.map((field) => values[field]),
    );

    const id = values[this.primaryKey] ?? result.insertId;
    return this.findById(id);
  }

  static async update(id, data) {
    this.validateFields(data, this.updateFields);
    const fields = Object.keys(data);
    if (!fields.length) {
      throw new Error('Se requiere al menos un campo para actualizar.');
    }

    await pool.execute(
      `UPDATE \`${this.table}\` SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE \`${this.primaryKey}\` = ?`,
      [...fields.map((field) => data[field]), id],
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM \`${this.table}\` WHERE \`${this.primaryKey}\` = ?`,
      [id],
    );
    return result.affectedRows > 0;
  }
}

module.exports = BaseModel;