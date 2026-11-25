import express from 'express';

// The app is built by a factory so tests can create it without opening a port.
export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
