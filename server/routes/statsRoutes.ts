import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

export const statsRouter = Router();

// GET /api/stats/dashboard - Dashboard figures computed from REAL data
statsRouter.get('/dashboard', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  if (user.role === 'supervisor') {
    // ------------------- PENGAWAS DASHBOARD -------------------
    const personalSchools = db.schools.find((s) => s.supervisorId === user.id && s.isActive);
    const personalPlans = db.plans.find((p) => p.supervisorId === user.id);
    const personalActivities = db.activities.find((a) => a.supervisorId === user.id);
    const personalFollowUps = db.followUps.find((f) => f.supervisorId === user.id);

    const executedActivities = personalActivities.filter((a) => a.status === 'Selesai' || a.status === 'Diperiksa');
    const draftCount = personalActivities.filter((a) => a.status === 'Draf').length;
    const submittedCount = personalActivities.filter((a) => a.status === 'Diajukan').length;
    const needsRevisionCount = personalActivities.filter((a) => a.status === 'Perlu Perbaikan').length;
    const completedCount = personalActivities.filter((a) => a.status === 'Selesai').length;
    const openFollowUpsCount = personalFollowUps.filter((f) => f.status !== 'Selesai').length;

    // Upcoming schedules (from plans where status is 'Direncanakan' and plannedDate >= today)
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingPlans = personalPlans
      .filter((p) => p.status === 'Direncanakan' && p.plannedDate >= todayStr)
      .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
      .slice(0, 5);

    // Recent activities (last 5)
    const recentActivities = [...personalActivities]
      .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        role: 'supervisor',
        summary: {
          schoolCount: personalSchools.length,
          planCount: personalPlans.length,
          executedCount: personalActivities.length,
          completedCount,
          draftCount,
          submittedCount,
          needsRevisionCount,
          openFollowUpsCount,
        },
        upcomingPlans,
        recentActivities,
      },
    });
    return;
  }

  // ------------------- ADMIN & KEPALA DINAS DATA -------------------
  const allSupervisors = db.users.find((u) => u.role === 'supervisor' && u.isActive);
  const allSchools = db.schools.find((s) => s.isActive);
  const allPlans = db.plans.find();
  const allActivities = db.activities.find();
  const allFollowUps = db.followUps.find();
  const allAuditLogs = db.auditLogs.find().slice(0, 8);

  // Distinct subdistricts covered
  const subdistrictsSet = new Set(allSchools.map((s) => s.subdistrict).filter(Boolean));

  // Activity statuses
  const draftCount = allActivities.filter((a) => a.status === 'Draf').length;
  const submittedCount = allActivities.filter((a) => a.status === 'Diajukan').length;
  const verifiedCount = allActivities.filter((a) => a.status === 'Diperiksa').length;
  const needsRevisionCount = allActivities.filter((a) => a.status === 'Perlu Perbaikan').length;
  const completedCount = allActivities.filter((a) => a.status === 'Selesai').length;
  const totalExecuted = allActivities.length;

  const totalPlanned = allPlans.length;
  const realizationRate = totalPlanned > 0 ? Math.round((totalExecuted / totalPlanned) * 100) : 100;
  const openFollowUpsCount = allFollowUps.filter((f) => f.status !== 'Selesai').length;

  // Monthly breakdown (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyDataMap: { [key: string]: { month: string; activities: number; plans: number } } = {};

  allActivities.forEach((act) => {
    const d = new Date(act.activityDate);
    if (!isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyDataMap[key]) monthlyDataMap[key] = { month: label, activities: 0, plans: 0 };
      monthlyDataMap[key].activities++;
    }
  });

  allPlans.forEach((pln) => {
    const d = new Date(pln.plannedDate);
    if (!isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyDataMap[key]) monthlyDataMap[key] = { month: label, activities: 0, plans: 0 };
      monthlyDataMap[key].plans++;
    }
  });

  const monthlyTrend = Object.keys(monthlyDataMap)
    .sort()
    .slice(-6)
    .map((k) => monthlyDataMap[k]);

  // Category breakdown
  const categoryCountMap: { [cat: string]: number } = {};
  allActivities.forEach((act) => {
    act.categories.forEach((cat) => {
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    });
  });

  const categoryBreakdown = Object.entries(categoryCountMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Subdistrict distribution (Schools & Activities per Kecamatan)
  const subdistrictMap: { [sub: string]: { subdistrict: string; schools: number; activities: number } } = {};
  allSchools.forEach((s) => {
    const sub = s.subdistrict || 'Lainnya';
    if (!subdistrictMap[sub]) subdistrictMap[sub] = { subdistrict: sub, schools: 0, activities: 0 };
    subdistrictMap[sub].schools++;
  });
  allActivities.forEach((a) => {
    const school = allSchools.find((s) => s.id === a.schoolId);
    const sub = school?.subdistrict || 'Lainnya';
    if (subdistrictMap[sub]) {
      subdistrictMap[sub].activities++;
    }
  });

  const subdistrictDistribution = Object.values(subdistrictMap).sort((a, b) => b.schools - a.schools);

  // Supervisor activity breakdown
  const supervisorStats = allSupervisors.map((sup) => {
    const supSchools = allSchools.filter((s) => s.supervisorId === sup.id);
    const supPlans = allPlans.filter((p) => p.supervisorId === sup.id);
    const supActs = allActivities.filter((a) => a.supervisorId === sup.id);
    const supCompleted = supActs.filter((a) => a.status === 'Selesai');
    const supFollowUps = allFollowUps.filter((f) => f.supervisorId === sup.id && f.status !== 'Selesai');
    const rate = supPlans.length > 0 ? Math.round((supActs.length / supPlans.length) * 100) : (supActs.length > 0 ? 100 : 0);

    return {
      id: sup.id,
      name: sup.fullName,
      nip: sup.nip || '-',
      jabatanLevel: sup.jabatanLevel || 'Ahli Madya',
      schoolCount: supSchools.length,
      planCount: supPlans.length,
      activityCount: supActs.length,
      completedCount: supCompleted.length,
      openFollowUps: supFollowUps.length,
      realizationRate: rate,
    };
  });

  if (user.role === 'kadis') {
    res.json({
      success: true,
      data: {
        role: 'kadis',
        summary: {
          supervisorCount: allSupervisors.length,
          schoolCount: allSchools.length,
          subdistrictCount: subdistrictsSet.size,
          totalPlanned,
          totalExecuted,
          realizationRate,
          completedCount,
          submittedCount,
          openFollowUpsCount,
        },
        supervisorStats,
        categoryBreakdown,
        subdistrictDistribution,
        monthlyTrend,
      },
    });
    return;
  }

  // Admin Dashboard
  res.json({
    success: true,
    data: {
      role: 'admin',
      summary: {
        supervisorCount: allSupervisors.length,
        schoolCount: allSchools.length,
        subdistrictCount: subdistrictsSet.size,
        totalPlanned,
        totalExecuted,
        unexecutedPlans: Math.max(0, totalPlanned - totalExecuted),
        draftCount,
        submittedCount,
        verifiedCount,
        needsRevisionCount,
        completedCount,
        openFollowUpsCount,
        realizationRate,
      },
      monthlyTrend,
      categoryBreakdown,
      subdistrictDistribution,
      supervisorStats,
      recentAuditLogs: allAuditLogs,
    },
  });
});

