import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  LayoutDashboard,
  School,
  CalendarDays,
  CalendarCheck2,
  FilePlus2,
  FileSpreadsheet,
  ClipboardList,
  CheckSquare2,
  FileBarChart,
  Users2,
  SlidersHorizontal,
  ScrollText,
  UserCog,
  History,
  ShieldCheck,
  Building,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
}) => {
  const { user, isAdmin, isSupervisor, isKadis, logout } = useAuth();
  const toast = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNav = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.info('Anda telah berhasil keluar dari aplikasi SIPENGAWAS SMP Garut.');
      onClose();
    } catch {
      toast.error('Gagal keluar akun.');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Menu structure partitioned strictly according to RBAC specifications
  const getNavSections = () => {
    const mainSection = {
      title: 'Menu Utama',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          visible: true,
        },
        {
          id: 'schools',
          label: 'Sekolah Binaan',
          icon: School,
          visible: true,
        },
        {
          id: 'plans',
          label: 'Rencana Pengawasan',
          icon: CalendarCheck2,
          visible: true,
        },
        {
          id: 'calendar',
          label: 'Kalender Kegiatan',
          icon: CalendarDays,
          visible: true,
        },
      ],
    };

    const operationalSection = {
      title: 'Pelaksanaan Kepengawasan',
      items: [
        {
          id: 'activity-form',
          label: 'Input Kegiatan',
          icon: FilePlus2,
          visible: !isKadis,
        },
        {
          id: 'activities',
          label: 'Daftar Kegiatan',
          icon: FileSpreadsheet,
          visible: true,
        },
        {
          id: 'results',
          label: 'Hasil Pengawasan',
          icon: ClipboardList,
          visible: true,
        },
        {
          id: 'follow-ups',
          label: 'Tindak Lanjut',
          icon: CheckSquare2,
          visible: true,
        },
        {
          id: 'reports',
          label: 'Laporan Kepengawasan',
          icon: FileBarChart,
          visible: true,
        },
      ],
    };

    const monitoringSection = {
      title: 'Pemantauan & Pimpinan',
      items: [
        {
          id: 'monitoring',
          label: 'Monitoring Kepengawasan',
          icon: SlidersHorizontal,
          visible: isAdmin || isKadis,
        },
        {
          id: 'supervisors',
          label: 'Daftar Pengawas Sekolah',
          icon: Users2,
          visible: isAdmin || isKadis,
        },
      ],
    };

    const systemSection = {
      title: 'Administrasi Sistem',
      items: [
        {
          id: 'users',
          label: 'Manajemen Pengguna',
          icon: UserCog,
          visible: isAdmin,
        },
        {
          id: 'settings',
          label: 'Referensi & Regulasi',
          icon: ScrollText,
          visible: isAdmin,
        },
        {
          id: 'audit-logs',
          label: 'Log Audit Aktivitas',
          icon: History,
          visible: isAdmin,
        },
        {
          id: 'profile',
          label: 'Profil Pengguna',
          icon: ShieldCheck,
          visible: true,
        },
      ],
    };

    return [mainSection, operationalSection, monitoringSection, systemSection];
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6 bg-slate-950">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
            <Building className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-wider text-white">
              SIPENGAWAS
            </span>
            <span className="text-[10px] font-medium text-blue-300 tracking-tight">
              SMP KABUPATEN GARUT
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-blue-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card & Logout in footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30 shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {user?.fullName}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {user?.role === 'kadis'
                    ? 'Kepala Dinas'
                    : user?.role === 'admin'
                    ? 'Administrator'
                    : user?.jabatanLevel || 'Pengawas SMP'}
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Logout Button in Sidebar */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/80 border border-rose-900/50 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Konfirmasi Keluar (Log Out)"
        message="Apakah Anda yakin ingin keluar dari aplikasi SIPENGAWAS SMP GARUT? Sesi Anda akan ditutup dan Anda harus login kembali untuk mengakses data kepengawasan."
        confirmLabel="Ya, Keluar Akun"
        cancelLabel="Batal"
        isDestructive={true}
        loading={isLoggingOut}
      />
    </>
  );
};
