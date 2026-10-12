import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchoolsPage } from './pages/SchoolsPage';
import { PlansPage } from './pages/PlansPage';
import { CalendarPage } from './pages/CalendarPage';
import { ActivityFormPage } from './pages/ActivityFormPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { ResultsPage } from './pages/ResultsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SupervisorsPage } from './pages/SupervisorsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';
import { OfficialReportPrint } from './components/print/OfficialReportPrint';
import { api } from './api/client';
import { SupervisionActivity } from './types';

function MainLayout() {
  const { user, loading, isAdmin, isKadis } = useAuth();
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [navParams, setNavParams] = useState<any>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Print mode full screen
  const [printActivity, setPrintActivity] = useState<SupervisionActivity | null>(null);

  const navigateTo = async (page: string, params: any = {}) => {
    // Role protection on client side
    if (user?.role === 'supervisor') {
      if (['users', 'settings', 'audit-logs', 'monitoring', 'supervisors'].includes(page)) {
        toast.error('Akses ditolak. Halaman tersebut khusus untuk Administrator / Kepala Dinas.');
        setCurrentPage('dashboard');
        return;
      }
    }

    if (page === 'official-print' && params?.id) {
      try {
        const res = await api.get(`/api/activities/${params.id}`);
        if (res.success) {
          setPrintActivity(res.data);
          setCurrentPage('official-print');
          return;
        }
      } catch {
        toast.error('Gagal membuka lembar cetak laporan.');
      }
    }

    setNavParams(params);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wide text-blue-200">
            Memuat Sistem SIPENGAWAS SMP Garut...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Full print preview mode
  if (currentPage === 'official-print' && printActivity) {
    return (
      <OfficialReportPrint
        activity={printActivity}
        onBack={() => {
          setPrintActivity(null);
          setCurrentPage('activities');
        }}
      />
    );
  }

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'schools':
        return 'Sekolah Binaan';
      case 'plans':
        return 'Rencana Pengawasan';
      case 'calendar':
        return 'Kalender Kegiatan';
      case 'activity-form':
        return 'Input Kegiatan';
      case 'activities':
        return 'Daftar Kegiatan';
      case 'activity-detail':
        return 'Detail Kegiatan';
      case 'results':
        return 'Hasil Pengawasan';
      case 'follow-ups':
        return 'Tindak Lanjut';
      case 'reports':
        return 'Laporan Kepengawasan';
      case 'supervisors':
        return 'Daftar Pengawas Sekolah';
      case 'monitoring':
        return 'Monitoring Kepengawasan';
      case 'users':
        return 'Manajemen Pengguna';
      case 'settings':
        return 'Referensi & Pengaturan';
      case 'audit-logs':
        return 'Log Audit Aktivitas';
      case 'profile':
        return 'Profil Pengguna';
      default:
        return 'SIPENGAWAS SMP GARUT';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activePageTitle={getPageTitle(currentPage)}
          onNavigate={navigateTo}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && <DashboardPage onNavigate={navigateTo} />}
          {currentPage === 'schools' && (
            <SchoolsPage initialAction={navParams.action} onNavigate={navigateTo} />
          )}
          {currentPage === 'plans' && (
            <PlansPage initialAction={navParams.action} onNavigate={navigateTo} />
          )}
          {currentPage === 'calendar' && <CalendarPage onNavigate={navigateTo} />}
          {currentPage === 'activity-form' && (
            <ActivityFormPage initialData={navParams} onNavigate={navigateTo} />
          )}
          {currentPage === 'activities' && (
            <ActivitiesPage initialStatus={navParams.status} onNavigate={navigateTo} />
          )}
          {currentPage === 'activity-detail' && (
            <ActivityDetailPage activityId={navParams.id} onNavigate={navigateTo} />
          )}
          {currentPage === 'results' && <ResultsPage onNavigate={navigateTo} />}
          {currentPage === 'follow-ups' && <FollowUpsPage onNavigate={navigateTo} />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'supervisors' && (
            <SupervisorsPage initialAction={navParams.action} onNavigate={navigateTo} />
          )}
          {currentPage === 'monitoring' && <MonitoringPage onNavigate={navigateTo} />}
          {currentPage === 'users' && <UserManagementPage />}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'audit-logs' && <AuditLogsPage />}
          {currentPage === 'profile' && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </AuthProvider>
  );
}
