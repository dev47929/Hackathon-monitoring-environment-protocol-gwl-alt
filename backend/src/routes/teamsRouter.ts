import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import * as repo from '../data/repository.js';
import { GitHubService } from '../services/githubService.js';
import { bootstrapTeamFromGithub, buildClaimedFeatures, generateAndStoreInterviewQuestion } from '../services/auditPipeline.js';
import type { Team } from '../types/index.js';

export const teamsRouter: Router = Router();

function notFoundResponse(res: Response): void {
  res.status(404).json({ status: 'error', message: 'Team not found.' });
}

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  repoUrl: z.string().url().refine((u) => /github\.com/i.test(u), { message: 'repoUrl must be a GitHub URL' }),
  avatar: z.string().max(20).optional().default(''),
  techStack: z.array(z.string()).min(1).max(20),
  members: z.array(z.string()).min(1).max(20),
  description: z.string().max(2000).optional().default(''),
});

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
  .strict();

teamsRouter.get('/', (_req, res) => {
  res.json(repo.getAllTeams());
});

teamsRouter.get('/:id', (req, res) => {
  const team = repo.getTeamById(req.params.id);
  if (!team) return notFoundResponse(res);
  return res.json(team);
});

teamsRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest('Invalid team payload.', parsed.error.flatten());
  }
  const body = parsed.data;

  const existing = repo.findTeamByRepoUrl(body.repoUrl);
  if (existing) {
    throw badRequest('A team with this repository URL is already registered.', { teamId: existing.id });
  }

  let parsedRepo: { owner: string; repo: string };
  try {
    parsedRepo = GitHubService.parseRepoUrl(body.repoUrl);
  } catch (err) {
    throw badRequest((err as Error).message);
  }

  const id = `team-${uuidv4().slice(0, 8)}`;
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
  };

  repo.addTeam(team);
  repo.addLog({
    id: 'log-' + uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    type: 'success',
    message: `GitHub webhook connected: Team ${team.name} registered repository.`,
    teamName: team.name,
  });

  const syncResult = await bootstrapTeamFromGithub(team);
  void parsedRepo;

  if (team.commits.length > 0 && team.interviewQuestions.length === 0) {
    await generateAndStoreInterviewQuestion(team.id).catch((err) => {
      console.warn('[teams] Could not generate interview question:', err instanceof Error ? err.message : err);
    });
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
  });
}));

teamsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const team = repo.getTeamById(req.params.id);
  if (!team) throw notFound('Team not found.');

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest('Invalid update payload.', parsed.error.flatten());
  }
  const updates = parsed.data;
  const updated = repo.updateTeam(req.params.id, updates);
  res.json({ status: 'success', data: { id: updated.id, ...updates } });
}));
