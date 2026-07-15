import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import * as repo from '../data/repository.js';
import { geminiService } from '../services/geminiService.js';
import type { PresentationResult } from '../types/index.js';

export const demoRouter: Router = Router();

const presentationSchema = z.object({
  transcript: z.string().min(10).max(20000),
});

demoRouter.post('/teams/:id/verify-presentation', asyncHandler(async (req, res) => {
  const team = repo.getTeamById(req.params.id);
  if (!team) throw notFound('Team not found.');

  const parsed = presentationSchema.safeParse({ transcript: req.body?.transcript });
  if (!parsed.success) {
    throw badRequest('Invalid presentation payload.', parsed.error.flatten());
  }

  const claimedFeatures = team.claimedFeatures.map((c) => ({
    claim: c.claim,
    expectedEvidence: c.expectedEvidence,
    status: c.status,
  }));
  const commits = team.commits.slice(-15).map((c) => ({
    hash: c.hash,
    message: c.message,
    changedFiles: c.changedFiles,
    aiSummary: c.aiSummary,
  }));

  const results: PresentationResult[] = await geminiService.verifyPresentation({
    claimedFeatures,
    commits,
    presentationTranscript: parsed.data.transcript,
  });

  for (let i = 0; i < team.claimedFeatures.length && i < results.length; i += 1) {
    const r = results[i];
    team.claimedFeatures[i].status = r.status;
  }

  res.json({
    status: 'success',
    results,
  });
}));
