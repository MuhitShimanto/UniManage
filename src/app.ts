import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
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

app.get('/', (_req, res) => {
  return sendSuccess(res, 'University Management System API is running', {
    docs: '/api/docs',
    health: '/health',
    apiBase: '/api/v1',
  });
});

app.get('/health', (_req, res) => {
  return sendSuccess(res, 'University Management System API is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerDocument);
});

app.get(['/api/docs', '/api/docs/'], (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com;"
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>UniManage API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: '/api/docs.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout'
      });
    };
  </script>
</body>
</html>`);
});
app.use('/api/v1', apiV1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
