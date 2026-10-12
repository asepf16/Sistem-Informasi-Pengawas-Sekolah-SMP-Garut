import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { FollowUpItem, FollowUpStatus } from '../types.js';

export const followUpRouter = Router();

// GET /api/follow-ups
followUpRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { status, schoolId, supervisorId, overdue } = req.query;

  let items: FollowUpItem[] = [];

  if (user.role === 'supervisor') {
    // Pengawas HANYA melihat tindak lanjut miliknya
    items = db.followUps.find((f) => f.supervisorId === user.id);
  } else {
    // Admin dan Kadis dapat melihat semua tindak lanjut
    items = db.followUps.find();
  }

  // Auto-detect overdue status if target date is in the past and not completed
  const todayStr = new Date().toISOString().split('T')[0];
  items = items.map((item) => {
    if (item.status !== 'Selesai' && item.targetDate < todayStr && item.status !== 'Terlambat') {
      // update to Terlambat in memory & store
      db.followUps.update(item.id, { status: 'Terlambat' });
      return { ...item, status: 'Terlambat' as FollowUpStatus };
    }
    return item;
  });

  if (status && typeof status === 'string') {
    items = items.filter((f) => f.status === status);
  }
  if (schoolId && typeof schoolId === 'string') {
    items = items.filter((f) => f.schoolId === schoolId);
  }
  if (supervisorId && typeof supervisorId === 'string' && user.role !== 'supervisor') {
    items = items.filter((f) => f.supervisorId === supervisorId);
  }
  if (overdue === 'true') {
    items = items.filter((f) => f.status === 'Terlambat' || (f.targetDate < todayStr && f.status !== 'Selesai'));
  }

  // Sort: pending first, then by target date
  items.sort((a, b) => {
    if (a.status === 'Selesai' && b.status !== 'Selesai') return 1;
    if (a.status !== 'Selesai' && b.status === 'Selesai') return -1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  res.json({
    success: true,
    data: items,
    total: items.length,
  });
});

// GET /api/follow-ups/:id
followUpRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const item = db.followUps.findById(req.params.id);

  if (!item) {
    res.status(404).json({ success: false, message: 'Data tindak lanjut tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && item.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  res.json({ success: true, data: item });
});

// PUT /api/follow-ups/:id - Update status and progress
followUpRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki akses baca.' });
    return;
  }

  const item = db.followUps.findById(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Data tindak lanjut tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && item.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  const { status, progressNote, completionProofNote, completedDate, targetDate, personInCharge } = req.body;

  const updates: Partial<FollowUpItem> = {};

  if (status) updates.status = status as FollowUpStatus;
  if (completionProofNote !== undefined) updates.completionProofNote = completionProofNote.trim();
  if (completedDate !== undefined) updates.completedDate = completedDate;
  if (targetDate !== undefined) updates.targetDate = targetDate;
  if (personInCharge !== undefined) updates.personInCharge = personInCharge.trim();

  // If new progress note is added
  if (progressNote && progressNote.trim()) {
    const newNote = {
      id: `pnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      note: progressNote.trim(),
      authorName: user.fullName,
      createdAt: new Date().toISOString(),
    };
    updates.progressNotes = [...item.progressNotes, newNote];
  }

  // If status marked as Selesai, record completedDate if not set
  if (status === 'Selesai' && !item.completedDate) {
    updates.completedDate = new Date().toISOString().split('T')[0];
  }

  const updatedItem = db.followUps.update(item.id, updates);

  db.auditLogs.log(
    user,
    'UPDATE_FOLLOW_UP',
    'FollowUpItem',
    item.id,
    `Memperbarui status tindak lanjut ${item.schoolName} menjadi '${status || item.status}'.`
  );

  res.json({
    success: true,
    message: 'Tindak lanjut pengawasan berhasil diperbarui.',
    data: updatedItem,
  });
});
