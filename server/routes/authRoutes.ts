import { Router, Response } from 'express';
import { db } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  removeSessionToken,
  authenticate,
  AuthenticatedRequest,
} from '../auth.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req, res: Response): void => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({
      success: false,
      message: 'Username/Email dan kata sandi wajib diisi.',
    });
    return;
  }

  const user = db.users.findByUsername(identifier);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Username/Email atau kata sandi tidak cocok.',
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Akun Anda dinonaktifkan oleh administrator. Silakan hubungi Dinas Pendidikan Kabupaten Garut.',
    });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({
      success: false,
      message: 'Username/Email atau kata sandi tidak cocok.',
    });
    return;
  }

  const token = createSessionToken(user.id);

  // Log audit
  db.auditLogs.log(user, 'LOGIN', 'User', user.id, `Pengguna ${user.fullName} berhasil login sebagai ${user.role}.`);

  // Strip password hash and salt from output
  const { passwordHash, salt, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Login berhasil.',
    token,
    user: safeUser,
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Tidak terotentikasi' });
    return;
  }
  const { passwordHash, salt, ...safeUser } = req.user;
  res.json({
    success: true,
    user: safeUser,
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    removeSessionToken(token);
  }

  if (req.user) {
    db.auditLogs.log(req.user, 'LOGOUT', 'User', req.user.id, `Pengguna ${req.user.fullName} telah logout.`);
  }

  res.json({
    success: true,
    message: 'Logout berhasil.',
  });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Kata sandi lama dan baru wajib diisi.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
    return;
  }

  const isValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(400).json({ success: false, message: 'Kata sandi lama salah.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.users.update(user.id, { passwordHash: hash, salt });

  db.auditLogs.log(user, 'UPDATE_PASSWORD', 'User', user.id, `Pengguna ${user.fullName} memperbarui kata sandi.`);

  res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
});

// GET /api/auth/demo-accounts - Returns active users with public metadata for role switcher
authRouter.get('/demo-accounts', (_req, res: Response): void => {
  const users = db.users
    .find((u) => u.isActive)
    .map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      fullName: u.fullName,
      nip: u.nip || '-',
      pangkatGolongan: u.pangkatGolongan || '-',
      jabatanLevel: u.jabatanLevel || '-',
      phone: u.phone || '-',
    }));

  res.json({ success: true, data: users });
});
