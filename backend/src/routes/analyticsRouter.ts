import { Router } from 'express';
import * as repo from '../data/repository.js';

export const analyticsRouter: Router = Router();

analyticsRouter.get('/stats', (_req, res) => {
  res.json(repo.getStats());
});

analyticsRouter.get('/activity-logs', (_req, res) => {
  res.json(repo.getAllLogs());
});
