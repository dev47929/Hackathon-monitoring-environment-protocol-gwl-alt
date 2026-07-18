export type Category = 'frontend' | 'backend' | 'blockchain' | 'database' | 'ai' | 'docs' | 'other';

export type BlockchainStatus = 'verified' | 'failed' | 'pending';

export type JustificationStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export type ClaimStatus = 'verified' | 'unverified' | 'partially';

export type ActivityLogType = 'info' | 'warning' | 'success' | 'danger';

export type PresentationStatus = 'verified' | 'unverified' | 'partially';

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
  category: Category;
  blockchainTx: string;
  blockchainStatus: BlockchainStatus;
  blockNumber?: number;
  eventHash?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  riskScore: number;
  justification?: string;
  justificationStatus: JustificationStatus;
  teamId?: string;
}

export interface ClaimedFeature {
  id: string;
  claim: string;
  expectedEvidence: string;
  actualCodeReference: string;
  status: ClaimStatus;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  suggestedAnswer: string;
}

export interface Team {
  id: string;
  name: string;
  repoUrl: string;
  avatar: string;
  techStack: string[];
  members: string[];
  progress: number;
  commits: Commit[];
  overallRiskScore: number;
  description: string;
  claimedFeatures: ClaimedFeature[];
  interviewQuestions: InterviewQuestion[];
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
  type: ActivityLogType;
  message: string;
  teamName: string;
  refId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'organizer' | 'judge';
  createdAt: string;
}

export interface AuthenticatedUser {
  email: string;
  name: string;
  role: 'team' | 'judge' | 'organizer';
  teamId?: string;
}

export interface PresentationResult {
  claim: string;
  status: PresentationStatus;
  evidence: string;
  confidence: number;
}

export interface CommitAnalysis {
  category: Category;
  aiSummary: string;
  featureEvolution: string;
  riskScore: number;
  isSuspicious: boolean;
  suspiciousReason: string | null;
}

export interface InterviewQuestionAI {
  question: string;
  context: string;
  suggestedAnswer: string;
}

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
