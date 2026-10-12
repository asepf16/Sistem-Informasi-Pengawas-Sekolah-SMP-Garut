import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { SupervisionPlan } from '../types.js';

export const planRouter = Router();

// GET /api/plans
planRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { academicYear, semester, supervisorId, schoolId, status } = req.query;

  let plans: SupervisionPlan[] = [];

  if (user.role === 'supervisor') {
    // Pengawas HANYA melihat rencana miliknya sendiri
    plans = db.plans.find((p) => p.supervisorId === user.id);
  } else {
    // Admin dan Kadis dapat melihat seluruh rencana
    plans = db.plans.find();
  }

  // Filter
  if (academicYear && typeof academicYear === 'string') {
    plans = plans.filter((p) => p.academicYear === academicYear);
  }
  if (semester && typeof semester === 'string') {
    plans = plans.filter((p) => p.semester === semester);
  }
  if (supervisorId && typeof supervisorId === 'string' && user.role !== 'supervisor') {
    plans = plans.filter((p) => p.supervisorId === supervisorId);
  }
  if (schoolId && typeof schoolId === 'string') {
    plans = plans.filter((p) => p.schoolId === schoolId);
  }
  if (status && typeof status === 'string') {
    plans = plans.filter((p) => p.status === status);
  }

  // Sort by planned date ascending
  plans.sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

  res.json({
    success: true,
    data: plans,
    total: plans.length,
  });
});

// GET /api/plans/:id
planRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const plan = db.plans.findById(req.params.id);

  if (!plan) {
    res.status(404).json({ success: false, message: 'Rencana kerja tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && plan.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  res.json({ success: true, data: plan });
});

// POST /api/plans
planRouter.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki hak akses baca.' });
    return;
  }

  const {
    schoolId,
    academicYear,
    semester,
    category,
    supervisionField,
    objective,
    targetIndicator,
    plannedDate,
    method,
    instruments,
    expectedOutput,
    notes,
  } = req.body;

  if (!schoolId || !academicYear || !semester || !objective || !plannedDate) {
    res.status(400).json({
      success: false,
      message: 'Sekolah sasaran, Tahun pelajaran, Semester, Tujuan, dan Tanggal rencana wajib diisi.',
    });
    return;
  }

  const school = db.schools.findById(schoolId);
  if (!school) {
    res.status(400).json({ success: false, message: 'Sekolah sasaran tidak valid.' });
    return;
  }

  // Check supervisor assignment if user is supervisor
  if (user.role === 'supervisor' && school.supervisorId !== user.id) {
    res.status(403).json({
      success: false,
      message: 'Anda hanya dapat menyusun rencana untuk sekolah binaan Anda sendiri.',
    });
    return;
  }

  const supervisorId = user.role === 'supervisor' ? user.id : school.supervisorId;
  const supervisorUser = db.users.findById(supervisorId);
  const supervisorName = supervisorUser ? supervisorUser.fullName : user.fullName;

  const count = db.plans.find().length + 1;
  const planCode = `RKP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const newPlan: SupervisionPlan = {
    id: `pln-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    planCode,
    supervisorId,
    supervisorName,
    schoolId: school.id,
    schoolName: school.name,
    academicYear: academicYear.trim(),
    semester,
    category: Array.isArray(category) && category.length > 0 ? category : ['Pengawasan Akademik'],
    supervisionField: supervisionField || 'Akademik',
    objective: objective.trim(),
    targetIndicator: targetIndicator?.trim() || '',
    plannedDate,
    method: method?.trim() || 'Kunjungan Langsung / Observasi',
    instruments: instruments?.trim() || 'Instrumen Supervisi Terstandar',
    expectedOutput: expectedOutput?.trim() || 'Laporan hasil pengawasan dan rekomendasi',
    notes: notes?.trim() || '',
    status: 'Direncanakan',
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
  };

  db.plans.create(newPlan);

  db.auditLogs.log(
    user,
    'CREATE_PLAN',
    'SupervisionPlan',
    newPlan.id,
    `Menyusun rencana kerja kepengawasan ${newPlan.planCode} untuk ${newPlan.schoolName}.`
  );

  res.status(201).json({
    success: true,
    message: 'Rencana kerja kepengawasan berhasil disimpan.',
    data: newPlan,
  });
});

// PUT /api/plans/:id
planRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki hak akses baca.' });
    return;
  }

  const plan = db.plans.findById(req.params.id);
  if (!plan) {
    res.status(404).json({ success: false, message: 'Rencana kerja tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && plan.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  const {
    schoolId,
    academicYear,
    semester,
    category,
    supervisionField,
    objective,
    targetIndicator,
    plannedDate,
    method,
    instruments,
    expectedOutput,
    notes,
    status,
  } = req.body;

  const updates: Partial<SupervisionPlan> = {};
  if (academicYear) updates.academicYear = academicYear.trim();
  if (semester) updates.semester = semester;
  if (category) updates.category = category;
  if (supervisionField) updates.supervisionField = supervisionField;
  if (objective) updates.objective = objective.trim();
  if (targetIndicator !== undefined) updates.targetIndicator = targetIndicator.trim();
  if (plannedDate) updates.plannedDate = plannedDate;
  if (method !== undefined) updates.method = method.trim();
  if (instruments !== undefined) updates.instruments = instruments.trim();
  if (expectedOutput !== undefined) updates.expectedOutput = expectedOutput.trim();
  if (notes !== undefined) updates.notes = notes.trim();
  if (status) updates.status = status;

  if (schoolId && schoolId !== plan.schoolId) {
    const school = db.schools.findById(schoolId);
    if (school) {
      if (user.role === 'supervisor' && school.supervisorId !== user.id) {
        res.status(403).json({ success: false, message: 'Sekolah baru bukan binaan Anda.' });
        return;
      }
      updates.schoolId = school.id;
      updates.schoolName = school.name;
    }
  }

  const updatedPlan = db.plans.update(plan.id, updates);

  db.auditLogs.log(
    user,
    'UPDATE_PLAN',
    'SupervisionPlan',
    plan.id,
    `Memperbarui rencana kerja kepengawasan ${plan.planCode}.`
  );

  res.json({
    success: true,
    message: 'Rencana kerja berhasil diperbarui.',
    data: updatedPlan,
  });
});

// DELETE /api/plans/:id
planRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  const plan = db.plans.findById(req.params.id);
  if (!plan) {
    res.status(404).json({ success: false, message: 'Rencana tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && plan.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  db.plans.delete(plan.id);

  db.auditLogs.log(user, 'DELETE_PLAN', 'SupervisionPlan', plan.id, `Menghapus rencana kepengawasan ${plan.planCode}.`);

  res.json({
    success: true,
    message: `Rencana kepengawasan ${plan.planCode} berhasil dihapus.`,
  });
});