// GET /api/stats/monitoring - Detailed monitoring metrics for Admin & Kadis
statsRouter.get(
  '/monitoring',
  authenticate,
  requireRole('admin', 'kadis'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { subdistrict, supervisorId, academicYear, semester } = req.query;

    let schools = db.schools.find((s) => s.isActive);
    let plans = db.plans.find();
    let activities = db.activities.find();
    let followUps = db.followUps.find();
    const supervisors = db.users.find((u) => u.role === 'supervisor' && u.isActive);

    if (academicYear && typeof academicYear === 'string') {
      plans = plans.filter((p) => p.academicYear === academicYear);
      activities = activities.filter((a) => a.academicYear === academicYear);
    }
    if (semester && typeof semester === 'string') {
      plans = plans.filter((p) => p.semester === semester);
      activities = activities.filter((a) => a.semester === semester);
    }
    if (subdistrict && typeof subdistrict === 'string') {
      schools = schools.filter((s) => s.subdistrict.toLowerCase() === subdistrict.toLowerCase());
      const schoolIds = new Set(schools.map((s) => s.id));
      plans = plans.filter((p) => schoolIds.has(p.schoolId));
      activities = activities.filter((a) => schoolIds.has(a.schoolId));
      followUps = followUps.filter((f) => schoolIds.has(f.schoolId));
    }
    if (supervisorId && typeof supervisorId === 'string') {
      schools = schools.filter((s) => s.supervisorId === supervisorId);
      plans = plans.filter((p) => p.supervisorId === supervisorId);
      activities = activities.filter((a) => a.supervisorId === supervisorId);
      followUps = followUps.filter((f) => f.supervisorId === supervisorId);
    }

    const supervisorTable = supervisors.map((sup) => {
      const supSchools = schools.filter((s) => s.supervisorId === sup.id);
      const supPlans = plans.filter((p) => p.supervisorId === sup.id);
      const supActs = activities.filter((a) => a.supervisorId === sup.id);
      const supDraft = supActs.filter((a) => a.status === 'Draf').length;
      const supSubmitted = supActs.filter((a) => a.status === 'Diajukan').length;
      const supCompleted = supActs.filter((a) => a.status === 'Selesai').length;
      const supOpenFollowUps = followUps.filter((f) => f.supervisorId === sup.id && f.status !== 'Selesai').length;
      const rate = supPlans.length > 0 ? Math.round((supActs.length / supPlans.length) * 100) : (supActs.length > 0 ? 100 : 0);

      return {
        id: sup.id,
        name: sup.fullName,
        nip: sup.nip || '-',
        pangkat: sup.pangkatGolongan || '-',
        jabatanLevel: sup.jabatanLevel || 'Ahli Madya',
        schoolCount: supSchools.length,
        schools: supSchools.map((s) => s.name),
        planCount: supPlans.length,
        activityCount: supActs.length,
        draftCount: supDraft,
        submittedCount: supSubmitted,
        completedCount: supCompleted,
        openFollowUps: supOpenFollowUps,
        realizationRate: rate,
      };
    });

    res.json({
      success: true,
      data: {
        totalSchools: schools.length,
        totalPlans: plans.length,
        totalActivities: activities.length,
        supervisorTable,
      },
    });
  }
);
