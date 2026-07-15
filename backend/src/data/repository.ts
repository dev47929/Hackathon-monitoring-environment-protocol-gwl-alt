import type { Team, Commit, ActivityLog, HackathonStats, JustificationStatus } from '../types/index.js';
import { seedTeams, seedActivityLogs, computeStats } from '../data/seed.js';

interface InternalState {
  teams: Team[];
  logs: ActivityLog[];
}

const state: InternalState = {
  teams: seedTeams(),
  logs: seedActivityLogs(),
};

export function getAllTeams(): Team[] {
  return state.teams;
}

export function getTeamById(id: string): Team | undefined {
  return state.teams.find((t) => t.id === id);
}

export function findTeamByRepoUrl(repoUrl: string): Team | undefined {
  const normalized = repoUrl.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
  return state.teams.find((t) => t.repoUrl.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '') === normalized);
}

export function addTeam(team: Team): void {
  state.teams.push(team);
}

export function updateTeam(id: string, updates: Partial<Team>): Team {
  const idx = state.teams.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Team ${id} not found`);
  state.teams[idx] = { ...state.teams[idx], ...updates };
  return state.teams[idx];
}

export function addCommitToTeam(teamId: string, commit: Commit): void {
  const idx = state.teams.findIndex((t) => t.id === teamId);
  if (idx === -1) throw new Error(`Team ${teamId} not found`);
  state.teams[idx].commits = [...state.teams[idx].commits, commit];
}

export function findCommitByHash(hash: string): { team: Team; commit: Commit } | undefined {
  for (const team of state.teams) {
    const commit = team.commits.find((c) => c.hash === hash);
    if (commit) return { team, commit };
  }
  return undefined;
}

export function updateCommit(hash: string, updates: Partial<Commit>): Commit | undefined {
  for (const team of state.teams) {
    const idx = team.commits.findIndex((c) => c.hash === hash);
    if (idx !== -1) {
      team.commits[idx] = { ...team.commits[idx], ...updates };
      return team.commits[idx];
    }
  }
  return undefined;
}

export function recomputeTeamRisk(teamId: string): number {
  const idx = state.teams.findIndex((t) => t.id === teamId);
  if (idx === -1) throw new Error(`Team ${teamId} not found`);
  const commits = state.teams[idx].commits;
  if (commits.length === 0) {
    state.teams[idx].overallRiskScore = 0;
    return 0;
  }

  let weightedSum = 0;
  for (const c of commits) {
    let weight = 1;
    if (c.justificationStatus === 'accepted') weight = 0.4;
    if (c.justificationStatus === 'rejected') weight = 1.5;
    weightedSum += c.riskScore * weight;
  }
  const avg = weightedSum / commits.length;
  const score = Math.max(0, Math.min(100, Math.round(avg)));
  state.teams[idx].overallRiskScore = score;
  return score;
}

export function setJustification(hash: string, justification: string): Commit | undefined {
  const commit = updateCommit(hash, {
    justification,
    justificationStatus: 'pending' satisfies JustificationStatus,
  });
  return commit;
}

export function setJustificationReview(hash: string, status: 'accepted' | 'rejected'): { commit?: Commit; teamId?: string } {
  const result = findCommitByHash(hash);
  const commit = updateCommit(hash, { justificationStatus: status });
  return { commit, teamId: result?.team.id };
}

export function getAllLogs(): ActivityLog[] {
  return [...state.logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function addLog(log: ActivityLog): void {
  state.logs.push(log);
}

export function getStats(): HackathonStats {
  return computeStats(state.teams);
}

export function resetState(): void {
  state.teams = seedTeams();
  state.logs = seedActivityLogs();
}
