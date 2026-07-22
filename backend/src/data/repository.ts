import type { Team, Commit, ActivityLog, HackathonStats, JustificationStatus, ClaimedFeature, InterviewQuestion, User, CommitAnalysisRecord } from '../types/index.js'
import { prisma } from './prisma.js'
import { v4 as uuidv4 } from 'uuid'

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
    readmeContent: t.readmeContent ?? '',
    claimedFeatures: (t.claimedFeatures ?? []) as ClaimedFeature[],
    interviewQuestions: (t.interviewQuestions ?? []) as InterviewQuestion[],
    commits: (t.commits ?? []).map(mapCommit),
  }
}

function mapCommitAnalysis(ca: any): CommitAnalysisRecord {
  return {
    id: ca.id,
    commitHash: ca.commitHash,
    teamId: ca.teamId,
    analysis: ca.analysis,
    model: ca.model,
    createdAt: typeof ca.createdAt === 'string' ? ca.createdAt : ca.createdAt?.toISOString?.() ?? new Date().toISOString(),
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

// In-Memory Fallback Store
const memTeams = new Map<string, Team>()
const memLogs: ActivityLog[] = []
const memUsers = new Map<string, { id: string; email: string; name: string; password: string; role: string; createdAt: Date }>()
const memCommitAnalyses = new Map<string, CommitAnalysisRecord>()

export async function getAllTeams(): Promise<Team[]> {
  try {
    if (prisma.team) {
      const rows = await prisma.team.findMany({ include: teamInclude, orderBy: { createdAt: 'asc' } })
      if (rows.length > 0) return rows.map(mapTeam)
    }
  } catch {
    // fallback
  }
  return Array.from(memTeams.values())
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  try {
    if (prisma.team) {
      const row = await prisma.team.findUnique({ where: { id }, include: teamInclude })
      if (row) return mapTeam(row)
    }
  } catch {
    // fallback
  }
  return memTeams.get(id)
}

export async function findTeamByRepoUrl(repoUrl: string): Promise<Team | undefined> {
  const normalized = repoUrl.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase()
  try {
    if (prisma.team) {
      const all = await prisma.team.findMany({ include: teamInclude })
      const row = all.find((t) => t.repoUrl.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '') === normalized)
      if (row) return mapTeam(row)
    }
  } catch {
    // fallback
  }
  return Array.from(memTeams.values()).find(
    (t) => t.repoUrl.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '') === normalized
  )
}

export async function addTeam(team: Team): Promise<void> {
  memTeams.set(team.id, { ...team, commits: team.commits ? [...team.commits] : [] })
  try {
    if (prisma.team) {
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
          readmeContent: team.readmeContent ?? '',
          claimedFeatures: team.claimedFeatures as any,
          interviewQuestions: team.interviewQuestions as any,
        },
      })
    }
  } catch (err) {
    console.warn('[repository] Prisma addTeam fallback:', err instanceof Error ? err.message : err)
  }
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
  const existing = memTeams.get(id)
  if (existing) {
    const updatedMem = { ...existing, ...updates }
    memTeams.set(id, updatedMem)
  }
  try {
    if (prisma.team) {
      const data: any = { ...updates }
      if (updates.claimedFeatures) data.claimedFeatures = updates.claimedFeatures as any
      if (updates.interviewQuestions) data.interviewQuestions = updates.interviewQuestions as any
      if (updates.commits) delete data.commits
      const row = await prisma.team.update({ where: { id }, data, include: teamInclude })
      return mapTeam(row)
    }
  } catch {
    // fallback
  }
  return memTeams.get(id) || (existing as Team)
}

export async function addCommitToTeam(teamId: string, commit: Commit): Promise<void> {
  const t = memTeams.get(teamId)
  if (t) {
    const commits = t.commits ? t.commits.filter(c => c.hash !== commit.hash) : []
    commits.push(commit)
    t.commits = commits
    memTeams.set(teamId, t)
  }
  try {
    if (prisma.commit) {
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
  } catch (err) {
    console.warn('[repository] Prisma addCommitToTeam fallback:', err instanceof Error ? err.message : err)
  }
}

export async function findCommitByHash(hash: string): Promise<{ team: Team; commit: Commit } | undefined> {
  try {
    if (prisma.commit) {
      const commitRow = await prisma.commit.findUnique({
        where: { hash },
        include: { team: { include: teamInclude } },
      })
      if (commitRow) return { team: mapTeam(commitRow.team), commit: mapCommit(commitRow) }
    }
  } catch {
    // fallback
  }
  for (const t of memTeams.values()) {
    const found = t.commits?.find(c => c.hash === hash)
    if (found) return { team: t, commit: found }
  }
  return undefined
}

export async function updateCommit(hash: string, updates: Partial<Commit>): Promise<Commit | undefined> {
  let targetCommit: Commit | undefined
  for (const t of memTeams.values()) {
    const c = t.commits?.find(x => x.hash === hash)
    if (c) {
      Object.assign(c, updates)
      targetCommit = c
      break
    }
  }
  try {
    if (prisma.commit) {
      const data: any = { ...updates }
      if (updates.isSuspicious !== undefined) data.isSuspicious = updates.isSuspicious
      if (updates.suspiciousReason !== undefined) data.suspiciousReason = updates.suspiciousReason ?? null
      if (updates.justification !== undefined) data.justification = updates.justification ?? null
      const row = await prisma.commit.update({ where: { hash }, data })
      return mapCommit(row)
    }
  } catch {
    // fallback
  }
  return targetCommit
}

export async function recomputeTeamRisk(teamId: string): Promise<number> {
  const team = memTeams.get(teamId)
  const commits = team?.commits || []
  if (commits.length === 0) {
    if (team) team.overallRiskScore = 0
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
  if (team) team.overallRiskScore = score
  try {
    if (prisma.team) {
      await prisma.team.update({ where: { id: teamId }, data: { overallRiskScore: score } })
    }
  } catch {
    // fallback
  }
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
  try {
    if (prisma.activityLog) {
      const rows = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' } })
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          timestamp: r.timestamp,
          type: r.type as ActivityLog['type'],
          message: r.message,
          teamName: r.teamName,
          refId: r.refId ?? undefined,
        }))
      }
    }
  } catch {
    // fallback
  }
  return [...memLogs].reverse()
}

