import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';
import { School } from '../types.js';

export const schoolRouter = Router();

// GET /api/schools - List schools based on user role
schoolRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { subdistrict, supervisorId, search } = req.query;

  let schools: School[] = [];

  if (user.role === 'supervisor') {
    // Pengawas HANYA melihat sekolah binaannya sendiri
    schools = db.schools.find((s) => s.supervisorId === user.id);
  } else {
    // Admin dan Kadis dapat melihat semua sekolah
    schools = db.schools.find();
  }

  // Filter tambahan
  if (subdistrict && typeof subdistrict === 'string') {
    schools = schools.filter((s) => s.subdistrict.toLowerCase() === subdistrict.toLowerCase());
  }
  if (supervisorId && typeof supervisorId === 'string' && user.role !== 'supervisor') {
    schools = schools.filter((s) => s.supervisorId === supervisorId);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    schools = schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.npsn.includes(q) ||
        s.principalName.toLowerCase().includes(q) ||
        s.subdistrict.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: schools,
    total: schools.length,
  });
});

// GET /api/schools/:id - Detail school with ownership check
schoolRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const school = db.schools.findById(req.params.id);

  if (!school) {
    res.status(404).json({ success: false, message: 'Sekolah tidak ditemukan.' });
    return;
  }

  // Jika pengawas, periksa kepemilikan
  if (user.role === 'supervisor' && school.supervisorId !== user.id) {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda tidak memiliki wewenang atas data sekolah ini.',
    });
    return;
  }

  res.json({ success: true, data: school });
});

// POST /api/schools - Create school
// Pengawas can create school for themselves; Admin can create and assign any supervisor; Kadis forbidden
schoolRouter.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki hak akses baca (Read-Only).' });
    return;
  }

  const {
    npsn,
    name,
    status,
    address,
    subdistrict,
    principalName,
    phone,
    email,
    supervisorId,
    notes,
  } = req.body;

  if (!npsn || !name || !status || !subdistrict) {
    res.status(400).json({
      success: false,
      message: 'NPSN, Nama Sekolah, Status, dan Kecamatan wajib diisi.',
    });
    return;
  }

  // NPSN duplicate validation
  const existingNpsn = db.schools.findByNpsn(npsn.trim());
  if (existingNpsn) {
    res.status(400).json({
      success: false,
      message: `Sekolah dengan NPSN ${npsn} sudah terdaftar (${existingNpsn.name}, Pengawas: ${existingNpsn.supervisorName || 'Belum ada'}). Untuk perubahan pengawas penanggung jawab, silakan hubungi Admin.`,
    });
    return;
  }

  // Determine supervisor
  let targetSupervisorId = user.id;
  let targetSupervisorName = user.fullName;

  if (user.role === 'admin' && supervisorId) {
    const assignedSup = db.users.findById(supervisorId);
    if (assignedSup) {
      targetSupervisorId = assignedSup.id;
      targetSupervisorName = assignedSup.fullName;
    }
  }

  const now = new Date().toISOString();
  const newSchool: School = {
    id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    npsn: npsn.trim(),
    name: name.trim(),
    status: status === 'Swasta' ? 'Swasta' : 'Negeri',
    educationLevel: 'SMP',
    address: address?.trim() || '',
    subdistrict: subdistrict.trim(),
    principalName: principalName?.trim() || '',
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    supervisorId: targetSupervisorId,
    supervisorName: targetSupervisorName,
    notes: notes?.trim() || '',
    isActive: true,
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
  };

  db.schools.create(newSchool);

  db.auditLogs.log(
    user,
    'CREATE_SCHOOL',
    'School',
    newSchool.id,
    `Menambahkan data sekolah binaan: ${newSchool.name} (NPSN: ${newSchool.npsn}) di Kecamatan ${newSchool.subdistrict}.`
  );

  res.status(201).json({
    success: true,
    message: 'Data sekolah binaan berhasil ditambahkan.',
    data: newSchool,
  });
});

// PUT /api/schools/:id - Update school
schoolRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki hak akses baca.' });
    return;
  }

  const school = db.schools.findById(req.params.id);
  if (!school) {
    res.status(404).json({ success: false, message: 'Sekolah tidak ditemukan.' });
    return;
  }

  // Check ownership if user is supervisor
  if (user.role === 'supervisor' && school.supervisorId !== user.id) {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda tidak berhak mengubah sekolah binaan pengawas lain.',
    });
    return;
  }

  const {
    npsn,
    name,
    status,
    address,
    subdistrict,
    principalName,
    phone,
    email,
    supervisorId,
    notes,
    isActive,
  } = req.body;

  // NPSN conflict check if changed
  if (npsn && npsn.trim() !== school.npsn) {
    const existingNpsn = db.schools.findByNpsn(npsn.trim());
    if (existingNpsn && existingNpsn.id !== school.id) {
      res.status(400).json({
        success: false,
        message: `NPSN ${npsn} telah digunakan oleh sekolah lain (${existingNpsn.name}).`,
      });
      return;
    }
  }

  const updates: Partial<School> = {};
  if (npsn) updates.npsn = npsn.trim();
  if (name) updates.name = name.trim();
  if (status) updates.status = status;
  if (address !== undefined) updates.address = address.trim();
  if (subdistrict) updates.subdistrict = subdistrict.trim();
  if (principalName !== undefined) updates.principalName = principalName.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email.trim();
  if (notes !== undefined) updates.notes = notes.trim();
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  // Admin can change assigned supervisor
  if (user.role === 'admin' && supervisorId && supervisorId !== school.supervisorId) {
    const newSupervisor = db.users.findById(supervisorId);
    if (newSupervisor) {
      updates.supervisorId = newSupervisor.id;
      updates.supervisorName = newSupervisor.fullName;
      db.auditLogs.log(
        user,
        'REASSIGN_SCHOOL',
        'School',
        school.id,
        `Mengalihkan pengawas pembina ${school.name} dari ${school.supervisorName} ke ${newSupervisor.fullName}.`
      );
    }
  }

  const updatedSchool = db.schools.update(school.id, updates);

  db.auditLogs.log(
    user,
    'UPDATE_SCHOOL',
    'School',
    school.id,
    `Memperbarui informasi sekolah binaan: ${updatedSchool?.name}.`
  );

  res.json({
    success: true,
    message: 'Data sekolah berhasil diperbarui.',
    data: updatedSchool,
  });
});

// DELETE /api/schools/:id - Delete school (Admin only, or supervisor who created it if no activities attached)
schoolRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas tidak memiliki izin menghapus data.' });
    return;
  }

  const school = db.schools.findById(req.params.id);
  if (!school) {
    res.status(404).json({ success: false, message: 'Sekolah tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && school.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  // Check if school has activities
  const linkedActivities = db.activities.find((a) => a.schoolId === school.id);
  if (linkedActivities.length > 0) {
    res.status(400).json({
      success: false,
      message: `Sekolah ${school.name} memiliki ${linkedActivities.length} riwayat kegiatan kepengawasan. Nonaktifkan status sekolah alih-alih menghapus demi integritas arsip dinas.`,
    });
    return;
  }

  db.schools.delete(school.id);

  db.auditLogs.log(user, 'DELETE_SCHOOL', 'School', school.id, `Menghapus sekolah ${school.name} (NPSN: ${school.npsn}).`);

  res.json({
    success: true,
    message: `Sekolah ${school.name} berhasil dihapus.`,
  });
});
