import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest, hashPassword } from '../auth.js';
import { User } from '../types.js';

export const userRouter = Router();

// GET /api/users/supervisors - Get list of supervisors for selectors
userRouter.get('/supervisors', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const supervisors = db.users
    .find((u) => u.role === 'supervisor' && u.isActive)
    .map(({ passwordHash, salt, ...safe }) => {
      const schools = db.schools.find((s) => s.supervisorId === safe.id);
      const activities = db.activities.find((a) => a.supervisorId === safe.id);
      return {
        ...safe,
        schoolCount: schools.length,
        activityCount: activities.length,
      };
    });

  res.json({ success: true, data: supervisors });
});

// GET /api/users - List all users (Admin only)
userRouter.get('/', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const users = db.users.find().map(({ passwordHash, salt, ...safe }) => {
    const schools = db.schools.find((s) => s.supervisorId === safe.id);
    const activities = db.activities.find((a) => a.supervisorId === safe.id);
    return {
      ...safe,
      schoolCount: schools.length,
      activityCount: activities.length,
    };
  });

  res.json({ success: true, data: users });
});

// POST /api/users - Create user (Admin only)
userRouter.post('/', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const { username, email, password, role, fullName, nip, pangkatGolongan, jabatanLevel, phone, schoolIds } = req.body;

  if (!username || !email || !password || !role || !fullName) {
    res.status(400).json({
      success: false,
      message: 'Username, Email, Kata Sandi, Peran, dan Nama Lengkap wajib diisi.',
    });
    return;
  }

  // Check unique username and email
  const existing = db.users.findByUsername(username) || db.users.findByUsername(email);
  if (existing) {
    res.status(400).json({
      success: false,
      message: 'Username atau email telah terdaftar.',
    });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr-${role}-${Date.now().toString(36)}`,
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    role,
    fullName: fullName.trim(),
    nip: nip?.trim() || '',
    pangkatGolongan: pangkatGolongan?.trim() || '',
    jabatanLevel: role === 'supervisor' ? jabatanLevel || 'Ahli Madya' : undefined,
    phone: phone?.trim() || '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  db.users.create(newUser);

  // If schoolIds provided for new supervisor, assign them
  if (role === 'supervisor' && Array.isArray(schoolIds) && schoolIds.length > 0) {
    schoolIds.forEach((sid: string) => {
      db.schools.update(sid, {
        supervisorId: newUser.id,
        supervisorName: newUser.fullName,
      });
    });
  }

  db.auditLogs.log(
    admin,
    'CREATE_USER',
    'User',
    newUser.id,
    `Admin membuat akun baru: ${newUser.fullName} (${newUser.username}) dengan peran ${newUser.role}.`
  );

  const { passwordHash: _, salt: __, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    message: 'Pengguna baru berhasil dibuat.',
    data: safeUser,
  });
});

// POST /api/users/batch-supervisors - Create multiple supervisors at once (Admin only)
userRouter.post('/batch-supervisors', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const { supervisors } = req.body;

  if (!Array.isArray(supervisors) || supervisors.length === 0) {
    res.status(400).json({ success: false, message: 'Daftar pengawas wajib disertakan (minimal 1 data pengawas).' });
    return;
  }

  const createdList: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < supervisors.length; i++) {
    const item = supervisors[i];
    const fullName = item.fullName?.trim();
    if (!fullName) {
      errors.push(`Baris ${i + 1}: Nama lengkap pengawas wajib diisi.`);
      continue;
    }

    // Auto-generate clean username if not provided
    let rawUsername = item.username?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!rawUsername) {
      const cleanName = fullName.toLowerCase().replace(/^(dr|dra|drs|h|hj)\.?\s+/gi, '').replace(/[^a-z0-9]/g, '');
      rawUsername = cleanName.slice(0, 15) || `pengawas${Date.now().toString(36)}`;
    }

    // Ensure unique username
    let finalUsername = rawUsername;
    let counter = 1;
    while (db.users.findByUsername(finalUsername)) {
      finalUsername = `${rawUsername}${counter}`;
      counter++;
    }

    // Auto-generate email if not provided
    let rawEmail = item.email?.trim().toLowerCase();
    if (!rawEmail) {
      rawEmail = `${finalUsername}@dinas.belajar.id`;
    }
    let finalEmail = rawEmail;
    let emailCounter = 1;
    while (db.users.findByUsername(finalEmail)) {
      finalEmail = `${finalUsername}${emailCounter}@dinas.belajar.id`;
      emailCounter++;
    }

    const password = item.password?.trim() || 'Pengawas123!';
    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    const newUser: User = {
      id: `usr-supervisor-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      username: finalUsername,
      email: finalEmail,
      passwordHash: hash,
      salt,
      role: 'supervisor',
      fullName,
      nip: item.nip?.trim() || '',
      pangkatGolongan: item.pangkatGolongan?.trim() || 'Pembina Tingkat I (IV/b)',
      jabatanLevel: item.jabatanLevel || 'Ahli Madya',
      phone: item.phone?.trim() || '-',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.users.create(newUser);

    if (Array.isArray(item.schoolIds) && item.schoolIds.length > 0) {
      item.schoolIds.forEach((sid: string) => {
        db.schools.update(sid, {
          supervisorId: newUser.id,
          supervisorName: newUser.fullName,
        });
      });
    }

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    createdList.push(safeUser);
  }

  db.auditLogs.log(
    admin,
    'BATCH_CREATE_SUPERVISORS',
    'User',
    admin.id,
    `Admin menambahkan ${createdList.length} daftar pengawas sekolah baru secara massal.`
  );

  res.status(201).json({
    success: true,
    message: `Berhasil menambahkan ${createdList.length} pengawas sekolah ke dalam daftar.${errors.length > 0 ? ` (${errors.length} baris dilewati karena data tidak lengkap)` : ''}`,
    data: createdList,
    errors,
  });
});

