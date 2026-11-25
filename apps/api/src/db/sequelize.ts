import { Sequelize } from 'sequelize';
import { CurrencyRate, initCurrencyRate } from './models/currencyRate.js';
import { Employee, initEmployee } from './models/employee.js';

export function createSequelize(databaseUrl: string): Sequelize {
  const sequelize = new Sequelize(databaseUrl, { dialect: 'mysql', logging: false });
  initCurrencyRate(sequelize);
  initEmployee(sequelize);
  Employee.belongsTo(CurrencyRate, {
    foreignKey: 'currencyCode',
    targetKey: 'code',
    as: 'currencyRate',
  });
  return sequelize;
}
