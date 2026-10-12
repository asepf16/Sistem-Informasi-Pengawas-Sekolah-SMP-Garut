import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import {
  SupervisionActivity,
  ActivityStatus,
  FollowUpItem,
  Attachment,
  VerificationNote,
} from '../types.js';

export const activityRouter = Router();

// GET /api/activities - List activities based on user role
activityRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const {
    schoolId,
    supervisorId,
    category,
    status,
    academicYear,
    semester,
    startDate,
    endDate,
    search,
  } = req.query;

  let activities: SupervisionActivity[] = [];

  if (user.role === 'supervisor') {
    // Pengawas HANYA melihat kegiatan miliknya sendiri
    activities = db.activities.find((a) => a.supervisorId === user.id);
  } else {
    // Admin dan Kadis dapat melihat semua kegiatan
    activities = db.activities.find();
  }

  // Filters
  if (schoolId && typeof schoolId === 'string') {
    activities = activities.filter((a) => a.schoolId === schoolId);
  }
  if (supervisorId && typeof supervisorId === 'string' && user.role !== 'supervisor') {
    activities = activities.filter((a) => a.supervisorId === supervisorId);
  }
  if (category && typeof category === 'string') {
    activities = activities.filter((a) => a.categories.includes(category as any));
  }
  if (status && typeof status === 'string') {
    activities = activities.filter((a) => a.status === status);
  }
  if (academicYear && typeof academicYear === 'string') {
    activities = activities.filter((a) => a.academicYear === academicYear);
  }
  if (semester && typeof semester === 'string') {
    activities = activities.filter((a) => a.semester === semester);
  }
  if (startDate && typeof startDate === 'string') {
    activities = activities.filter((a) => a.activityDate >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    activities = activities.filter((a) => a.activityDate <= endDate);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    activities = activities.filter(
      (a) =>
        a.activityNumber.toLowerCase().includes(q) ||
        a.schoolName.toLowerCase().includes(q) ||
        a.objective.toLowerCase().includes(q) ||
        a.supervisorName.toLowerCase().includes(q) ||
        a.keyFindings.toLowerCase().includes(q)
    );
  }

  // Sort descending by activity date
  activities.sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());

  res.json({
    success: true,
    data: activities,
    total: activities.length,
  });
});

// GET /api/activities/:id
activityRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const activity = db.activities.findById(req.params.id);

  if (!activity) {
    res.status(404).json({ success: false, message: 'Kegiatan kepengawasan tidak ditemukan.' });
    return;
  }

  // Check supervisor ownership
  if (user.role === 'supervisor' && activity.supervisorId !== user.id) {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda tidak berhak melihat kegiatan pengawas lain.',
    });
    return;
  }

  res.json({ success: true, data: activity });
});

