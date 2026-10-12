import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { api } from '../api/client';
import {
  ShieldCheck,
  User,
  KeyRound,
  Lock,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  LogOut,
  Clock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Logout state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Kata sandi lama dan baru wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(res.message || 'Kata sandi berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.info('Anda telah keluar dari aplikasi SIPENGAWAS SMP Garut.');
    } catch {
      toast.error('Gagal keluar.');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-700" />
          Profil Pengguna & Keamanan Akun
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informasi identitas kedinasan terdaftar, pengelolaan sesi, dan pengaturan kata sandi akun SIPENGAWAS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-blue-700 text-white font-extrabold flex items-center justify-center text-2xl shadow-md border-4 border-blue-50">
            {user?.fullName?.charAt(0) || 'U'}
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-900">{user?.fullName}</h3>
            <span className="inline-block mt-1 bg-blue-50 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase text-[10px]">
              {user?.role === 'kadis'
                ? 'Kepala Dinas'
                : user?.role === 'admin'
                ? 'Administrator'
                : user?.jabatanLevel || 'Pengawas Sekolah'}
            </span>
            <p className="text-slate-500 text-[11px] mt-1 font-mono">
              NIP: {user?.nip || '-'}
            </p>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2 text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{user?.phone || '-'}</span>
            </div>
            {user?.pangkatGolongan && (
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user.pangkatGolongan}</span>
              </div>
            )}
          </div>

          {/* Explicit Logout Button in Profile Card */}
          <div className="w-full pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg transition shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>

        {/* Change Password Form & Rights */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Ganti Kata Sandi</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kata Sandi Lama *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi lama Anda"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi kata sandi baru"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm transition"
                >
                  {updatingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>

          {/* User Rights Info */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 text-xs text-blue-950 space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-blue-900">
              Hak Akses Akun Anda:
            </h4>
            <p className="leading-relaxed">
              {user?.role === 'admin'
                ? 'Sebagai Administrator, Anda memiliki kewenangan penuh mengelola seluruh data, memverifikasi laporan supervisi, mengelola pengguna, dan mengubah pengaturan regulasi.'
                : user?.role === 'kadis'
                ? 'Sebagai Kepala Dinas Pendidikan, Anda memiliki akses pemantauan eksekutif secara menyeluruh (Read-Only) terhadap rencana, realisasi, dan tindak lanjut seluruh pengawas SMP Kabupaten Garut.'
                : 'Sebagai Pengawas Sekolah SMP, Anda berwenang mengelola sekolah binaan Anda, menyusun rencana, menginput kegiatan, mengunggah bukti supervisi, dan membuat laporan resmi.'}
            </p>
          </div>
        </div>
      </div>

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
        loading={loggingOut}
      />
    </div>
  );
};
