import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';
import { AppRegulation } from '../types.js';

export const regulationRouter = Router();

// GET /api/regulations - List regulations
regulationRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const regulations = db.regulations.find();
  const settings = db.settings.find();
  res.json({
    success: true,
    data: {
      regulations,
      settings,
    },
  });
});

// POST /api/regulations - Add regulation (Admin only)
regulationRouter.post('/', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const { title, number, year, about, description, linkUrl, notes } = req.body;

  if (!title || !number || !year || !about) {
    res.status(400).json({ success: false, message: 'Judul, Nomor, Tahun, dan Tentang wajib diisi.' });
    return;
  }

  const newReg: AppRegulation = {
    id: `reg-${Date.now()}`,
    title: title.trim(),
    number: number.trim(),
    year: Number(year),
    about: about.trim(),
    description: description?.trim() || '',
    linkUrl: linkUrl?.trim() || '',
    isActive: true,
    notes: notes?.trim() || '',
  };

  db.regulations.create(newReg);
  db.auditLogs.log(admin, 'CREATE_REGULATION', 'Regulation', newReg.id, `Menambahkan dasar hukum: ${newReg.title}.`);

  res.status(201).json({ success: true, message: 'Dasar hukum berhasil ditambahkan.', data: newReg });
});

// PUT /api/regulations/:id - Edit regulation (Admin only)
regulationRouter.put('/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const reg = db.regulations.findById(req.params.id);
  if (!reg) {
    res.status(404).json({ success: false, message: 'Regulasi tidak ditemukan.' });
    return;
  }

  const updated = db.regulations.update(reg.id, req.body);
  db.auditLogs.log(admin, 'UPDATE_REGULATION', 'Regulation', reg.id, `Memperbarui dasar hukum ${reg.title}.`);

  res.json({ success: true, message: 'Regulasi berhasil diperbarui.', data: updated });
});

// PUT /api/regulations/settings/update - Update system settings (Admin only)
regulationRouter.put('/settings/update', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const admin = req.user!;
  const { settings } = req.body; // array of { key, value, description }

  if (Array.isArray(settings)) {
    for (const item of settings) {
      if (item.key && item.value !== undefined) {
        db.settings.set(item.key, item.value, item.description);
      }
    }
  }

  db.auditLogs.log(admin, 'UPDATE_SETTINGS', 'Settings', 'SYSTEM', 'Memperbarui konfigurasi sistem aplikasi.');
  res.json({ success: true, message: 'Pengaturan sistem berhasil disimpan.' });
});
