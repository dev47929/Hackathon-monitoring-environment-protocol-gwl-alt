import type { Team, Commit, ActivityLog, HackathonStats, JustificationStatus, ClaimedFeature, InterviewQuestion, User } from '../types/index.js'
import { prisma } from './prisma.js'

function mapTeam(t: any): Team {
  return {
    id: t.id,
    name: t.name,
    repoUrl: t.repoUrl,
    avatar: t.avatar,
    techStack: t.techStack,
    members: t.members,
    progress: t.progress,
    overallRiskScore: t.overallRiskScore,
    description: t.description,
    claimedFeatures: (t.claimedFeatures ?? []) as ClaimedFeature[],
    interviewQuestions: (t.interviewQuestions ?? []) as InterviewQuestion[],
    commits: (t.commits ?? []).map(mapCommit),
  }
}

function mapCommit(c: any): Commit {
  return {
    hash: c.hash,
    timestamp: c.timestamp,
    author: c.author,
    message: c.message,
    changedFiles: c.changedFiles,
    additions: c.additions,
    deletions: c.deletions,
    aiSummary: c.aiSummary,
    featureEvolution: c.featureEvolution,
    category: c.category as Commit['category'],
    blockchainTx: c.blockchainTx,
    blockchainStatus: c.blockchainStatus as Commit['blockchainStatus'],
    isSuspicious: c.isSuspicious || undefined,
    suspiciousReason: c.suspiciousReason ?? undefined,
    riskScore: c.riskScore,
    justification: c.justification ?? undefined,
    justificationStatus: c.justificationStatus as JustificationStatus,
    teamId: c.teamId,
    ...(c.blockNumber != null ? { blockNumber: c.blockNumber } : {}),
    ...(c.eventHash ? { eventHash: c.eventHash } : {}),
  }
}

const teamInclude = { commits: true }

export async function getAllTeams(): Promise<Team[]> {
  const rows = await prisma.team.findMany({ include: teamInclude, orderBy: { createdAt: 'asc' } })
  return rows.map(mapTeam)
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  const row = await prisma.team.findUnique({ where: { id }, include: teamInclude })
  return row ? mapTeam(row) : undefined
}

export async function findTeamByRepoUrl(repoUrl: string): Promise<Team | undefined> {
  const normalized = repoUrl.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase()
  const all = await prisma.team.findMany({ include: teamInclude })
  const row = all.find((t) => t.repoUrl.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '') === normalized)
  return row ? mapTeam(row) : undefined
}

export async function addTeam(team: Team): Promise<void> {
  await prisma.team.create({
    data: {
      id: team.id,
      name: team.name,
      repoUrl: team.repoUrl,
      avatar: team.avatar,
      techStack: team.techStack,
      members: team.members,
      progress: team.progress,
      overallRiskScore: team.overallRiskScore,
      description: team.description,
      claimedFeatures: team.claimedFeatures as any,
      interviewQuestions: team.interviewQuestions as any,
    },
  })
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
  const data: any = { ...updates }
  if (updates.claimedFeatures) data.claimedFeatures = updates.claimedFeatures as any
  if (updates.interviewQuestions) data.interviewQuestions = updates.interviewQuestions as any
  if (updates.commits) delete data.commits
  const row = await prisma.team.update({ where: { id }, data, include: teamInclude })
  return mapTeam(row)
}

export async function addCommitToTeam(teamId: string, commit: Commit): Promise<void> {
  await prisma.commit.create({
    data: {
      hash: commit.hash,
      teamId,
      timestamp: commit.timestamp,
      author: commit.author,
      message: commit.message,
      changedFiles: commit.changedFiles,
      additions: commit.additions,
      deletions: commit.deletions,
      aiSummary: commit.aiSummary,
      featureEvolution: commit.featureEvolution,
      category: commit.category,
      blockchainTx: commit.blockchainTx,
      blockchainStatus: commit.blockchainStatus,
      isSuspicious: commit.isSuspicious ?? false,
      suspiciousReason: commit.suspiciousReason ?? null,
      riskScore: commit.riskScore,
      justification: commit.justification ?? null,
      justificationStatus: commit.justificationStatus,
      blockNumber: (commit as any).blockNumber ?? null,
      eventHash: (commit as any).eventHash ?? null,
    },
  })
}

