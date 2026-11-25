import { loadEnv } from '../config/env.js';
import { Employee } from '../db/models/employee.js';
import { CurrencyRate } from '../db/models/currencyRate.js';
import { createSequelize } from '../db/sequelize.js';
import { CURRENCY_RATES } from './catalog.js';
import { generateEmployees } from './generateEmployees.js';

// Usage: tsx src/seed/run.ts [count]   (default 10000). Re-running replaces all employees.
const count = Number(process.argv[2] ?? 10_000);
const BATCH_SIZE = 1000;

const env = loadEnv();
const sequelize = createSequelize(env.DATABASE_URL, { ssl: env.DATABASE_SSL });
const started = Date.now();

await sequelize.transaction(async (transaction) => {
  for (const [code, rate] of Object.entries(CURRENCY_RATES)) {
    await CurrencyRate.upsert({ code, rateToUsd: String(rate) }, { transaction });
  }

  await Employee.destroy({ where: {}, truncate: false, transaction });
  const rows = generateEmployees(count);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows
      .slice(i, i + BATCH_SIZE)
      .map((r) => ({ ...r, annualSalary: r.annualSalary.toFixed(2) }));
    await Employee.bulkCreate(batch, { transaction });
  }
});

console.log(`Seeded ${count} employees in ${Date.now() - started} ms`);
await sequelize.close();
