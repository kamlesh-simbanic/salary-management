import { Router } from 'express';
import { z } from 'zod';
import { employeeInputSchema, employeeListQuerySchema } from '../domain/employee.js';
import type { EmployeeService } from '../services/employeeService.js';

const idParam = z.coerce.number().int().positive();

export function employeeRoutes(service: EmployeeService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(employeeListQuerySchema.parse(req.query)));
  });

  router.get('/:id', async (req, res) => {
    res.json(await service.get(idParam.parse(req.params.id)));
  });

  router.post('/', async (req, res) => {
    const created = await service.create(employeeInputSchema.parse(req.body));
    res.status(201).json(created);
  });

  router.put('/:id', async (req, res) => {
    const updated = await service.update(
      idParam.parse(req.params.id),
      employeeInputSchema.parse(req.body),
    );
    res.json(updated);
  });

  router.delete('/:id', async (req, res) => {
    await service.remove(idParam.parse(req.params.id));
    res.status(204).end();
  });

  return router;
}
