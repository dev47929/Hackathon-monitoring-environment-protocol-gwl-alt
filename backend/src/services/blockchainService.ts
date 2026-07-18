import crypto from 'node:crypto'
import { config } from '../config/index.js'
import { DummyBlockchainService } from './blockchain/dummyChain.js'
import type { IAnchoringService, AnchorPayload, AnchorResult } from './blockchain/IAnchoringService.js'

export type { IAnchoringService, AnchorPayload, AnchorResult }

let _instance: IAnchoringService | null = null

function getService(): IAnchoringService {
  if (!_instance) {
    const mode = config.blockchain.blockchainMode
    switch (mode) {
      case 'dummy':
        _instance = new DummyBlockchainService()
        break
      case 'off':
        _instance = { isConfigured: () => false, anchorCommit: async () => ({ blockchainTx: '', blockchainStatus: 'pending' as const }), mode: () => 'off' }
        break
      default:
        _instance = new DummyBlockchainService()
    }
  }
  return _instance
}

export const blockchainService: IAnchoringService = new Proxy({} as IAnchoringService, {
  get(_target, prop: keyof IAnchoringService) {
    return getService()[prop]
  },
})

export function computeAiSummaryHash(aiSummary: string): string {
  return crypto.createHash('sha256').update(aiSummary, 'utf8').digest('hex')
}

export default blockchainService
