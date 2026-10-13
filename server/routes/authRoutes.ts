import { Router, Response } from 'express';
import { db, ensureDemoAccountsInMemory } from '../db.js';
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
  // Always guarantee in-memory demo accounts exist before processing authentication
  ensureDemoAccountsInMemory();

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({
      success: false,
      message: 'Username/Email dan kata sandi wajib diisi.',
    });
    return;
  }

  let user = db.users.findByUsername(identifier);

  // Check alias if identifier doesn't match directly
  if (!user) {
    const activeSupervisors = db.users.find((u) => u.role === 'supervisor' && u.isActive);
    if (identifier === 'pengawas1' && activeSupervisors[0]) user = activeSupervisors[0];
    else if (identifier === 'pengawas2' && activeSupervisors[1]) user = activeSupervisors[1];
    else if (identifier === 'pengawas3' && activeSupervisors[2]) user = activeSupervisors[2];
  }

  // Fallback for admin if somehow user is still null
  if (!user && (identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'asepfirdausy16@dinas.belajar.id')) {
    ensureDemoAccountsInMemory();
    user = db.users.findByUsername('admin');
  }

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

  // Allow standard demo master passwords (including sipengawas2106) for easy testing or verify password hash
  const isDemoMasterPass =
    (user.role === 'admin' &&
      (password === 'sipengawas2106' ||
       password === 'AdminGarut2026!' ||
       password === 'Pengawas123!')) ||
    (user.role === 'supervisor' &&
      (password === 'Pengawas123!' ||
       password === 'sipengawas2106')) ||
    (user.role === 'kadis' &&
      (password === 'KadisGarut2026!' ||
       password === 'Pengawas123!' ||
       password === 'sipengawas2106'));

  const isValid = isDemoMasterPass || verifyPassword(password, user.passwordHash, user.salt);
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

// POST /api/auth/quick-login - Instant 1-click login for role testing
authRouter.post('/quick-login', (req, res: Response): void => {
  ensureDemoAccountsInMemory();
  const { identifier, userId, role } = req.body;
  let user: any;

  if (userId) {
    user = db.users.findById(userId);
  } else if (identifier) {
    user = db.users.findByUsername(identifier);
    if (!user) {
      const activeSupervisors = db.users.find((u) => u.role === 'supervisor' && u.isActive);
      if (identifier === 'pengawas1' && activeSupervisors[0]) user = activeSupervisors[0];
      else if (identifier === 'pengawas2' && activeSupervisors[1]) user = activeSupervisors[1];
      else if (identifier === 'pengawas3' && activeSupervisors[2]) user = activeSupervisors[2];
    }
  } else if (role) {
    user = db.users.find((u) => u.role === role && u.isActive)[0];
  }

  if (!user || !user.isActive) {
    res.status(404).json({
      success: false,
      message: 'Akun pengguna tidak ditemukan atau dinonaktifkan.',
    });
    return;
  }

  const token = createSessionToken(user.id);
  db.auditLogs.log(user, 'LOGIN', 'User', user.id, `Pengguna ${user.fullName} beralih peran (Uji Peran).`);

  const { passwordHash, salt, ...safeUser } = user;
  res.json({
    success: true,
    message: `Berhasil beralih akun ke ${user.fullName}`,
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
  ensureDemoAccountsInMemory();
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
