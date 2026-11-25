import { Umzug, SequelizeStorage, type MigrationFn } from 'umzug';
import type { QueryInterface, Sequelize } from 'sequelize';
import * as m001 from './migrations/001-create-currency-rates.js';
import * as m002 from './migrations/002-create-employees.js';

export type Migration = MigrationFn<QueryInterface>;

// Explicit list (not a glob) so order is obvious and it works under tsx and compiled JS alike.
const migrations = [
  { name: '001-create-currency-rates', ...m001 },
  { name: '002-create-employees', ...m002 },
];

export function createMigrator(sequelize: Sequelize): Umzug<QueryInterface> {
  return new Umzug({
    migrations,
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
  });
}