export async function addLog(log: ActivityLog): Promise<void> {
  memLogs.push(log)
  try {
    if (prisma.activityLog) {
      await prisma.activityLog.create({ data: log as any })
    }
  } catch {
    // fallback
  }
}

export async function getStats(): Promise<HackathonStats> {
  const teams = await getAllTeams()
  const totalTeams = teams.length
  const totalCommits = teams.reduce((sum, t) => sum + (t.commits?.length || 0), 0)
  const averageCommits = totalTeams === 0 ? 0 : Math.round((totalCommits / totalTeams) * 10) / 10
  const activeAlerts = teams.reduce(
    (sum, t) => sum + (t.commits || []).filter((c) => c.isSuspicious && c.justificationStatus !== 'accepted').length,
    0,
  )
  return { totalTeams, totalCommits, averageCommits, activeAlerts }
}

export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'team' | 'organizer' | 'judge';
}): Promise<User> {
  const newUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password,
    role: data.role,
    createdAt: new Date(),
  }
  memUsers.set(data.email.toLowerCase(), newUser)
  try {
    if (prisma.user) {
      const row = await prisma.user.create({ data })
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as User['role'],
        createdAt: row.createdAt.toISOString(),
      }
    }
  } catch {
    // fallback
  }
  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role as User['role'],
    createdAt: newUser.createdAt.toISOString(),
  }
}

export async function findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; password: string; role: string; createdAt: Date } | undefined> {
  const mem = memUsers.get(email.toLowerCase())
  if (mem) return mem
  try {
    if (prisma.user) {
      const row = await prisma.user.findUnique({ where: { email } })
      if (row) return row
    }
  } catch {
    // fallback
  }
  return undefined
}

export async function findCommitAnalysisByHash(hash: string): Promise<CommitAnalysisRecord | undefined> {
  const mem = memCommitAnalyses.get(hash)
  if (mem) return mem
  try {
    if (prisma.commitAnalysis) {
      const row = await prisma.commitAnalysis.findUnique({ where: { commitHash: hash } })
      if (row) {
        const mapped = mapCommitAnalysis(row)
        memCommitAnalyses.set(hash, mapped)
        return mapped
      }
    }
  } catch {
    // fallback
  }
  return undefined
}

export async function addCommitAnalysis(data: {
  commitHash: string;
  teamId: string;
  analysis: string;
  model: string;
  id?: string;
  createdAt?: string;
}): Promise<CommitAnalysisRecord> {
  const existing = memCommitAnalyses.get(data.commitHash)
  if (existing) return existing

  const record: CommitAnalysisRecord = {
    id: data.id ?? 'analysis-' + uuidv4(),
    commitHash: data.commitHash,
    teamId: data.teamId,
    analysis: data.analysis,
    model: data.model,
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
  memCommitAnalyses.set(data.commitHash, record)

  try {
    if (prisma.commitAnalysis) {
      const row = await prisma.commitAnalysis.upsert({
        where: { commitHash: data.commitHash },
        create: {
          id: record.id,
          commitHash: record.commitHash,
          teamId: record.teamId,
          analysis: record.analysis,
          model: record.model,
        },
        update: {},
      })
      const mapped = mapCommitAnalysis(row)
      memCommitAnalyses.set(data.commitHash, mapped)
      return mapped
    }
  } catch (err) {
    console.warn('[repository] Prisma addCommitAnalysis fallback:', err instanceof Error ? err.message : err)
  }

  return record
}

export async function resetState(): Promise<void> {
  memUsers.clear()
  memTeams.clear()
  memCommitAnalyses.clear()
  memLogs.length = 0
  try {
    if (prisma.transaction) await prisma.transaction.deleteMany()
    if (prisma.block) await prisma.block.deleteMany()
    if (prisma.commitAnalysis) await prisma.commitAnalysis.deleteMany()
    if (prisma.commit) await prisma.commit.deleteMany()
    if (prisma.activityLog) await prisma.activityLog.deleteMany()
    if (prisma.team) await prisma.team.deleteMany()
    if (prisma.user) await prisma.user.deleteMany()
  } catch {
    // ignore
  }
}