// PUT /api/users/:id - Update user (Admin only)
userRouter.put('/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const user = db.users.findById(req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    return;
  }

  const { email, fullName, role, nip, pangkatGolongan, jabatanLevel, phone, isActive, password, schoolIds } = req.body;

  const updates: Partial<User> = {};
  if (email) updates.email = email.trim().toLowerCase();
  if (fullName) updates.fullName = fullName.trim();
  if (role) updates.role = role;
  if (nip !== undefined) updates.nip = nip.trim();
  if (pangkatGolongan !== undefined) updates.pangkatGolongan = pangkatGolongan.trim();
  if (jabatanLevel !== undefined) updates.jabatanLevel = jabatanLevel;
  if (phone !== undefined) updates.phone = phone.trim();
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  // If resetting password
  if (password && password.trim().length >= 6) {
    const { hash, salt } = hashPassword(password.trim());
    updates.passwordHash = hash;
    updates.salt = salt;
  }

  const updatedUser = db.users.update(user.id, updates);

  // Synchronize name in schools and plans if supervisor fullName changed
  if (fullName && fullName.trim() !== user.fullName) {
    const assignedSchools = db.schools.find((s) => s.supervisorId === user.id);
    assignedSchools.forEach((s) => {
      db.schools.update(s.id, { supervisorName: fullName.trim() });
    });
    const supervisorPlans = db.plans.find((p) => p.supervisorId === user.id);
    supervisorPlans.forEach((p) => {
      db.plans.update(p.id, { supervisorName: fullName.trim() });
    });
  }

  // Update assigned schools if provided
  if (Array.isArray(schoolIds)) {
    // Unassign old schools no longer selected
    const currentSchools = db.schools.find((s) => s.supervisorId === user.id);
    currentSchools.forEach((s) => {
      if (!schoolIds.includes(s.id)) {
        db.schools.update(s.id, { supervisorId: undefined, supervisorName: undefined });
      }
    });
    // Assign newly selected schools
    schoolIds.forEach((sid: string) => {
      db.schools.update(sid, {
        supervisorId: user.id,
        supervisorName: updatedUser?.fullName || user.fullName,
      });
    });
  }

  db.auditLogs.log(
    admin,
    'UPDATE_USER',
    'User',
    user.id,
    `Admin memperbarui data pengguna: ${user.fullName} (${user.username}).`
  );

  const { passwordHash: _, salt: __, ...safeUser } = updatedUser!;
  res.json({
    success: true,
    message: 'Data pengguna berhasil diperbarui.',
    data: safeUser,
  });
});

// DELETE /api/users/:id - Deactivate or remove user (Admin only)
userRouter.delete('/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const user = db.users.findById(req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    return;
  }

  if (user.id === admin.id) {
    res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    return;
  }

  // Check if supervisor has assigned schools
  const schools = db.schools.find((s) => s.supervisorId === user.id);
  if (schools.length > 0) {
    // Soft deactivate instead of hard delete
    db.users.update(user.id, { isActive: false });
    db.auditLogs.log(
      admin,
      'DEACTIVATE_USER',
      'User',
      user.id,
      `Menonaktifkan akun pengawas ${user.fullName} karena memiliki ${schools.length} sekolah binaan.`
    );
    res.json({
      success: true,
      message: `Akun ${user.fullName} dinonaktifkan karena memiliki sekolah binaan aktif. Alihkan sekolah ke pengawas lain jika ingin menghapus permanen.`,
    });
    return;
  }

  db.users.delete(user.id);
  db.auditLogs.log(admin, 'DELETE_USER', 'User', user.id, `Menghapus akun pengguna ${user.fullName}.`);

  res.json({
    success: true,
    message: `Pengguna ${user.fullName} berhasil dihapus.`,
  });
});
