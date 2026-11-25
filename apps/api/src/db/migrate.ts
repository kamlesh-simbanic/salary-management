import { loadEnv } from '../config/env.js';
import { createSequelize } from './sequelize.js';
import { createMigrator } from './migrator.js';

// Usage: tsx src/db/migrate.ts [up|down]
const direction = process.argv[2] === 'down' ? 'down' : 'up';
const sequelize = createSequelize(loadEnv().DATABASE_URL);
const migrator = createMigrator(sequelize);

const done = direction === 'up' ? await migrator.up() : await migrator.down();
console.log(`${direction}: ${done.map((m) => m.name).join(', ') || 'nothing to do'}`);
await sequelize.close();
