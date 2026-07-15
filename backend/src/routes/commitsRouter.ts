import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import * as repo from '../data/repository.js';
import { config } from '../config/index.js';
import { GitHubService, githubService } from '../services/githubService.js';
import { auditAndAnchorCommit } from '../services/auditPipeline.js';
import { normalizeWebhookPayload, type NormalizedWebhookInput } from '../middleware/webhook.js';
import type { Team } from '../types/index.js';

export const commitsRouter: Router = Router();

async function resolveTeam(input: NormalizedWebhookInput): Promise<Team | null> {
  if (input.teamId) {
    const t = repo.getTeamById(input.teamId);
    return t ?? null;
  }
  return repo.findTeamByRepoUrl(input.repoUrl) ?? null;
}

commitsRouter.post('/webhooks/github', asyncHandler(async (req, res) => {
  const rawBody = req.rawBody;
  if (rawBody && config.github.webhookSecret) {
    const ok = GitHubService.verifyWebhookSignature(rawBody, req.get('X-Hub-Signature-256'), config.github.webhookSecret);
    if (!ok) {
      res.status(401).json({ status: 'error', message: 'Invalid webhook signature.' });
      return;
    }
  }

  const input = normalizeWebhookPayload(req);
  const team = await resolveTeam(input);
  if (!team) {
    throw badRequest(`No team registered for repository: ${input.repoUrl}`);
  }

  const { commit: incoming } = input;
  const teamId = team.id;

  const shouldFetchFromGithub = !incoming.patch && githubService.isConfigured();

  const result = await auditAndAnchorCommit(teamId, input, { fetchDiffFromGitHub: shouldFetchFromGithub });

  res.json({
    status: 'processed',
    commitHash: result.commit.hash,
    aiSummary: result.commit.aiSummary,
    category: result.commit.category,
    riskScore: result.commit.riskScore,
    blockchainTx: result.commit.blockchainTx,
    isSuspicious: Boolean(result.commit.isSuspicious),
    suspiciousReason: result.commit.suspiciousReason ?? undefined,
    teamName: result.team.name,
    overallRiskScore: result.team.overallRiskScore,
  });
}));

const justificationSchema = z.object({
  justification: z.string().min(5).max(5000),
});

commitsRouter.post('/:hash/justification', asyncHandler(async (req, res) => {
  const parsed = justificationSchema.safeParse({ justification: req.body?.justification });
  if (!parsed.success) {
    throw badRequest('Invalid justification payload.', parsed.error.flatten());
  }
  const { hash } = req.params;
  const existing = repo.findCommitByHash(hash);
  if (!existing) throw notFound(`Commit ${hash} not found.`);

  if (existing.commit.justificationStatus === 'accepted') {
    throw badRequest('This commit justification has already been accepted.');
  }

  repo.setJustification(hash, parsed.data.justification);
  repo.recomputeTeamRisk(existing.team.id);

  repo.addLog({
    id: 'log-' + uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    type: 'info',
    message: `Justification submitted for commit ${hash} by ${existing.team.name}.`,
    teamName: existing.team.name,
    refId: hash,
  });

  res.json({
    status: 'success',
    message: 'Justification recorded successfully. Queue updated for judge review.',
  });
}));

const reviewSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

commitsRouter.patch('/:hash/review', asyncHandler(async (req, res) => {
  const parsed = reviewSchema.safeParse({ status: req.body?.status });
  if (!parsed.success) {
    throw badRequest('Invalid review payload. status must be "accepted" or "rejected".', parsed.error.flatten());
  }
  const { hash } = req.params;
  const existing = repo.findCommitByHash(hash);
  if (!existing) throw notFound(`Commit ${hash} not found.`);
  if (existing.commit.justificationStatus === 'none') {
    throw badRequest('This commit has no submitted justification to review.');
  }

  const { teamId } = repo.setJustificationReview(hash, parsed.data.status);
  if (!teamId) throw notFound(`Could not resolve team for commit ${hash}.`);
  const newScore = repo.recomputeTeamRisk(teamId);

  repo.addLog({
    id: 'log-' + uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    type: parsed.data.status === 'accepted' ? 'success' : 'warning',
    message: `Judge ${parsed.data.status} justification for ${hash}. New team risk score: ${newScore}.`,
    teamName: existing.team.name,
    refId: hash,
  });

  res.json({
    status: 'success',
    hash,
    newOverallRiskScore: newScore,
  });
}));
