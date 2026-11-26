import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Connected to Neon PostgreSQL via Prisma');
  } catch (err) {
    console.warn('Database connection warning on startup:', err instanceof Error ? err.message : err);
  }

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`Swagger docs available at http://localhost:${env.PORT}/api/docs`);
  });
}

bootstrap();
