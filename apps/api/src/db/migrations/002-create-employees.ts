import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration = async ({ context: qi }) => {
  await qi.createTable('employees', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    job_title: { type: DataTypes.STRING(100), allowNull: false },
    department: { type: DataTypes.STRING(100), allowNull: false },
    country_code: { type: DataTypes.CHAR(2), allowNull: false },
    // Enforced FK: an employee can't use a currency we have no rate for.
    currency_code: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      references: { model: 'currency_rates', key: 'code' },
    },
    annual_salary: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    hire_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  // Indexes match the directory filters and the insights group-bys (see docs/design.md).
  await qi.addIndex('employees', ['country_code']);
  await qi.addIndex('employees', ['department']);
  await qi.addIndex('employees', ['job_title', 'country_code']);
  await qi.addIndex('employees', ['full_name']);
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable('employees');
};
