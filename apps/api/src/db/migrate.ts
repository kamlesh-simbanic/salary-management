import { loadEnv } from '../config/env.js';
import { createSequelize } from './sequelize.js';
import { createMigrator } from './migrator.js';

// Usage: tsx src/db/migrate.ts [up|down]
const direction = process.argv[2] === 'down' ? 'down' : 'up';
const env = loadEnv();
const sequelize = createSequelize(env.DATABASE_URL, { ssl: env.DATABASE_SSL });
const migrator = createMigrator(sequelize);

const done = direction === 'up' ? await migrator.up() : await migrator.down();
console.log(`${direction}: ${done.map((m) => m.name).join(', ') || 'nothing to do'}`);
await sequelize.close();
