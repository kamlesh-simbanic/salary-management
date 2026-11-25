import express, { Router } from 'express';
import { z } from 'zod';
import { employeeInputSchema, employeeListQuerySchema } from '../domain/employee.js';
import { ValidationError } from '../errors.js';
import type { EmployeeService } from '../services/employeeService.js';

const idParam = z.coerce.number().int().positive();

export function employeeRoutes(service: EmployeeService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(employeeListQuerySchema.parse(req.query)));
  });

  // The browser sends the file's text as the body (Content-Type: text/csv), which avoids a multipart dependency.
  router.post('/import', express.text({ type: 'text/csv', limit: '5mb' }), async (req, res) => {
    if (typeof req.body !== 'string') {
      throw new ValidationError(
        'Send the CSV file contents as the request body with Content-Type: text/csv',
      );
    }
    res.json(await service.importCsv(req.body));
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
