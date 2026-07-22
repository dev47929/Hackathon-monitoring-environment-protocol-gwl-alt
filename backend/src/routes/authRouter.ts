import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { asyncHandler, badRequest, conflict } from '../utils/errors.js';
import * as repo from '../data/repository.js';
import { config } from '../config/index.js';

export const authRouter: Router = Router();
const JWT_SECRET = config.server.jwtSecret || process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['team', 'organizer', 'judge']),
});

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  const derivedKey = scryptSync(password, salt, 64);
  return timingSafeEqual(derivedKey, Buffer.from(key, 'hex'));
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest('Invalid registration payload.', parsed.error.flatten());
  }

  const existing = await repo.findUserByEmail(parsed.data.email);
  if (existing) {
    throw conflict('A user with this email is already registered.');
  }

  const user = await repo.createUser({
    id: `user-${uuidv4().slice(0, 8)}`,
    email: parsed.data.email,
    name: parsed.data.name,
    password: hashPassword(parsed.data.password),
    role: parsed.data.role,
  });

  const tokenPayload = { userId: user.id, role: user.role };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    status: 'success',
    message: `User registered as ${user.role}.`,
    data: { user, token },
  });
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) {
    throw badRequest('Invalid login payload.', parsed.error.flatten());
  }

  const row = await repo.findUserByEmail(parsed.data.email);
  if (!row || !verifyPassword(parsed.data.password, row.password)) {
    throw badRequest('Invalid email or password.');
  }

  const { password: _pw, ...safeUser } = row;
  const tokenPayload = { userId: row.id, role: row.role };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    status: 'success',
    data: { user: safeUser, token },
  });
}));
