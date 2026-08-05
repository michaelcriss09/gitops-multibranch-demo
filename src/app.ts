import express, { Express, Request, Response } from 'express';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Usado por el healthcheck del contenedor ECS y por el smoke test (newman)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'mi-app',
      version: process.env.APP_VERSION ?? 'local',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'mi-app arriba y funcionando' });
  });

  app.get('/api/greeting', (req: Request, res: Response) => {
    const name = typeof req.query.name === 'string' ? req.query.name : 'mundo';
    res.status(200).json({ message: `Hola, ${name}!` });
  });

  return app;
}
