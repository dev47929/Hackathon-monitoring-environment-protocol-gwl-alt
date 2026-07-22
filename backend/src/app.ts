import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';
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
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const logFormat = config.server.isProd ? 'combined' : 'dev';
app.use(morgan(logFormat));

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
app.use('/api/teams', teamsRouter);
app.use('/api', commitsRouter);
app.use('/api', demoRouter);
app.use('/api', analyticsRouter);
app.use('/api', blockchainRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
