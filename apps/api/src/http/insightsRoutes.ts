import { Router } from 'express';
import {
  distributionQuerySchema,
  outliersQuerySchema,
  summaryQuerySchema,
} from '../domain/insights.js';
import type { InsightsService } from '../services/insightsService.js';

export function insightsRoutes(service: InsightsService): Router {
  const router = Router();

  router.get('/summary', async (req, res) => {
    const { groupBy, ...filters } = summaryQuerySchema.parse(req.query);
    res.json({ groupBy, rows: await service.summary(groupBy, filters) });
  });

  router.get('/distribution', async (req, res) => {
    const { bands, ...filters } = distributionQuerySchema.parse(req.query);
    res.json(await service.distribution(filters, bands));
  });

  router.get('/outliers', async (req, res) => {
    const { limit, ...filters } = outliersQuerySchema.parse(req.query);
    res.json(await service.outliers(filters, limit));
  });

  return router;
}
