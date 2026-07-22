import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized, forbidden } from '../utils/errors.js';
import { config } from '../config/index.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { userId: string; role: string };
    rawBody?: Buffer;
  }
}

const TOKEN_PREFIX = 'Bearer ';
const JWT_SECRET = config.server.jwtSecret || process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

function decodeToken(req: Request): { userId: string; role: string } | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(TOKEN_PREFIX)) return null;
  const token = header.slice(TOKEN_PREFIX.length).trim();
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return payload;
  } catch {
    return null;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const payload = decodeToken(req);
  if (payload) req.user = payload;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const payload = decodeToken(req);
  if (!payload) return next(unauthorized('Authentication required.'));
  req.user = payload;
  next();
}

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions.'));
    }
    next();
  };
}
