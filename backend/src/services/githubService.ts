import crypto from 'node:crypto';
import { config } from '../config/index.js';

export interface RepoLoc {
  owner: string;
  repo: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; email?: string; date: string };
    message: string;
  };
  stats?: { total: number; additions: number; deletions: number };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export class GitHubService {
  private readonly token: string;
  private readonly apiBase: string;
  private readonly apiVersion: string;

  constructor() {
    this.token = config.github.personalAccessToken;
    this.apiBase = config.github.apiBase;
    this.apiVersion = config.github.apiVersion;
  }

  static parseRepoUrl(repoUrl: string): RepoLoc {
    const stripped = repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
    const [owner, repo] = stripped.split('/');
    if (!owner || !repo) {
      throw Object.assign(new Error(`Unable to parse GitHub owner/repo from URL: ${repoUrl}`), { statusCode: 422 });
    }
    return { owner, repo };
  }

  static verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string): boolean {
    if (!signatureHeader || typeof signatureHeader !== 'string') return false;
    const expected = 'sha256=';
    if (!signatureHeader.startsWith(expected)) return false;
    const received = signatureHeader.slice(expected.length);
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const receivedBuf = Buffer.from(received, 'utf8');
    const computedBuf = Buffer.from(computed, 'utf8');
    if (receivedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(receivedBuf, computedBuf);
  }

  isConfigured(): boolean {
    return this.token.length > 0;
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': this.apiVersion,
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      'User-Agent': 'hackproof-ai-backend',
    };
  }

  async fetchRepoMetadata(owner: string, repo: string): Promise<Record<string, unknown>> {
    const url = `${this.apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw Object.assign(new Error(`GitHub: failed to fetch repo metadata (${res.status})`), {
        statusCode: res.status === 404 ? 404 : 502,
      });
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async fetchCommits(owner: string, repo: string, opts: { branch?: string; perPage?: number } = {}): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({
      ...(opts.branch ? { sha: opts.branch } : {}),
      ...(opts.perPage ? { per_page: String(opts.perPage) } : { per_page: '30' }),
    });
    const url = `${this.apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw Object.assign(new Error(`GitHub: failed to fetch commit stream (${res.status})`), { statusCode: 502 });
    }
    return (await res.json()) as GitHubCommit[];
  }

  async fetchCommitDetail(owner: string, repo: string, ref: string): Promise<GitHubCommit> {
    const url = `${this.apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(ref)}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw Object.assign(new Error(`GitHub: failed to fetch commit detail (${res.status})`), { statusCode: 502 });
    }
    return (await res.json()) as GitHubCommit;
  }
}

export const githubService = new GitHubService();
export default githubService;
