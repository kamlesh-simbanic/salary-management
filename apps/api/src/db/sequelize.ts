import { Sequelize } from 'sequelize';
import { initCurrencyRate } from './models/currencyRate.js';
import { initEmployee } from './models/employee.js';

export function createSequelize(databaseUrl: string): Sequelize {
  const sequelize = new Sequelize(databaseUrl, { dialect: 'mysql', logging: false });
  initCurrencyRate(sequelize);
  initEmployee(sequelize);
  return sequelize;
}
