import type { Sequelize } from 'sequelize';
import { loadEnv } from '../../src/config/env.js';
import { createSequelize } from '../../src/db/sequelize.js';
import { CurrencyRate } from '../../src/db/models/currencyRate.js';
import { Employee } from '../../src/db/models/employee.js';
import type { EmployeeInput } from '../../src/domain/employee.js';
import { SequelizeEmployeeRepository } from '../../src/repositories/sequelizeEmployeeRepository.js';

export function connectTestDb(): Sequelize {
  const url = loadEnv({ ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }).DATABASE_URL;
  // Safety net: never let a test wipe the development database.
  if (!/test/i.test(new URL(url).pathname))
    throw new Error('TEST_DATABASE_URL must point to a *test* database');
  return createSequelize(url);
}

// Known, fixed rates so expected USD values in assertions are easy to check by hand.
export async function resetDb() {
  await Employee.destroy({ where: {} });
  await CurrencyRate.destroy({ where: {} });
  await CurrencyRate.bulkCreate([
    { code: 'USD', rateToUsd: '1' },
    { code: 'INR', rateToUsd: '0.01' },
  ]);
}

export const repo = new SequelizeEmployeeRepository();

export async function insert(input: EmployeeInput) {
  return repo.create(input);
}
