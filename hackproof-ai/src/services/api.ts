import { Team, Commit, HackathonStats, ActivityLog } from '../types';

const API_BASE = ''; // Proxy handles the base URL redirection to backend

/**
 * Global API Error handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || `HTTP error! Status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * 1. Hackathon Teams Client
 */
export const TeamsAPI = {
  // Fetch all active teams
  async getAll(): Promise<Team[]> {
    const res = await fetch(`${API_BASE}/api/teams`);
    return handleResponse<Team[]>(res);
  },

  // Register a new team and sync repo
  async register(payload: {
    name: string;
    repoUrl: string;
    avatar: string;
    techStack: string[];
    members: string[];
    description: string;
  }): Promise<{ status: string; message: string; data: Team }> {
    const res = await fetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Update a team's attributes
  async update(id: string, updates: Partial<Team>): Promise<Team> {
    const res = await fetch(`${API_BASE}/api/teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<Team>(res);
  }
};

/**
 * 2. Webhook & Justification Client
 */
export const CommitsAPI = {
  // Simulate pushing a new commit webhook
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
    isSuspicious: boolean;
    suspiciousReason?: string;
    teamName: string;
    overallRiskScore: number;
  }> {
    const res = await fetch(`${API_BASE}/api/webhooks/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Submit hacker explanation for flagged commit
  async submitJustification(hash: string, justification: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/${hash}/justification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ justification })
    });
    return handleResponse(res);
  },

  // Accept or reject a hacker justification (Judges only)
  async reviewJustification(hash: string, status: 'accepted' | 'rejected'): Promise<{ status: string; hash: string; newOverallRiskScore: number }> {
    const res = await fetch(`${API_BASE}/api/${hash}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  }
};

/**
 * 3. Live Presentation Auditor Client
 */
export const DemoAuditAPI = {
  // Submit presentation notes / transcript for claim cross-referencing
  async auditPresentation(teamId: string, transcript: string): Promise<{
    status: string;
    results: {
      claim: string;
      status: 'verified' | 'unverified' | 'partially';
      evidence: string;
      confidence: number;
    }[];
  }> {
    const res = await fetch(`${API_BASE}/api/teams/${teamId}/verify-presentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    return handleResponse(res);
  }
};

/**
 * 4. Stats & Logging Clients
 */
export const AnalyticsAPI = {
  // Fetch overall statistics
  async getStats(): Promise<HackathonStats> {
    const res = await fetch(`${API_BASE}/api/stats`);
    return handleResponse<HackathonStats>(res);
  },

  // Fetch log history
  async getActivityLogs(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/api/activity-logs`);
    return handleResponse<ActivityLog[]>(res);
  }
};
