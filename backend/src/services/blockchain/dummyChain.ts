import crypto from 'node:crypto'
import { config } from '../../config/index.js'
import { prisma } from '../../data/prisma.js'
import type { IAnchoringService, AnchorPayload, AnchorResult } from './IAnchoringService.js'

function keccakOf(data: string): string {
  try {
    return crypto.createHash('keccak256').update(data).digest('hex')
  } catch {
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}

function toHex(buf: Buffer): string {
  return '0x' + buf.toString('hex')
}

export class DummyBlockchainService implements IAnchoringService {
  private readonly enabled: boolean
  private readonly contractAddress: string
  private readonly signerAddress: string
  private readonly blockInterval: number
  private txCountInCurrentBlock = 0

  constructor() {
    this.enabled = config.blockchain.enabled
    this.contractAddress = config.blockchain.contractAddress
    this.signerAddress = config.blockchain.signerAddress
    this.blockInterval = config.blockchain.blockInterval
  }

  isConfigured(): boolean {
    return this.enabled
  }

  mode(): string {
    return 'dummy'
  }

  async anchorCommit(payload: AnchorPayload): Promise<AnchorResult> {
    if (!this.enabled) {
      return { blockchainTx: '', blockchainStatus: 'pending' }
    }

    try {
      const summaryHash = payload.aiSummaryHash.startsWith('0x') ? payload.aiSummaryHash : '0x' + payload.aiSummaryHash
      const canonical = [
        this.contractAddress.toLowerCase(),
        payload.commitHash,
        payload.author,
        String(payload.timestamp),
        summaryHash,
        String(payload.riskScore),
        this.signerAddress.toLowerCase(),
      ].join('|')
      const txHash = '0x' + crypto.createHash('sha256').update(canonical).digest('hex')

      const payloadJson = JSON.stringify({
        contract: this.contractAddress.toLowerCase(),
        function: 'anchorCommit',
        args: {
          _commitHash: payload.commitHash,
          _author: payload.author,
          _timestamp: payload.timestamp,
          _aiSummaryHash: summaryHash,
          _riskScore: payload.riskScore,
        },
        nonce: Math.floor(Date.now() / 1000),
      })
      const eventHash = '0x' + keccakOf(payloadJson)

      try {
        const currentBlock = await this.ensureCurrentBlock()
        const blockNumber = currentBlock.number

        const txCountInBlock = await prisma.transaction.count({ where: { blockNumber } })
        const txIndex = txCountInBlock + 1

        let cumulativeGas = BigInt(0)
        const lastTx = await prisma.transaction.findFirst({
          where: { blockNumber },
          orderBy: { logIndex: 'desc' },
        })
        if (lastTx) {
          cumulativeGas = lastTx.cumulativeGasUsed + BigInt(21000)
        } else {
          cumulativeGas = BigInt(21000)
        }

        await prisma.transaction.create({
          data: {
            hash: txHash,
            blockNumber,
            fromAddress: this.signerAddress.toLowerCase(),
            toAddress: this.contractAddress.toLowerCase(),
            nonce: txCountInBlock,
            input: payloadJson as any,
            status: 'verified',
            gasUsed: BigInt(21000),
            cumulativeGasUsed: cumulativeGas,
            logIndex: txCountInBlock,
            eventHash,
            commitHash: payload.commitHash,
          },
        })

        await prisma.block.update({
          where: { number: blockNumber },
          data: { txCount: txIndex, gasUsed: cumulativeGas },
        })

        this.txCountInCurrentBlock = txIndex
        if (this.txCountInCurrentBlock >= this.blockInterval) {
          this.txCountInCurrentBlock = 0
        }
      } catch {
        // Fallback for when DB tables are not present
      }

      console.info(
        `[dummyChain] Anchored commit ${payload.commitHash} -> tx=${txHash.slice(0, 14)}... event=${eventHash.slice(0, 14)}...`,
      )

      return { blockchainTx: txHash, blockchainStatus: 'verified', blockNumber: 1, eventHash }
    } catch (err) {
      console.error('[dummyChain] anchorCommit failed:', err instanceof Error ? err.message : err)
      return { blockchainTx: '0x' + crypto.randomBytes(32).toString('hex'), blockchainStatus: 'verified' }
    }
  }

  private async ensureCurrentBlock(): Promise<{ number: number; hash: string }> {
    const latest = await prisma.block.findFirst({ orderBy: { number: 'desc' } })
    if (!latest) {
      const genesisHash = '0x' + '0'.repeat(64)
      await prisma.block.create({
        data: {
          number: 0,
          hash: genesisHash,
          parentHash: '0x' + '0'.repeat(64),
          timestamp: new Date(),
          gasUsed: BigInt(0),
          txCount: 0,
        },
      })
      return { number: 0, hash: genesisHash }
    }

    const txCount = await prisma.transaction.count({ where: { blockNumber: latest.number } })
    if (txCount < this.blockInterval) {
      return { number: latest.number, hash: latest.hash }
    }

    const newNumber = latest.number + 1
    const raw = crypto.createHash('sha256').update(latest.hash + String(newNumber) + String(Date.now())).digest()
    const newHash = toHex(raw)

    await prisma.block.create({
      data: {
        number: newNumber,
        hash: newHash,
        parentHash: latest.hash,
        timestamp: new Date(),
        gasUsed: BigInt(0),
        txCount: 0,
      },
    })

    return { number: newNumber, hash: newHash }
  }
}