// Helper to sync follow-up item
function syncFollowUpRecord(activity: SupervisionActivity, user: any): void {
  if (!activity.recommendations || !activity.followUpPlan) return;

  // Check if follow-up for this activity already exists
  const existingList = db.followUps.find((f) => f.activityId === activity.id);
  const now = new Date().toISOString();

  if (existingList.length === 0) {
    const newFollowUp: FollowUpItem = {
      id: `flw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      schoolId: activity.schoolId,
      schoolName: activity.schoolName,
      supervisorId: activity.supervisorId,
      supervisorName: activity.supervisorName,
      findingDescription: activity.keyFindings || activity.supervisionResults,
      recommendation: activity.recommendations,
      actionPlan: activity.followUpPlan,
      personInCharge: activity.followUpPersonInCharge || 'Kepala Sekolah / Tim Terkait',
      targetDate: activity.followUpTargetDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Belum Dimulai',
      progressNotes: [],
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    };
    db.followUps.create(newFollowUp);
  } else {
    // Update existing follow-up base info
    const existing = existingList[0];
    db.followUps.update(existing.id, {
      schoolName: activity.schoolName,
      findingDescription: activity.keyFindings || activity.supervisionResults,
      recommendation: activity.recommendations,
      actionPlan: activity.followUpPlan,
      personInCharge: activity.followUpPersonInCharge || existing.personInCharge,
      targetDate: activity.followUpTargetDate || existing.targetDate,
    });
  }
}

// POST /api/activities - Create activity
activityRouter.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki hak akses baca.' });
    return;
  }

  const {
    schoolId,
    activityDate,
    activityTime,
    locationMode,
    academicYear,
    semester,
    categories,
    planId,
    objective,
    background,
    activityDescription,
    observedAspects,
    methodsAndInstruments,
    involvedParties,
    supervisionResults,
    keyFindings,
    goodPractices,
    challengesProblems,
    resultAnalysis,
    recommendations,
    followUpPlan,
    followUpPersonInCharge,
    followUpTargetDate,
    additionalNotes,
    attachments,
    submitForReview, // boolean: true to submit as 'Diajukan', false to save as 'Draf'
  } = req.body;

  if (!schoolId || !activityDate || !objective) {
    res.status(400).json({
      success: false,
      message: 'Sekolah binaan, Tanggal kegiatan, dan Tujuan kegiatan wajib diisi.',
    });
    return;
  }

  const school = db.schools.findById(schoolId);
  if (!school) {
    res.status(400).json({ success: false, message: 'Sekolah binaan tidak valid.' });
    return;
  }

  // Strict ownership check for supervisor
  if (user.role === 'supervisor' && school.supervisorId !== user.id) {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda hanya dapat mencatat kegiatan untuk sekolah binaan Anda sendiri.',
    });
    return;
  }

  const supervisorId = user.role === 'supervisor' ? user.id : school.supervisorId;
  const supervisorUser = db.users.findById(supervisorId);
  const supervisorName = supervisorUser ? supervisorUser.fullName : user.fullName;

  // Generate unique activity number
  const totalActivities = db.activities.find().length + 1;
  const yearStr = new Date(activityDate).getFullYear();
  const activityNumber = `PS-SMP-${yearStr}-${String(totalActivities).padStart(3, '0')}`;

  const initialStatus: ActivityStatus = submitForReview ? 'Diajukan' : 'Draf';
  const now = new Date().toISOString();

  // Validate attachments
  const safeAttachments: Attachment[] = [];
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att && att.name && att.dataUrl) {
        safeAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: att.name.substring(0, 100),
          type: att.type || 'application/octet-stream',
          size: typeof att.size === 'number' ? att.size : 0,
          dataUrl: att.dataUrl,
          uploadedAt: now,
        });
      }
    }
  }

  const newActivity: SupervisionActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    activityNumber,
    supervisorId,
    supervisorName,
    schoolId: school.id,
    schoolName: school.name,
    activityDate,
    activityTime: activityTime?.trim() || '',
    locationMode: locationMode || 'Luring (Tatap Muka di Sekolah)',
    academicYear: academicYear || '2025/2026',
    semester: semester || 'Genap',
    categories: Array.isArray(categories) && categories.length > 0 ? categories : ['Pengawasan Akademik'],
    planId: planId || undefined,
    objective: objective.trim(),
    background: background?.trim() || '',
    activityDescription: activityDescription?.trim() || '',
    observedAspects: observedAspects?.trim() || '',
    methodsAndInstruments: methodsAndInstruments?.trim() || '',
    involvedParties: involvedParties?.trim() || '',
    supervisionResults: supervisionResults?.trim() || '',
    keyFindings: keyFindings?.trim() || '',
    goodPractices: goodPractices?.trim() || '',
    challengesProblems: challengesProblems?.trim() || '',
    resultAnalysis: resultAnalysis?.trim() || '',
    recommendations: recommendations?.trim() || '',
    followUpPlan: followUpPlan?.trim() || '',
    followUpPersonInCharge: followUpPersonInCharge?.trim() || '',
    followUpTargetDate: followUpTargetDate?.trim() || '',
    additionalNotes: additionalNotes?.trim() || '',
    attachments: safeAttachments,
    status: initialStatus,
    verificationNotes: [],
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
  };

  db.activities.create(newActivity);

  // Sync follow-up
  syncFollowUpRecord(newActivity, user);

  // If connected to a plan, mark plan as Terlaksana if submitted
  if (planId) {
    db.plans.update(planId, { status: 'Terlaksana' });
  }

  db.auditLogs.log(
    user,
    'CREATE_ACTIVITY',
    'SupervisionActivity',
    newActivity.id,
    `Mencatat kegiatan kepengawasan ${newActivity.activityNumber} di ${newActivity.schoolName} (${initialStatus}).`
  );

  res.status(201).json({
    success: true,
    message: initialStatus === 'Diajukan'
      ? 'Kegiatan kepengawasan berhasil disimpan dan diajukan untuk verifikasi.'
      : 'Draf kegiatan kepengawasan berhasil disimpan.',
    data: newActivity,
  });
});

// PUT /api/activities/:id - Update activity
activityRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Kepala Dinas hanya memiliki hak akses baca.' });
    return;
  }

  const activity = db.activities.findById(req.params.id);
  if (!activity) {
    res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
    return;
  }

  // Strict ownership check for supervisor
  if (user.role === 'supervisor' && activity.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  // If supervisor, check if status is editable (cannot edit if status is Selesai without admin unlock)
  if (user.role === 'supervisor' && activity.status === 'Selesai') {
    res.status(400).json({
      success: false,
      message: 'Laporan ini telah berstatus Selesai dan disetujui secara resmi. Hubungi Admin jika perlu revisi.',
    });
    return;
  }

  const {
    schoolId,
    activityDate,
    activityTime,
    locationMode,
    academicYear,
    semester,
    categories,
    planId,
    objective,
    background,
    activityDescription,
    observedAspects,
    methodsAndInstruments,
    involvedParties,
    supervisionResults,
    keyFindings,
    goodPractices,
    challengesProblems,
    resultAnalysis,
    recommendations,
    followUpPlan,
    followUpPersonInCharge,
    followUpTargetDate,
    additionalNotes,
    attachments,
    submitForReview,
  } = req.body;

  const updates: Partial<SupervisionActivity> = {};

  if (activityDate) updates.activityDate = activityDate;
  if (activityTime !== undefined) updates.activityTime = activityTime;
  if (locationMode) updates.locationMode = locationMode;
  if (academicYear) updates.academicYear = academicYear;
  if (semester) updates.semester = semester;
  if (categories) updates.categories = categories;
  if (planId !== undefined) updates.planId = planId;
  if (objective) updates.objective = objective.trim();
  if (background !== undefined) updates.background = background.trim();
  if (activityDescription !== undefined) updates.activityDescription = activityDescription.trim();
  if (observedAspects !== undefined) updates.observedAspects = observedAspects.trim();
  if (methodsAndInstruments !== undefined) updates.methodsAndInstruments = methodsAndInstruments.trim();
  if (involvedParties !== undefined) updates.involvedParties = involvedParties.trim();
  if (supervisionResults !== undefined) updates.supervisionResults = supervisionResults.trim();
  if (keyFindings !== undefined) updates.keyFindings = keyFindings.trim();
  if (goodPractices !== undefined) updates.goodPractices = goodPractices.trim();
  if (challengesProblems !== undefined) updates.challengesProblems = challengesProblems.trim();
  if (resultAnalysis !== undefined) updates.resultAnalysis = resultAnalysis.trim();
  if (recommendations !== undefined) updates.recommendations = recommendations.trim();
  if (followUpPlan !== undefined) updates.followUpPlan = followUpPlan.trim();
  if (followUpPersonInCharge !== undefined) updates.followUpPersonInCharge = followUpPersonInCharge.trim();
  if (followUpTargetDate !== undefined) updates.followUpTargetDate = followUpTargetDate.trim();
  if (additionalNotes !== undefined) updates.additionalNotes = additionalNotes.trim();

  if (submitForReview) {
    updates.status = 'Diajukan';
  }

  if (schoolId && schoolId !== activity.schoolId) {
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

  if (Array.isArray(attachments)) {
    updates.attachments = attachments;
  }

  const updatedActivity = db.activities.update(activity.id, updates);

  if (updatedActivity) {
    syncFollowUpRecord(updatedActivity, user);
  }

  db.auditLogs.log(
    user,
    'UPDATE_ACTIVITY',
    'SupervisionActivity',
    activity.id,
    `Memperbarui laporan kegiatan ${activity.activityNumber}.`
  );

  res.json({
    success: true,
    message: 'Data kegiatan kepengawasan berhasil diperbarui.',
    data: updatedActivity,
  });
});

// POST /api/activities/:id/verify - Admin verification workflow
activityRouter.post('/:id/verify', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Hanya Administrator yang memiliki wewenang memverifikasi laporan kepengawasan.',
    });
    return;
  }

  const activity = db.activities.findById(req.params.id);
  if (!activity) {
    res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
    return;
  }

  const { status, comment } = req.body;

  if (!status || !['Selesai', 'Perlu Perbaikan', 'Diperiksa'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status verifikasi tidak valid. Pilih antara Diperiksa, Perlu Perbaikan, atau Selesai.',
    });
    return;
  }

  const now = new Date().toISOString();
  const note: VerificationNote = {
    id: `vnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    verifierId: user.id,
    verifierName: user.fullName,
    role: user.role,
    status: status as ActivityStatus,
    comment: comment?.trim() || 'Verifikasi telah diproses oleh Administrator.',
    createdAt: now,
  };

  const updatedNotes = [...activity.verificationNotes, note];
  const updatedActivity = db.activities.update(activity.id, {
    status: status as ActivityStatus,
    verificationNotes: updatedNotes,
  });

  db.auditLogs.log(
    user,
    'VERIFY_ACTIVITY',
    'SupervisionActivity',
    activity.id,
    `Admin ${user.fullName} mengubah status verifikasi ${activity.activityNumber} menjadi '${status}': ${note.comment}`
  );

  res.json({
    success: true,
    message: `Status kegiatan berhasil diubah menjadi '${status}'.`,
    data: updatedActivity,
  });
});

// DELETE /api/activities/:id
activityRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'kadis') {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  const activity = db.activities.findById(req.params.id);
  if (!activity) {
    res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
    return;
  }

  if (user.role === 'supervisor' && activity.supervisorId !== user.id) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  // Do not allow supervisor to delete if already approved/Selesai
  if (user.role === 'supervisor' && activity.status === 'Selesai') {
    res.status(400).json({
      success: false,
      message: 'Laporan yang telah berstatus Selesai tidak dapat dihapus oleh Pengawas. Hubungi Admin.',
    });
    return;
  }

  db.activities.delete(activity.id);

  // Clean linked follow-ups
  const linkedFollowUps = db.followUps.find((f) => f.activityId === activity.id);
  for (const f of linkedFollowUps) {
    db.followUps.delete(f.id);
  }

  db.auditLogs.log(
    user,
    'DELETE_ACTIVITY',
    'SupervisionActivity',
    activity.id,
    `Menghapus kegiatan kepengawasan ${activity.activityNumber}.`
  );

  res.json({
    success: true,
    message: `Kegiatan ${activity.activityNumber} berhasil dihapus.`,
  });
});
