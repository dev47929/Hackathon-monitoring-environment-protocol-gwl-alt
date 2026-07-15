import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export interface NormalizedWebhookInput {
  repoUrl: string;
  teamId?: string;
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
}

function normalizeRepoUrl(url: string): string {
  return url.trim().replace(/\.git$/, '').replace(/\/$/, '');
}

export function normalizeWebhookPayload(req: Request): NormalizedWebhookInput {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    throw Object.assign(new Error('Webhook payload must be a JSON object.'), { statusCode: 400 });
  }

  if (body.head_commit && body.repository && body.commits) {
    const repo = body.repository;
    const head = body.head_commit;
    const cfg = head || body.commits?.[0];
    if (!cfg) {
      throw Object.assign(new Error('Webhook (push) payload missing commit data.'), { statusCode: 400 });
    }
    return {
      repoUrl: normalizeRepoUrl(repo.html_url || repo.clone_url),
      commit: {
        hash: cfg.id || cfg.sha || cfg.hash,
        author: cfg.author?.name || cfg.committer?.name || 'unknown',
        message: String(cfg.message || ''),
        changedFiles: cfg.added?.length || cfg.modified?.length
          ? [...(cfg.added || []), ...(cfg.modified || []), ...(cfg.removed || [])]
          : cfg.files?.map((f: { filename: string }) => f.filename) || [],
        additions: Number(body.stats?.additions ?? cfg.additions ?? 0),
        deletions: Number(body.stats?.deletions ?? cfg.deletions ?? 0),
        timestamp: cfg.timestamp || cfg.author?.date,
      },
    };
  }

  if (body.repoUrl && body.commit && body.commit.hash) {
    const c = body.commit;
    const changedFiles = Array.isArray(c.changedFiles)
      ? c.changedFiles.map((f: unknown) => (typeof f === 'string' ? f : String((f as { filename?: string })?.filename || ''))).filter(Boolean)
      : [];
    return {
      repoUrl: normalizeRepoUrl(String(body.repoUrl)),
      teamId: typeof body.teamId === 'string' ? body.teamId : undefined,
      commit: {
        hash: String(c.hash),
        author: String(c.author ?? 'unknown'),
        message: String(c.message ?? ''),
        changedFiles,
        additions: Number(c.additions ?? 0), deletions: Number(c.deletions ?? 0),
        timestamp: c.timestamp,
        patch: c.patch,
      },
    };
  }

  throw Object.assign(new Error('Unsupported webhook payload. Expected { repoUrl, commit:{hash, author, message, changedFiles, additions, deletions} } or native GitHub push payload.'), { statusCode: 400 });
}

export function makeLogId(): string {
  return 'log-' + uuidv4().slice(0, 8);
}

export function assertBodyField<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    throw Object.assign(new Error(`Missing required field: ${name}.`), { statusCode: 422 });
  }
  return value;
}

export function parseStringBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.method === 'POST' && (!req.headers['content-type'] || req.headers['content-type'].includes('text/plain'))) {
    return next();
  }
  next();
}
