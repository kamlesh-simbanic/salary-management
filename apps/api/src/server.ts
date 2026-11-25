import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createSequelize } from './db/sequelize.js';
import { SequelizeEmployeeRepository } from './repositories/sequelizeEmployeeRepository.js';
import { EmployeeService } from './services/employeeService.js';

// Composition root: the only place where concrete implementations are wired together.
const env = loadEnv();
createSequelize(env.DATABASE_URL);
const employeeService = new EmployeeService(new SequelizeEmployeeRepository());

createApp({ employeeService }).listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
