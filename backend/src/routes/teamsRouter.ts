import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import type { Response } from 'express'
import { asyncHandler, badRequest, notFound } from '../utils/errors.js'
import * as repo from '../data/repository.js'
import { GitHubService } from '../services/githubService.js'
import { bootstrapTeamFromGithub, buildClaimedFeatures, generateAndStoreInterviewQuestion } from '../services/auditPipeline.js'
import type { Team } from '../types/index.js'

export const teamsRouter: Router = Router()

function notFoundResponse(res: Response): void {
  res.status(404).json({ status: 'error', message: 'Team not found.' })
}

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  repoUrl: z.string().url().refine((u) => /github\.com/i.test(u), { message: 'repoUrl must be a GitHub URL' }),
  avatar: z.string().max(20).optional().default(''),
  techStack: z.array(z.string()).min(1).max(20),
  members: z.array(z.string()).min(1).max(20),
  description: z.string().max(2000).optional().default(''),
})

const patchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    avatar: z.string().max(20).optional(),
    techStack: z.array(z.string()).max(20).optional(),
    members: z.array(z.string()).max(20).optional(),
    progress: z.number().min(0).max(100).optional(),
    description: z.string().max(2000).optional(),
    claimedFeatures: z
      .array(
        z.object({
          id: z.string(),
          claim: z.string(),
          expectedEvidence: z.string().optional().default(''),
          actualCodeReference: z.string().optional().default(''),
          status: z.enum(['verified', 'unverified', 'partially']).optional().default('unverified'),
        }),
      )
      .optional(),
  })
  .strict()

teamsRouter.get('/', asyncHandler(async (_req, res) => {
  res.json(await repo.getAllTeams())
}))

teamsRouter.get('/:id', asyncHandler(async (req, res) => {
  const team = await repo.getTeamById(req.params.id)
  if (!team) return notFoundResponse(res)
  return res.json(team)
}))

teamsRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    throw badRequest('Invalid team payload.', parsed.error.flatten())
  }
  const body = parsed.data

  const existing = await repo.findTeamByRepoUrl(body.repoUrl)
  if (existing) {
    throw badRequest('A team with this repository URL is already registered.', { teamId: existing.id })
  }

  let parsedRepo: { owner: string; repo: string }
  try {
    parsedRepo = GitHubService.parseRepoUrl(body.repoUrl)
  } catch (err) {
    throw badRequest((err as Error).message)
  }

  const id = `team-${uuidv4().slice(0, 8)}`
  const team: Team = {
    id,
    name: body.name,
    repoUrl: body.repoUrl,
    avatar: body.avatar || '',
    techStack: body.techStack,
    members: body.members,
    progress: 10,
    commits: [],
    overallRiskScore: 0,
    description: body.description,
    claimedFeatures: buildClaimedFeatures(body.techStack, body.description),
    interviewQuestions: [],
  }

  await repo.addTeam(team)
  await repo.addLog({
    id: 'log-' + uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    type: 'success',
    message: `GitHub webhook connected: Team ${team.name} registered repository.`,
    teamName: team.name,
  })

  const syncResult = await bootstrapTeamFromGithub(team)
  void parsedRepo

  const storedTeam = await repo.getTeamById(team.id)
  if (storedTeam && storedTeam.commits.length > 0 && storedTeam.interviewQuestions.length === 0) {
    await generateAndStoreInterviewQuestion(team.id).catch((err) => {
      console.warn('[teams] Could not generate interview question:', err instanceof Error ? err.message : err)
    })
  }

  res.status(201).json({
    status: 'success',
    message: 'Team registered and repository sync completed.',
    data: {
      id: team.id,
      name: team.name,
      progress: syncResult.progress,
      commitsCount: syncResult.commitsCount,
    },
  })
}))

teamsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const team = await repo.getTeamById(req.params.id)
  if (!team) throw notFound('Team not found.')

  const parsed = patchSchema.safeParse(req.body)
  if (!parsed.success) {
    throw badRequest('Invalid update payload.', parsed.error.flatten())
  }
  const updates = parsed.data
  const updated = await repo.updateTeam(req.params.id, updates)
  res.json({ status: 'success', data: { id: updated.id, ...updates } })
}))

teamsRouter.post('/:id/send-report', asyncHandler(async (req, res) => {
  const team = await repo.getTeamById(req.params.id)
  if (!team) throw notFound('Team not found.')

  const { email, reportText } = req.body

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://primary-production-459f.up.railway.app/webhook/hackproof-report'
  let networkSuccess = false
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: team.id,
        teamName: team.name,
        recipientEmail: email,
        reportContent: reportText,
        timestamp: new Date().toISOString()
      })
    })
    networkSuccess = response.ok
  } catch (err) {
    console.warn('Failed to forward report to webhook:', err)
  }

  await repo.addLog({
    id: 'log-' + uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    type: 'info',
    message: `Evaluation Report sent to Team Leader (${email}). Webhook forwarding status: ${networkSuccess ? 'Success' : 'Offline fallback active'}.`,
    teamName: team.name
  })

  res.json({
    status: 'success',
    message: 'Report sent successfully.',
    forwarded: networkSuccess
  })
}))

