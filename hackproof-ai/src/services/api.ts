import { Team, HackathonStats, ActivityLog, BlocksResponse, TransactionDetail, BlockchainMode, CommitAnalysisRecord } from '../types';

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : (import.meta.env.VITE_API_BASE_URL ?? '');

const TOKEN_KEY = 'hackproof_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) return { 'Authorization': `Bearer ${token}` };
  return {};
}

/**
 * Global API Error handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    let message: string;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.message || errorBody;
      if (parsed.details?.fieldErrors) {
        const fields = Object.entries(parsed.details.fieldErrors)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
          .join('; ');
        if (fields) message += ` (${fields})`;
      }
    } catch {
      message = errorBody || `HTTP error! Status: ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...options?.headers } });
    return await handleResponse<T>(res);
  } catch (err) {
    throw err;
  }
}

/**
 * 1. Hackathon Teams Client
 */
export const TeamsAPI = {
  async getAll(): Promise<Team[]> {
    return apiFetch<Team[]>(`${API_BASE}/api/teams`);
  },

  async register(payload: {
    name: string;
    repoUrl: string;
    avatar: string;
    techStack: string[];
    members: string[];
    description: string;
    readmeContent?: string;
    email?: string;
    password?: string;
  }): Promise<{ status: string; message: string; data: { id: string; name: string; progress: number; commitsCount: number; email?: string } }> {
    return apiFetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async update(id: string, updates: {
    name?: string;
    avatar?: string;
    techStack?: string[];
    members?: string[];
    progress?: number;
    description?: string;
    readmeContent?: string;
    claimedFeatures?: {
      id: string;
      claim: string;
      expectedEvidence?: string;
      actualCodeReference?: string;
      status: 'verified' | 'unverified' | 'partially';
    }[];
  }): Promise<{ status: string; data: Record<string, unknown> }> {
    return apiFetch(`${API_BASE}/api/teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async sendReport(id: string, email: string, reportText: string): Promise<{ status: string; message: string; forwarded: boolean }> {
    return apiFetch(`${API_BASE}/api/teams/${id}/send-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reportText })
    });
  }
};

/**
 * 2. Webhook & Justification Client
 */
export const CommitsAPI = {
  async simulateWebhook(payload: {
    repoUrl: string;
    commit: {
      hash: string;
      author: string;
      message: string;
      changedFiles: string[];
      additions: number;
      deletions: number;
      timestamp?: string;
      patch?: string;
    };
  }): Promise<{
    status: string;
    commitHash: string;
    aiSummary: string;
    category: string;
    riskScore: number;
    blockchainTx: string;
    blockchainStatus: string;
    blockNumber?: number;
    eventHash?: string;
    isSuspicious: boolean;
    suspiciousReason?: string;
    teamName: string;
    overallRiskScore: number;
  }> {
    return apiFetch(`${API_BASE}/api/webhooks/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async submitJustification(hash: string, justification: string): Promise<{ status: string; message: string }> {
    return apiFetch(`${API_BASE}/api/${hash}/justification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ justification })
    });
  },

  async reviewJustification(hash: string, status: 'accepted' | 'rejected'): Promise<{ status: string; hash: string; newOverallRiskScore: number }> {
    return apiFetch(`${API_BASE}/api/${hash}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  async analyzeCommit(hash: string): Promise<CommitAnalysisRecord> {
    return apiFetch<CommitAnalysisRecord>(`${API_BASE}/api/${hash}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * 3. Live Presentation Auditor Client
 */
export const DemoAuditAPI = {
  async auditPresentation(teamId: string, transcript: string): Promise<{
    status: string;
    results: {
      claim: string;
      status: 'verified' | 'unverified' | 'partially';
      evidence: string;
      confidence: number;
    }[];
  }> {
    return apiFetch(`${API_BASE}/api/teams/${teamId}/verify-presentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
  }
};

/**
 * 4. Stats & Logging Clients
 */
export const AnalyticsAPI = {
  async getStats(): Promise<HackathonStats> {
    return apiFetch<HackathonStats>(`${API_BASE}/api/stats`);
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    return apiFetch<ActivityLog[]>(`${API_BASE}/api/activity-logs`);
  }
};

/**
 * 5. Blockchain Explorer Client
 */
export const BlockchainAPI = {
  async getBlocks(limit = 20, offset = 0): Promise<BlocksResponse> {
    return apiFetch<BlocksResponse>(`${API_BASE}/api/blockchain/blocks?limit=${limit}&offset=${offset}`);
  },

  async getTransaction(hash: string): Promise<TransactionDetail> {
    return apiFetch<TransactionDetail>(`${API_BASE}/api/blockchain/tx/${encodeURIComponent(hash)}`);
  },

  async getTransactionByCommit(commitHash: string): Promise<TransactionDetail> {
    return apiFetch<TransactionDetail>(`${API_BASE}/api/blockchain/tx/by-commit/${encodeURIComponent(commitHash)}`);
  },

  async getMode(): Promise<BlockchainMode> {
    return apiFetch<BlockchainMode>(`${API_BASE}/api/blockchain/mode`);
  }
};

/**
 * 6. Authentication Client
 */
export const AuthAPI = {
  async register(data: {
    email: string;
    name: string;
    password: string;
    role: 'team' | 'organizer' | 'judge';
    teamId?: string;
  }): Promise<{ status: string; message: string; data: { user: { id: string; email: string; name: string; role: string; teamId?: string; createdAt: string }; token: string } }> {
    return apiFetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async login(email: string, password: string): Promise<{ status: string; data: { user: { id: string; email: string; name: string; role: string; teamId?: string; createdAt: string }; token: string } }> {
    return apiFetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },
};
