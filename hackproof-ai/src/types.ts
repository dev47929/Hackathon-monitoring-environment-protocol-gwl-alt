export interface Commit {
  hash: string;
  timestamp: string;
  author: string;
  message: string;
  changedFiles: string[];
  additions: number;
  deletions: number;
  aiSummary: string;
  featureEvolution: string;
  category: 'frontend' | 'backend' | 'blockchain' | 'database' | 'ai' | 'docs' | 'other';
  blockchainTx: string;
  blockchainStatus: 'verified' | 'failed' | 'pending';
  blockNumber?: number;
  eventHash?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  riskScore: number; // 0 to 100
  justification?: string; // Team explanation for flagged commit
  justificationStatus: 'none' | 'pending' | 'accepted' | 'rejected';
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  repoUrl: string;
  avatar: string;
  techStack: string[];
  members: string[];
  progress: number; // 0 to 100
  commits: Commit[];
  overallRiskScore: number; // 0 to 100
  description: string;
  claimedFeatures: {
    id: string;
    claim: string;
    expectedEvidence: string;
    actualCodeReference: string;
    status: 'verified' | 'unverified' | 'partially';
  }[];
  interviewQuestions: {
    id: string;
    question: string;
    context: string;
    suggestedAnswer: string;
  }[];
}

export interface HackathonStats {
  totalTeams: number;
  totalCommits: number;
  averageCommits: number;
  activeAlerts: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  message: string;
  teamName: string;
  refId?: string; // commit hash or rollback ID
}

export interface AuthenticatedUser {
  email: string;
  name: string;
  role: 'team' | 'judge' | 'organizer';
  teamId?: string; // Present if role is 'team'
}

export interface BlockTransaction {
  hash: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  eventHash?: string;
  commitHash?: string;
}

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: string;
  minerAddress: string;
  gasUsed: string;
  txCount: number;
  transactions: BlockTransaction[];
}

export interface BlocksResponse {
  blocks: Block[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionDetail {
  hash: string;
  blockNumber: number;
  blockHash: string;
  fromAddress: string;
  toAddress: string;
  nonce: number;
  input: unknown;
  status: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  logIndex: number;
  eventHash?: string;
  commitHash?: string;
  createdAt: string;
}

export interface BlockchainMode {
  mode: string;
  configured: boolean;
}

