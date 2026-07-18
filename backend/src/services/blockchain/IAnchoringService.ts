export interface AnchorPayload {
  commitHash: string
  author: string
  timestamp: number
  aiSummaryHash: string
  riskScore: number
}

export interface AnchorResult {
  blockchainTx: string
  blockchainStatus: 'verified' | 'failed' | 'pending'
  blockNumber?: number
  eventHash?: string
}

export interface IAnchoringService {
  isConfigured(): boolean
  anchorCommit(payload: AnchorPayload): Promise<AnchorResult>
  mode(): string
}