export async function findCommitByHash(hash: string): Promise<{ team: Team; commit: Commit } | undefined> {
  const commitRow = await prisma.commit.findUnique({
    where: { hash },
    include: { team: { include: teamInclude } },
  })
  if (!commitRow) return undefined
  return { team: mapTeam(commitRow.team), commit: mapCommit(commitRow) }
}

export async function updateCommit(hash: string, updates: Partial<Commit>): Promise<Commit | undefined> {
  const data: any = { ...updates }
  if (updates.isSuspicious !== undefined) data.isSuspicious = updates.isSuspicious
  if (updates.suspiciousReason !== undefined) data.suspiciousReason = updates.suspiciousReason ?? null
  if (updates.justification !== undefined) data.justification = updates.justification ?? null
  try {
    const row = await prisma.commit.update({ where: { hash }, data })
    return mapCommit(row)
  } catch {
    return undefined
  }
}

export async function recomputeTeamRisk(teamId: string): Promise<number> {
  const commits = await prisma.commit.findMany({ where: { teamId } })
  if (commits.length === 0) {
    await prisma.team.update({ where: { id: teamId }, data: { overallRiskScore: 0 } })
    return 0
  }
  let weightedSum = 0
  for (const c of commits) {
    let weight = 1
    if (c.justificationStatus === 'accepted') weight = 0.4
    if (c.justificationStatus === 'rejected') weight = 1.5
    weightedSum += c.riskScore * weight
  }
  const avg = weightedSum / commits.length
  const score = Math.max(0, Math.min(100, Math.round(avg)))
  await prisma.team.update({ where: { id: teamId }, data: { overallRiskScore: score } })
  return score
}

export async function setJustification(hash: string, justification: string): Promise<Commit | undefined> {
  return updateCommit(hash, {
    justification,
    justificationStatus: 'pending' satisfies JustificationStatus,
  })
}

export async function setJustificationReview(hash: string, status: 'accepted' | 'rejected'): Promise<{ commit?: Commit; teamId?: string }> {
  const result = await findCommitByHash(hash)
  const commit = await updateCommit(hash, { justificationStatus: status })
  return { commit, teamId: result?.team.id }
}

export async function getAllLogs(): Promise<ActivityLog[]> {
  const rows = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' } })
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    type: r.type as ActivityLog['type'],
    message: r.message,
    teamName: r.teamName,
    refId: r.refId ?? undefined,
  }))
}

export async function addLog(log: ActivityLog): Promise<void> {
  await prisma.activityLog.create({ data: log as any })
}

export async function getStats(): Promise<HackathonStats> {
  const teams = await prisma.team.findMany({ include: { commits: true } })
  const totalTeams = teams.length
  const totalCommits = teams.reduce((sum, t) => sum + t.commits.length, 0)
  const averageCommits = totalTeams === 0 ? 0 : Math.round((totalCommits / totalTeams) * 10) / 10
  const activeAlerts = teams.reduce(
    (sum, t) => sum + t.commits.filter((c) => c.isSuspicious && c.justificationStatus !== 'accepted').length,
    0,
  )
  return { totalTeams, totalCommits, averageCommits, activeAlerts }
}

export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'organizer' | 'judge';
}): Promise<User> {
  const row = await prisma.user.create({ data })
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User['role'],
    createdAt: row.createdAt.toISOString(),
  }
}

export async function findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; password: string; role: string; createdAt: Date } | undefined> {
  const row = await prisma.user.findUnique({ where: { email } })
  return row ?? undefined
}

export async function resetState(): Promise<void> {
  await prisma.transaction.deleteMany()
  await prisma.block.deleteMany()
  await prisma.commit.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()
}
