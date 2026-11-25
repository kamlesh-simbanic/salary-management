import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration = async ({ context: qi }) => {
  await qi.createTable('currency_rates', {
    code: { type: DataTypes.CHAR(3), primaryKey: true },
    rate_to_usd: { type: DataTypes.DECIMAL(18, 8), allowNull: false },
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable('currency_rates');
};
