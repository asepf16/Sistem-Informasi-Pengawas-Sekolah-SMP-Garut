import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { api } from '../../api/client';
import {
  Menu,
  LogOut,
  UserCheck,
  ChevronDown,
  Building,
  User,
  Shield,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  activePageTitle: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activePageTitle,
  onNavigate,
}) => {
  const { user, logout, quickLoginAs } = useAuth();
  const toast = useToast();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  // Fetch live accounts for Uji Peran so any name edits are instantly visible
  const fetchDemoAccounts = () => {
    api.get('/api/auth/demo-accounts').then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setDemoAccounts(res.data);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchDemoAccounts();
  }, [user]);

  const getAccountByUsername = (username: string, fallbackName: string, fallbackRank: string) => {
    const acc = demoAccounts.find((a) => a.username === username);
    return {
      fullName: acc?.fullName || fallbackName,
      jabatanLevel: acc?.jabatanLevel || fallbackRank,
      pangkatGolongan: acc?.pangkatGolongan || '',
      nip: acc?.nip || '',
    };
  };

  const adminAccount = getAccountByUsername('admin', 'Asep Saepulloh F. S.Ag.,M.Pd', 'Ahli Utama');
  const pengawas1Account = getAccountByUsername('pengawas1', 'Dr. Jajang Supriatna, S.Pd., M.Pd.', 'Ahli Utama');
  const pengawas2Account = getAccountByUsername('pengawas2', 'Dr. Endang Kasupardi, M.Pd.', 'Ahli Madya');
  const pengawas3Account = getAccountByUsername('pengawas3', 'H. Tony Syafari Surpriatna', 'Ahli Madya');
  const kadisAccount = getAccountByUsername('kadis', 'H. Asep Wawan Budiman, S.Pd.,M.Si', 'Pembina Utama Muda');

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.info('Anda telah berhasil keluar dari aplikasi SIPENGAWAS SMP Garut.');
    } catch {
      toast.error('Gagal keluar akun.');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleQuickSwitch = async (role: UserRole, index = 1, username?: string, displayName?: string) => {
    setShowSwitchMenu(false);
    try {
      await quickLoginAs(role, index, username);
      toast.success(`Beralih akun ke: ${displayName || role}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal beralih akun.');
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator Sistem';
      case 'kadis':
        return 'Kepala Dinas Pendidikan';
      case 'supervisor':
        return 'Pengawas Sekolah SMP';
      default:
        return 'Pengguna';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'kadis':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200 hidden sm:inline-block">
                Kab. Garut
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {activePageTitle}
              </h1>
            </div>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Sistem Informasi Kepengawasan SMP &bull; PermenPANRB No. 7/2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                fetchDemoAccounts();
                setShowSwitchMenu(!showSwitchMenu);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Ganti Peran Pengguna Cepat untuk Pengujian"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Uji Peran:</span>
              <span className="font-semibold text-blue-800 capitalize truncate max-w-[120px]">
                {user?.role === 'kadis' ? 'Kadis' : user?.role === 'admin' ? 'Admin' : 'Pengawas'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Uji Peran Akun Pengguna</span>
                  <span className="text-[10px] font-normal text-blue-600 normal-case bg-blue-50 px-2 py-0.5 rounded">1-Klik Beralih</span>
                </div>

                {/* 1. Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('admin', 1, 'admin', `Administrator (${adminAccount.fullName})`)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-purple-50/80 transition ${
                    user?.role === 'admin' ? 'bg-purple-50 font-semibold border-l-4 border-purple-600' : 'text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Administrator</span>
                      {user?.role === 'admin' && (
                        <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-bold">Aktif</span>
                      )}
                    </div>
                    <div className="text-[11px] text-purple-900 font-semibold truncate mt-0.5">
                      {adminAccount.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {adminAccount.jabatanLevel || 'Ahli Utama'} &bull; Disdik Kab. Garut
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold shrink-0">
                    Admin
                  </span>
                </button>

                {/* 2. Pengawas 1 */}
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('supervisor', 1, 'pengawas1', `Pengawas SMP 1 (${pengawas1Account.fullName})`)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-blue-50/80 transition ${
                    user?.role === 'supervisor' && user?.username === 'pengawas1'
                      ? 'bg-blue-50 font-semibold border-l-4 border-blue-600'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Pengawas SMP 1</span>
                      {user?.username === 'pengawas1' && (
                        <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">Aktif</span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-900 font-semibold truncate mt-0.5">
                      {pengawas1Account.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {pengawas1Account.jabatanLevel || 'Ahli Utama'} &bull; Sekolah Binaan
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                    Pengawas
                  </span>
                </button>

                {/* 3. Pengawas 2 */}
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('supervisor', 2, 'pengawas2', `Pengawas SMP 2 (${pengawas2Account.fullName})`)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-indigo-50/80 transition ${
                    user?.role === 'supervisor' && user?.username === 'pengawas2'
                      ? 'bg-indigo-50 font-semibold border-l-4 border-indigo-600'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Pengawas SMP 2</span>
                      {user?.username === 'pengawas2' && (
                        <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">Aktif</span>
                      )}
                    </div>
                    <div className="text-[11px] text-indigo-900 font-semibold truncate mt-0.5">
                      {pengawas2Account.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {pengawas2Account.jabatanLevel || 'Ahli Madya'} &bull; Sekolah Binaan
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold shrink-0">
                    Pengawas
                  </span>
                </button>

                {/* 4. Pengawas 3 */}
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('supervisor', 3, 'pengawas3', `Pengawas SMP 3 (${pengawas3Account.fullName})`)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-cyan-50/80 transition ${
                    user?.role === 'supervisor' && user?.username === 'pengawas3'
                      ? 'bg-cyan-50 font-semibold border-l-4 border-cyan-600'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Pengawas SMP 3</span>
                      {user?.username === 'pengawas3' && (
                        <span className="text-[9px] bg-cyan-600 text-white px-1.5 py-0.2 rounded-full font-bold">Aktif</span>
                      )}
                    </div>
                    <div className="text-[11px] text-cyan-900 font-semibold truncate mt-0.5">
                      {pengawas3Account.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {pengawas3Account.jabatanLevel || 'Ahli Madya'} &bull; Sekolah Binaan
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold shrink-0">
                    Pengawas
                  </span>
                </button>

                {/* 5. Kadis */}
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('kadis', 1, 'kadis', `Kepala Dinas (${kadisAccount.fullName})`)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-amber-50/80 transition ${
                    user?.role === 'kadis' ? 'bg-amber-50 font-semibold border-l-4 border-amber-600' : 'text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Kepala Dinas Pendidikan</span>
                      {user?.role === 'kadis' && (
                        <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-bold">Aktif</span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-900 font-semibold truncate mt-0.5">
                      {kadisAccount.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Eksekutif Monitoring &bull; Disdik Garut
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                    Kadis
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer group border border-transparent hover:border-slate-200 transition"
            title="Buka Profil Pengguna"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-xs group-hover:bg-blue-800 transition">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition leading-tight">
                {user?.fullName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full border font-medium ${getRoleBadgeColor(
                    user?.role
                  )}`}
                >
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Prominent Logout Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition shadow-xs"
            title="Keluar / Log Out dari Sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Konfirmasi Keluar (Log Out)"
        message="Apakah Anda yakin ingin keluar dari aplikasi SIPENGAWAS SMP GARUT? Sesi Anda akan ditutup dan Anda harus login kembali untuk mengakses data kepengawasan."
        confirmLabel="Ya, Keluar Akun"
        cancelLabel="Tetap di Sini"
        isDestructive={true}
        loading={isLoggingOut}
      />
    </>
  );
};
