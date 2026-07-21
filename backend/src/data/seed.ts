import crypto from 'node:crypto'
import { prisma } from './prisma.js'
import seedData from '../../../shared/seed-data.json' with { type: 'json' }

export async function seedIfEmpty(): Promise<void> {
  const count = await prisma.team.count()
  if (count > 0) return

  console.log('[seed] Database empty — seeding initial data...')

  const commitData: Record<string, typeof seedData.teams[number]['commits']> = {}
  const claimedFeaturesData: Record<string, any[]> = {}
  const interviewQuestionsData: Record<string, any[]> = {}

  for (const team of seedData.teams) {
    const { commits, claimedFeatures, interviewQuestions, ...teamData } = team
    commitData[team.id] = commits
    claimedFeaturesData[team.id] = claimedFeatures as any[]
    interviewQuestionsData[team.id] = interviewQuestions as any[]

    await prisma.team.create({
      data: {
        ...teamData,
        claimedFeatures: claimedFeatures as any,
        interviewQuestions: interviewQuestions as any,
      },
    })
  }

  for (const [teamId, commits] of Object.entries(commitData)) {
    for (const c of commits) {
      await prisma.commit.create({
        data: {
          hash: c.hash,
          teamId,
          timestamp: c.timestamp,
          author: c.author,
          message: c.message,
          changedFiles: c.changedFiles,
          additions: c.additions,
          deletions: c.deletions,
          aiSummary: c.aiSummary,
          featureEvolution: c.featureEvolution,
          category: c.category,
          blockchainTx: c.blockchainTx,
          blockchainStatus: c.blockchainStatus,
          isSuspicious: c.isSuspicious ?? false,
          suspiciousReason: c.suspiciousReason ?? null,
          riskScore: c.riskScore,
          justification: (c as any).justification ?? null,
          justificationStatus: c.justificationStatus,
        },
      })
    }
  }

  for (const log of seedData.activityLogs) {
    await prisma.activityLog.create({ data: log as any })
  }

  const allTxHashes: string[] = []
  for (const commits of Object.values(commitData)) {
    for (const c of commits) {
      allTxHashes.push(c.blockchainTx)
    }
  }

  const genesisBlockHash = '0x' + '0'.repeat(64)
  await prisma.block.create({
    data: {
      number: 0,
      hash: genesisBlockHash,
      parentHash: '0x' + '0'.repeat(64),
      timestamp: new Date('2026-07-04T08:00:00-07:00'),
      gasUsed: BigInt(0),
      txCount: allTxHashes.length,
    },
  })

  for (let i = 0; i < allTxHashes.length; i++) {
    const inputJson = JSON.stringify({ seed: true, index: i })
    const eventHash = '0x' + crypto.createHash('sha256').update(allTxHashes[i]).digest('hex')
    await prisma.transaction.create({
      data: {
        hash: allTxHashes[i],
        blockNumber: 0,
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: '0x74f2e4129bb882ca1a654921b777a888c3a9f02c',
        nonce: i,
        input: inputJson as any,
        status: 'verified',
        gasUsed: BigInt(21000),
        cumulativeGasUsed: BigInt(21000 * (i + 1)),
        logIndex: i,
        eventHash,
      },
    })
  }

  console.log(`[seed] Created ${seedData.teams.length} teams, ${allTxHashes.length} commits, 1 genesis block with ${allTxHashes.length} transactions.`)
}
