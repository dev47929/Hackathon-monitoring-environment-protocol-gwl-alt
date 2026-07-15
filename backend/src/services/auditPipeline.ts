import { v4 as uuidv4 } from 'uuid';
import type { Commit, Team, ActivityLog, ClaimedFeature, InterviewQuestion } from '../types/index.js';
import { addCommitToTeam, addLog, getTeamById, recomputeTeamRisk } from '../data/repository.js';
import { GitHubService, githubService } from './githubService.js';
import { geminiService } from './geminiService.js';
import { blockchainService, computeAiSummaryHash } from './blockchainService.js';
import { config } from '../config/index.js';
import type { NormalizedWebhookInput } from '../middleware/webhook.js';

export interface AuditResult {
  commit: Commit;
  team: Team;
  log: ActivityLog;
}

function newId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8)}`;
}

export async function auditAndAnchorCommit(
  teamId: string,
  webhookInput: NormalizedWebhookInput,
  opts: { fetchDiffFromGitHub?: boolean } = {},
): Promise<AuditResult> {
  const team = getTeamById(teamId);
  if (!team) throw new Error(`Team ${teamId} not found`);

  const { commit: incoming } = webhookInput;
  const hash = incoming.hash;
  const existing = team.commits.find((c) => c.hash === hash);
  if (existing) {
    throw Object.assign(new Error(`Commit ${hash} already audited for team ${team.name}.`), { statusCode: 409 });
  }

  let diffText = incoming.patch || '';
  if (!diffText && opts.fetchDiffFromGitHub && githubService.isConfigured()) {
    try {
      const { owner, repo } = GitHubService.parseRepoUrl(team.repoUrl);
      const detail = await githubService.fetchCommitDetail(owner, repo, hash);
      diffText = (detail.files ?? []).map((f) => `--- ${f.filename} +++ ${f.filename}\n${f.patch ?? ''}`).join('\n\n');
    } catch (err) {
      console.warn('[audit] Could not fetch diff from GitHub, using metadata only:', err instanceof Error ? err.message : err);
    }
  }
  if (!diffText) {
    diffText = syntheticDiff(incoming);
  }

  const analysis = await geminiService.analyzeCommit(diffText, {
    hash, message: incoming.message, author: incoming.author,
    additions: incoming.additions, deletions: incoming.deletions, changedFiles: incoming.changedFiles,
  });

  const timestamp = incoming.timestamp || new Date().toISOString();
  const aiSummaryHash = computeAiSummaryHash(analysis.aiSummary);
  const anchorResult = await blockchainService.anchorCommit({
    commitHash: hash,
    author: incoming.author,
    timestamp: Math.floor(new Date(timestamp).getTime() / 1000),
    aiSummaryHash,
    riskScore: analysis.riskScore,
  });

  const commit: Commit = {
    hash,
    timestamp,
    author: incoming.author,
    message: incoming.message,
    changedFiles: incoming.changedFiles,
    additions: incoming.additions,
    deletions: incoming.deletions,
    aiSummary: analysis.aiSummary,
    featureEvolution: analysis.featureEvolution,
    category: analysis.category,
    blockchainTx: anchorResult.blockchainTx,
    blockchainStatus: anchorResult.blockchainStatus,
    isSuspicious: analysis.isSuspicious,
    suspiciousReason: analysis.suspiciousReason ?? undefined,
    riskScore: analysis.riskScore,
    justificationStatus: 'none',
    teamId: team.id,
  };

  addCommitToTeam(team.id, commit);
  recomputeTeamRisk(team.id);

  const log: ActivityLog = {
    id: newId('log'),
    timestamp: new Date().toISOString(),
    type: analysis.isSuspicious ? (analysis.riskScore >= 80 ? 'danger' : 'warning') : 'info',
    message: analysis.isSuspicious
      ? `${analysis.riskScore >= 80 ? 'CRITICAL ALERT' : 'AI Warning'}: ${analysis.suspiciousReason || 'Suspicious commit flagged'} for commit ${hash}.`
      : `AI analyzed commit ${hash.slice(0, 7)}: ${analysis.aiSummary}`,
    teamName: team.name,
    refId: hash,
  };
  addLog(log);

  return { commit, team, log };
}

export async function generateAndStoreInterviewQuestion(teamId: string): Promise<InterviewQuestion | null> {
  const team = getTeamById(teamId);
  if (!team) return null;
  const lastCommits = [...team.commits].slice(-5).map((c) => ({
    hash: c.hash, message: c.message, changedFiles: c.changedFiles,
    additions: c.additions, deletions: c.deletions, aiSummary: c.aiSummary,
  }));
  if (lastCommits.length === 0) return null;
  const claimsText = team.claimedFeatures.map((c) => c.claim).join('; ');
  const ai = await geminiService.generateInterviewQuestion(lastCommits, claimsText);
  if (!ai) return null;
  const question: InterviewQuestion = {
    id: newId('q'),
    question: ai.question,
    context: ai.context,
    suggestedAnswer: ai.suggestedAnswer,
  };
  team.interviewQuestions = [...team.interviewQuestions, question];
  return question;
}

export async function bootstrapTeamFromGithub(team: Team): Promise<{
  commitsCount: number;
  progress: number;
}> {
  if (!githubService.isConfigured()) {
    return { commitsCount: team.commits.length, progress: team.progress };
  }
  try {
    const { owner, repo } = GitHubService.parseRepoUrl(team.repoUrl);
    const ghCommits = await githubService.fetchCommits(owner, repo, { branch: 'main', perPage: 5 });
    let processed = 0;
    for (const ghCommit of ghCommits) {
      const hash = ghCommit.sha.slice(0, 7);
      if (team.commits.find((c) => c.hash === hash)) continue;
      const normalized: NormalizedWebhookInput = {
        repoUrl: team.repoUrl,
        commit: {
          hash,
          author: ghCommit.commit.author?.name ?? 'unknown',
          message: ghCommit.commit.message?.split('\n')[0] ?? '',
          changedFiles: [],
          additions: 0, deletions: 0,
          timestamp: ghCommit.commit.author?.date,
        },
      };
      try {
        await auditAndAnchorCommit(team.id, normalized, { fetchDiffFromGitHub: true });
        processed += 1;
      } catch (err) {
        console.warn('[bootstrap] Skipping commit', hash, '-', err instanceof Error ? err.message : err);
      }
    }
    recomputeTeamRisk(team.id);
    const progress = Math.min(100, team.progress + processed * 2);
    team.progress = progress;
    return { commitsCount: team.commits.length, progress };
  } catch (err) {
    console.warn('[bootstrap] Could not sync commits from GitHub:', err instanceof Error ? err.message : err);
    return { commitsCount: team.commits.length, progress: team.progress };
  }
}

export function buildClaimedFeatures(techStack: string[], description: string): ClaimedFeature[] {
  const stackClaims = techStack.slice(0, 3).map((tech) => ({
    id: newId('c'),
    claim: `${tech} integration`,
    expectedEvidence: `Source files referencing or initializing ${tech}.`,
    actualCodeReference: 'Pending audit after first webhook push.',
    status: 'unverified' as const,
  }));
  return stackClaims.length > 0 ? stackClaims : [{
    id: newId('c'),
    claim: description.slice(0, 80) || 'Project MVP',
    expectedEvidence: 'Codebase implementation files.',
    actualCodeReference: 'Pending audit after first webhook push.',
    status: 'unverified',
  }];
}

export function syntheticDiff(commit: NormalizedWebhookInput['commit']): string {
  return `diff --git a/commit ${commit.hash}
Author: ${commit.author}
Message: ${commit.message}
Files: ${commit.changedFiles.join(', ')}
+${commit.additions} -${commit.deletions}
`;
}

export { config };
