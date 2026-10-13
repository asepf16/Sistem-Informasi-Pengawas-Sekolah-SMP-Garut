import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Info,
  LogIn,
  Users2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('form');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  // Load remembered identifier and dynamic demo accounts
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sipengawas_remembered_user');
      if (savedUser) {
        setIdentifier(savedUser);
        setRememberMe(true);
      }
    } catch {}

    // Fetch live users from server so any name changes are immediately reflected
    api.get('/api/auth/demo-accounts').then((res: any) => {
      if (res?.success && Array.isArray(res.data)) {
        setDemoUsers(res.data);
      }
    }).catch(() => {});
  }, []);

  // Live accounts resolution
  const adminUser = demoUsers.find((u) => u.role === 'admin');
  const kadisUser = demoUsers.find((u) => u.role === 'kadis');
  const liveSupervisors = demoUsers.filter((u) => u.role === 'supervisor');

  const adminInfo = {
    fullName: adminUser?.fullName || 'Asep Saepulloh F. S.Ag.,M.Pd',
    jabatanLevel: adminUser?.jabatanLevel || 'Ahli Utama',
    pangkatGolongan: adminUser?.pangkatGolongan || 'Pembina Utama Muda (IV/c)',
    nip: adminUser?.nip || '197006211997021006',
    username: adminUser?.username || 'admin',
  };

  const kadisInfo = {
    fullName: kadisUser?.fullName || 'H. Asep Wawan Budiman, S.Pd.,M.Si',
    jabatanLevel: kadisUser?.jabatanLevel || 'Eksekutif',
    pangkatGolongan: kadisUser?.pangkatGolongan || 'Pembina Utama Muda (IV C)',
    nip: kadisUser?.nip || '197207061998021001',
    username: kadisUser?.username || 'kadis',
  };

  const defaultSupervisors = [
    {
      id: 'sup-1',
      username: 'kasupardiendang',
      fullName: 'Dr. Endang Kasupardi, M.Pd',
      nip: '197121061998021004',
      pangkatGolongan: 'Pembina Tingkat 1',
      jabatanLevel: 'Ahli Madya',
      isKorwas: true,
    },
    {
      id: 'sup-2',
      username: 'supriatnajajang',
      fullName: 'Dr. Jajang Supriatna,S.Pd,.M.Pd',
      nip: '-',
      pangkatGolongan: 'Pembina Utama Madya ( IV D)',
      jabatanLevel: 'Ahli Utama',
      isKorwas: false,
    },
    {
      id: 'sup-3',
      username: 'syafaritony',
      fullName: 'H. Tony Syafari Sutisna, S,Pd.,M.Pd',
      nip: '-',
      pangkatGolongan: 'Pembina Utama Muda (IV c)',
      jabatanLevel: 'Ahli Madya',
      isKorwas: false,
    },
    {
      id: 'sup-4',
      username: 'purnamaalambudi',
      fullName: 'H. Budi Purnama Alam, S.Pd.,M.Pd',
      nip: '-',
      pangkatGolongan: 'Pembina Utama Muda (IVC)',
      jabatanLevel: 'Ahli Madya',
      isKorwas: false,
    },
  ];

  const displayedSupervisors = liveSupervisors.length > 0 ? liveSupervisors : defaultSupervisors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Username/Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('sipengawas_remembered_user', identifier.trim());
      } else {
        localStorage.removeItem('sipengawas_remembered_user');
      }

      await login(identifier.trim(), password);
      toast.success('Login berhasil! Selamat datang di SIPENGAWAS SMP Garut.');
    } catch (err: any) {
      const msg = err.message || 'Gagal login. Periksa kembali username dan kata sandi Anda.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userStr: string, passStr: string, roleName: string) => {
    setIdentifier(userStr);
    setPassword(passStr);
    setErrorMessage('');
    setLoading(true);
    try {
      await login(userStr, passStr);
      toast.success(`Berhasil masuk sebagai ${roleName}!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal masuk akun uji coba.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Header App Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            SIPENGAWAS SMP GARUT
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-semibold">
            Sistem Informasi Kepengawasan Sekolah Menengah Pertama
          </p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[11px] text-blue-300/90 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-700/50">
              Dinas Pendidikan Kabupaten Garut
            </span>
            <span className="text-[11px] text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
              WIB (Asia/Jakarta)
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden">
          {/* Tab Switcher: Form Manual vs 1-Klik Demo */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2 text-center rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk dengan Kredensial</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2 text-center rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Uji Peran & Akses Akun</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
              <span className="shrink-0 font-bold">&bull;</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            /* Tab 1: Form Login */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username atau Email Kedinasan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: admin atau pengawas1"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Ingat akun di perangkat ini</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-md transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Memverifikasi kredensial...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk ke SIPENGAWAS</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Tab 2: 1-Click Role Accounts */
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pilih peran di bawah ini untuk langsung masuk dan menguji fungsi hak akses masing-masing akun:
              </p>

              <div className="space-y-2.5">
                {/* 1. Admin */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleQuickLogin('admin', 'AdminGarut2026!', 'Administrator')
                  }
                  className="w-full p-3 bg-purple-50/80 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-purple-950">Administrator</span>
                      <span className="bg-purple-200 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-900 font-bold mt-0.5">
                      {adminInfo.fullName}
                    </div>
                    <div className="text-[10px] text-purple-700">
                      Wewenang: Kelola semua data, verifikasi laporan, manajemen pengguna se-Kabupaten
                    </div>
                  </div>
                  <LogIn className="w-4 h-4 text-purple-700 opacity-70 group-hover:opacity-100 transition shrink-0" />
                </button>

                {/* 2. Dynamic Supervisor Accounts */}
                {displayedSupervisors.map((sup, idx) => {
                  const isKorwas =
                    sup.isKorwas ||
                    sup.fullName.toLowerCase().includes('endang') ||
                    sup.fullName.toLowerCase().includes('kasupardi');
                  return (
                    <button
                      key={sup.id || sup.username || idx}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleQuickLogin(sup.username, 'Pengawas123!', sup.fullName)
                      }
                      className="w-full p-3 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-blue-950">
                            {isKorwas ? 'Koordinator Pengawas SMP' : `Pengawas SMP ${idx + 1}`}
                          </span>
                          <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            {sup.jabatanLevel || 'Pengawas SMP'}
                          </span>
                          {isKorwas && (
                            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Koordinator
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-blue-900 font-bold mt-0.5">
                          {sup.fullName}
                        </div>
                        <div className="text-[10px] text-blue-700">
                          {sup.nip && sup.nip !== '-' ? `NIP. ${sup.nip} • ` : ''}
                          {sup.pangkatGolongan ? `${sup.pangkatGolongan} • ` : ''}
                          Sekolah binaan SMP di Garut
                        </div>
                      </div>
                      <LogIn className="w-4 h-4 text-blue-700 opacity-70 group-hover:opacity-100 transition shrink-0" />
                    </button>
                  );
                })}

                {/* 3. Kepala Dinas */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleQuickLogin('kadis', 'KadisGarut2026!', 'Kepala Dinas Pendidikan')
                  }
                  className="w-full p-3 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-950">Kepala Dinas Pendidikan</span>
                      <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Eksekutif
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-900 font-bold mt-0.5">
                      {kadisInfo.fullName}
                    </div>
                    <div className="text-[10px] text-amber-700">
                      {kadisInfo.nip ? `NIP. ${kadisInfo.nip} • ` : ''}Dashboard eksekutif, pantau kinerja seluruh pengawas & sekolah se-Garut
                    </div>
                  </div>
                  <LogIn className="w-4 h-4 text-amber-700 opacity-70 group-hover:opacity-100 transition shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Credential Hint Box (Always visible at bottom) */}
          {activeTab === 'form' && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Kredensial Login Cepat (Klik untuk isi otomatis):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin');
                    setPassword('AdminGarut2026!');
                    setErrorMessage('');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-purple-50 hover:text-purple-900 border border-slate-200 hover:border-purple-200 rounded-lg transition"
                >
                  <div className="font-bold text-purple-900 truncate">Admin</div>
                  <div className="text-[10px] text-slate-500 truncate">{adminInfo.fullName.split(' ')[0]}</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const korwas = displayedSupervisors.find(
                      (s) =>
                        s.fullName.toLowerCase().includes('endang') ||
                        s.fullName.toLowerCase().includes('kasupardi')
                    ) || displayedSupervisors[0];
                    setIdentifier(korwas?.username || 'kasupardiendang');
                    setPassword('Pengawas123!');
                    setErrorMessage('');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 hover:border-blue-200 rounded-lg transition"
                >
                  <div className="font-bold text-blue-900 truncate">Korwas SMP</div>
                  <div className="text-[10px] text-slate-500 truncate">Dr. Endang K.</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const otherSup = displayedSupervisors.find(
                      (s) =>
                        !s.fullName.toLowerCase().includes('endang') &&
                        !s.fullName.toLowerCase().includes('kasupardi')
                    ) || displayedSupervisors[1];
                    setIdentifier(otherSup?.username || 'supriatnajajang');
                    setPassword('Pengawas123!');
                    setErrorMessage('');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 hover:border-indigo-200 rounded-lg transition"
                >
                  <div className="font-bold text-indigo-900 truncate">Pengawas</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {displayedSupervisors.find(
                      (s) =>
                        !s.fullName.toLowerCase().includes('endang') &&
                        !s.fullName.toLowerCase().includes('kasupardi')
                    )?.fullName.split(' ')[0] || 'Pengawas'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('kadis');
                    setPassword('KadisGarut2026!');
                    setErrorMessage('');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-200 rounded-lg transition"
                >
                  <div className="font-bold text-amber-900 truncate">Kadis</div>
                  <div className="text-[10px] text-slate-500 truncate">{kadisInfo.fullName.split(' ')[0]}</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-slate-400 text-[11px] space-y-1">
          <p>
            Dasar Hukum: PermenPANRB Nomor 7 Tahun 2026 tentang Jabatan Fungsional di Bidang Pendidik dan Pengawasan Mutu Pendidikan.
          </p>
          <p className="text-slate-500">
            Pendaftaran publik dinonaktifkan. Pengelolaan akun dikelola terpusat oleh Dinas Pendidikan Kabupaten Garut.
          </p>
        </div>
      </div>
    </div>
  );
};
