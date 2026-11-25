import { Sequelize } from 'sequelize';
import { CurrencyRate, initCurrencyRate } from './models/currencyRate.js';
import { Employee, initEmployee } from './models/employee.js';

export function createSequelize(databaseUrl: string, options: { ssl?: boolean } = {}): Sequelize {
  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'mysql',
    logging: false,
    // Verify the server certificate against Node's trusted CAs; never disable verification.
    // A hosted database is across the internet: allow 30 s to connect (the driver default is 10 s).
    dialectOptions: options.ssl
      ? { connectTimeout: 30_000, ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }
      : {},
  });
  initCurrencyRate(sequelize);
  initEmployee(sequelize);
  Employee.belongsTo(CurrencyRate, {
    foreignKey: 'currencyCode',
    targetKey: 'code',
    as: 'currencyRate',
  });
  return sequelize;
}
