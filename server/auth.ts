import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from './types.js';
import { db } from './db.js';

// Extend Express Request to carry authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

const SECRET_KEY = process.env.APP_SECRET || 'sipengawas-garut-super-secret-key-2026';

// Password hashing using scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch {
    return false;
  }
}

// In-memory active session store with TTL (backed by server uptime)
// Tokens are opaque secure random hex strings
interface SessionData {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSessionToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(token, {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return token;
}

export function removeSessionToken(token: string): void {
  sessions.delete(token);
}

export function getUserByToken(token: string): User | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  const user = db.users.findById(session.userId);
  if (!user || !user.isActive) {
    sessions.delete(token);
    return null;
  }
  return user;
}

// Middleware: Require Authentication
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = getUserByToken(token);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Token otentikasi tidak valid atau akun dinonaktifkan.',
    });
    return;
  }

  req.user = user;
  next();
}

// Middleware: Require specific roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Otorisasi diperlukan.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Peran '${req.user.role}' tidak memiliki wewenang untuk tindakan ini.`,
      });
      return;
    }

    next();
  };
}
