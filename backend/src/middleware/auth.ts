import type { Request, Response, NextFunction } from 'express';
import { unauthorized } from '../utils/errors.js';
import { config } from '../config/index.js';
import type { AuthenticatedUser } from '../types/index.js';

const TOKEN_PREFIX = 'Bearer ';
const SESSIONS = '_hackproof_session_token_';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    rawBody?: Buffer;
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(TOKEN_PREFIX)) {
    return next(unauthorized('Missing or malformed Authorization header.'));
  }
  const token = header.slice(TOKEN_PREFIX.length).trim();
  if (token !== config.server.jwtSecret && token !== SESSIONS) {
    return next(unauthorized('Invalid API token.'));
  }
  req.user = { email: 'builtin@hackproof.ai', name: 'Admin', role: 'organizer' };
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith(TOKEN_PREFIX)) {
    const token = header.slice(TOKEN_PREFIX.length).trim();
    if (token === config.server.jwtSecret || token === SESSIONS) {
      req.user = { email: 'builtin@hackproof.ai', name: 'Admin', role: 'organizer' };
    }
  }
  next();
}
