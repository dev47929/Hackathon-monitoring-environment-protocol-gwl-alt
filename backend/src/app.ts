import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';
import { optionalAuth } from './middleware/auth.js';
import { teamsRouter } from './routes/teamsRouter.js';
import { commitsRouter } from './routes/commitsRouter.js';
import { demoRouter } from './routes/demoRouter.js';
import { analyticsRouter } from './routes/analyticsRouter.js';
import { blockchainRouter } from './routes/blockchainRouter.js';
import { authRouter } from './routes/authRouter.js';
import { geminiService } from './services/geminiService.js';
import { githubService } from './services/githubService.js';
import { blockchainService } from './services/blockchainService.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.server.corsOrigin === '*' ? true : config.server.corsOrigin.split(','), methods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'] }));

const logFormat = config.server.isProd ? 'combined' : 'dev';
app.use(morgan(logFormat));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, slow down.' },
}));

app.use(express.json({
  limit: '5mb',
  type: ['application/json', 'text/plain'],
  verify: (req, _res, buf) => {
    (req as unknown as { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'hackproof-ai-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      gemini: geminiService.isConfigured(),
      github: githubService.isConfigured(),
      blockchain: blockchainService.isConfigured(),
      blockchainMode: blockchainService.mode(),
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/teams', optionalAuth, teamsRouter);
app.use('/api', optionalAuth, commitsRouter);
app.use('/api', optionalAuth, demoRouter);
app.use('/api', optionalAuth, analyticsRouter);
app.use('/api', optionalAuth, blockchainRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
