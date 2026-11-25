import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createSequelize } from './db/sequelize.js';
import { SequelizeEmployeeRepository } from './repositories/sequelizeEmployeeRepository.js';
import { SequelizeInsightsRepository } from './repositories/sequelizeInsightsRepository.js';
import { EmployeeService } from './services/employeeService.js';
import { InsightsService } from './services/insightsService.js';

// Composition root: the only place where concrete implementations are wired together.
const env = loadEnv();
createSequelize(env.DATABASE_URL, { ssl: env.DATABASE_SSL });
const employeeService = new EmployeeService(new SequelizeEmployeeRepository());

const insightsService = new InsightsService(new SequelizeInsightsRepository());

createApp({ employeeService, insightsService, corsOrigins: env.CORS_ORIGIN }).listen(
  env.PORT,
  () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  },
);
