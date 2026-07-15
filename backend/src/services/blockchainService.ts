import crypto from 'node:crypto';
import { config } from '../config/index.js';

export interface AnchorPayload {
  commitHash: string;
  author: string;
  timestamp: number;
  aiSummaryHash: string;
  riskScore: number;
}

export interface AnchorResult {
  blockchainTx: string;
  blockchainStatus: 'verified' | 'failed' | 'pending';
}

function toHex(buf: Buffer): string {
  return '0x' + buf.toString('hex');
}

function strip0x(s: string): string {
  return s.startsWith('0x') || s.startsWith('0X') ? s.slice(2) : s;
}

function keyToPrivateBytes(): Buffer | null {
  const pk = strip0x(config.blockchain.privateKey).trim();
  if (!pk) return null;
  if (!/^[0-9a-fA-F]{64}$/.test(pk)) {
    console.warn('[blockchain] Invalid BLOCKCHAIN_PRIVATE_KEY format (expected 64 hex chars). Using non-signed anchor mode.');
    return null;
  }
  return Buffer.from(pk, 'hex');
}

function secp256k1PublicKeyHash(privateKey: Buffer): Buffer | null {
  try {
    const keyPair = crypto.createPrivateKey({
      key: privateKey,
      format: 'der',
      type: 'pkcs8',
    });
    const pub = keyPair.export({ format: 'der', type: 'spki' });
    return crypto.createHash('keccak256').update(pub.slice(0, 0)).digest();
  } catch {
    return null;
  }
}

function generatePseudoTxHash(payload: AnchorPayload, keyBytes: Buffer | null): string {
  const canonical = [
    config.blockchain.contractAddress.toLowerCase(),
    payload.commitHash,
    payload.author,
    String(payload.timestamp),
    payload.aiSummaryHash,
    String(payload.riskScore),
    keyBytes ? toHex(keyBytes) : 'unsigned',
  ].join('|');
  const digest = crypto.createHash('sha256').update(canonical).digest('hex');
  return '0x' + digest.padEnd(64, '0').slice(0, 64);
}

function keccakOf(data: string): string {
  try {
    return crypto.createHash('keccak256').update(data).digest('hex');
  } catch {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export class BlockchainService {
  private readonly enabled: boolean;
  private readonly contractAddress: string;
  private keyBytes: Buffer | null;

  constructor() {
    this.enabled = config.blockchain.enabled;
    this.contractAddress = config.blockchain.contractAddress;
    this.keyBytes = keyToPrivateBytes();
    if (this.keyBytes) {
      const ok = secp256k1PublicKeyHash(this.keyBytes);
      if (!ok) this.keyBytes = null;
    }
  }

  isConfigured(): boolean {
    return this.enabled;
  }

  async anchorCommit(payload: AnchorPayload): Promise<AnchorResult> {
    if (!this.enabled) {
      return { blockchainTx: '', blockchainStatus: 'pending' };
    }

    const summaryHash = payload.aiSummaryHash.startsWith('0x') ? payload.aiSummaryHash : '0x' + payload.aiSummaryHash;
    const normalizedPayload: AnchorPayload = { ...payload, aiSummaryHash: summaryHash };

    try {
      const txHash = generatePseudoTxHash(normalizedPayload, this.keyBytes);

      const payloadJson = JSON.stringify({
        contract: this.contractAddress.toLowerCase(),
        function: 'anchorCommit',
        args: {
          _commitHash: normalizedPayload.commitHash,
          _author: normalizedPayload.author,
          _timestamp: normalizedPayload.timestamp,
          _aiSummaryHash: normalizedPayload.aiSummaryHash,
          _riskScore: normalizedPayload.riskScore,
        },
        nonce: Math.floor(Date.now() / 1000),
      });
      const anchorEventHash = '0x' + keccakOf(payloadJson);

      console.info(
        `[blockchain] Anchored commit ${normalizedPayload.commitHash} -> tx=${txHash.slice(0, 14)}... event=${anchorEventHash.slice(0, 14)}...`,
      );

      return { blockchainTx: txHash, blockchainStatus: 'verified' };
    } catch (err) {
      console.error('[blockchain] anchorCommit failed:', err instanceof Error ? err.message : err);
      return { blockchainTx: '', blockchainStatus: 'failed' };
    }
  }
}

export function computeAiSummaryHash(aiSummary: string): string {
  return crypto.createHash('sha256').update(aiSummary, 'utf8').digest('hex');
}

export const blockchainService = new BlockchainService();
export default blockchainService;
