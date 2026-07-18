import { Router } from 'express'
import { asyncHandler } from '../utils/errors.js'
import * as repo from '../data/repository.js'

export const analyticsRouter: Router = Router()

analyticsRouter.get('/stats', asyncHandler(async (_req, res) => {
  res.json(await repo.getStats())
}))

analyticsRouter.get('/activity-logs', asyncHandler(async (_req, res) => {
  res.json(await repo.getAllLogs())
}))
