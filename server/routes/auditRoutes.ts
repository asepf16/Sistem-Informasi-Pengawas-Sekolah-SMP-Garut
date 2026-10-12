import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

export const auditRouter = Router();

// GET /api/audit-logs - Admin only
auditRouter.get('/', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { action, userId, startDate, endDate, search } = req.query;

  let logs = db.auditLogs.find();

  if (action && typeof action === 'string') {
    logs = logs.filter((l) => l.action.toLowerCase().includes(action.toLowerCase()));
  }
  if (userId && typeof userId === 'string') {
    logs = logs.filter((l) => l.userId === userId);
  }
  if (startDate && typeof startDate === 'string') {
    logs = logs.filter((l) => l.timestamp >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    logs = logs.filter((l) => l.timestamp <= endDate);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: logs,
    total: logs.length,
  });
});
