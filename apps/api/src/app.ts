import express from 'express';
import { errorHandler } from './http/errorHandler.js';
import { employeeRoutes } from './http/employeeRoutes.js';
import { insightsRoutes } from './http/insightsRoutes.js';
import type { EmployeeService } from './services/employeeService.js';
import type { InsightsService } from './services/insightsService.js';

export interface AppDeps {
  employeeService: EmployeeService;
  insightsService: InsightsService;
}

// Built by a factory with injected services so tests can create it without a port or a database.
export function createApp({ employeeService, insightsService }: AppDeps): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/v1/meta/filters', async (_req, res) => {
    res.json(await employeeService.filterOptions());
  });
  app.use('/api/v1/employees', employeeRoutes(employeeService));

  app.use('/api/v1/insights', insightsRoutes(insightsService));

  app.use(errorHandler);
  return app;
}
