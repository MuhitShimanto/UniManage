import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerDocument } from './docs/swagger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';
import apiV1Routes from './routes';
import { sendSuccess } from './utils/apiResponse';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalRateLimiter);

app.get('/health', (_req, res) => {
  return sendSuccess(res, 'University Management System API is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', apiV1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
