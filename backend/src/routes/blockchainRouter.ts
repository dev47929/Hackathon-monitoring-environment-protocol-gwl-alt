import { Router } from 'express'
import { asyncHandler, notFound } from '../utils/errors.js'
import { prisma } from '../data/prisma.js'
import { blockchainService } from '../services/blockchainService.js'

export const blockchainRouter: Router = Router()

blockchainRouter.get('/blockchain/blocks', asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 20, 1), 100)
  const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0)

  const [blocks, total] = await Promise.all([
    prisma.block.findMany({
      orderBy: { number: 'desc' },
      take: limit,
      skip: offset,
      include: { transactions: true },
    }),
    prisma.block.count(),
  ])

  const mapped = blocks.map((b) => ({
    number: b.number,
    hash: b.hash,
    parentHash: b.parentHash,
    timestamp: b.timestamp.toISOString(),
    minerAddress: b.minerAddress,
    gasUsed: b.gasUsed.toString(),
    txCount: b.txCount,
    transactions: b.transactions.map((tx) => ({
      hash: tx.hash,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      status: tx.status,
      eventHash: tx.eventHash,
      commitHash: tx.commitHash,
    })),
  }))

  res.json({ blocks: mapped, total, limit, offset })
}))

blockchainRouter.get('/blockchain/tx/:hash', asyncHandler(async (req, res) => {
  const tx = await prisma.transaction.findUnique({
    where: { hash: req.params.hash },
    include: { block: true },
  })
  if (!tx) throw notFound(`Transaction ${req.params.hash} not found.`)

  res.json({
    hash: tx.hash,
    blockNumber: tx.blockNumber,
    blockHash: tx.block.hash,
    fromAddress: tx.fromAddress,
    toAddress: tx.toAddress,
    nonce: tx.nonce,
    input: tx.input,
    status: tx.status,
    gasUsed: tx.gasUsed.toString(),
    cumulativeGasUsed: tx.cumulativeGasUsed.toString(),
    logIndex: tx.logIndex,
    eventHash: tx.eventHash,
    commitHash: tx.commitHash,
    createdAt: tx.createdAt.toISOString(),
  })
}))

blockchainRouter.get('/blockchain/tx/by-commit/:commitHash', asyncHandler(async (req, res) => {
  const tx = await prisma.transaction.findFirst({
    where: { commitHash: req.params.commitHash },
    include: { block: true },
  })
  if (!tx) throw notFound(`No transaction found for commit ${req.params.commitHash}.`)

  res.json({
    hash: tx.hash,
    blockNumber: tx.blockNumber,
    blockHash: tx.block.hash,
    fromAddress: tx.fromAddress,
    toAddress: tx.toAddress,
    nonce: tx.nonce,
    input: tx.input,
    status: tx.status,
    gasUsed: tx.gasUsed.toString(),
    cumulativeGasUsed: tx.cumulativeGasUsed.toString(),
    logIndex: tx.logIndex,
    eventHash: tx.eventHash,
    commitHash: tx.commitHash,
    createdAt: tx.createdAt.toISOString(),
  })
}))

blockchainRouter.get('/blockchain/mode', asyncHandler(async (_req, res) => {
  res.json({ mode: blockchainService.mode(), configured: blockchainService.isConfigured() })
}))
