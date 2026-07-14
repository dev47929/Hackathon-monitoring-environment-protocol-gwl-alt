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
  isSuspicious?: boolean;
  suspiciousReason?: string;
  riskScore: number; // 0 to 100
  justification?: string; // Team explanation for flagged commit
  justificationStatus: 'none' | 'pending' | 'accepted' | 'rejected';
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

