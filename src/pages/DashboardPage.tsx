import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatCard } from '../components/ui/StatCard';
import { ActivityStatusBadge, Badge } from '../components/ui/Badge';
import {
  Users2,
  School,
  MapPin,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  FileEdit,
  AlertTriangle,
  Send,
  PlusCircle,
  FilePlus2,
  FileSpreadsheet,
  FileBarChart,
  CheckSquare2,
  ArrowRight,
  TrendingUp,
  PieChart,
  BarChart3,
  Building,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isSupervisor, isKadis } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/stats/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ringkasan dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Memuat data real-time SIPENGAWAS...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        <p className="font-semibold">Terjadi kesalahan memuat dashboard:</p>
        <p className="mt-1">{error || 'Data tidak tersedia.'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-medium text-xs hover:bg-rose-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // =========================================================================
  // 1. DASHBOARD PENGAWAS SEKOLAH (PRIBADI)
  // =========================================================================
  if (isSupervisor) {
    const s = data.summary;
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800">
                Dashboard Mandiri Pengawas SMP
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">
                Selamat Datang, {user?.fullName}
              </h2>
              <p className="text-xs text-blue-200 mt-1">
                NIP: {user?.nip || '-'} &bull; Jenjang Jabatan: {user?.jabatanLevel || 'Ahli Madya'} &bull; Pangkat: {user?.pangkatGolongan || '-'}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                Zona: Asia/Jakarta (WIB)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Aksi Cepat Kepengawasan:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('schools', { action: 'create' })}
              className="flex items-center gap-2 p-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg transition"
            >
              <School className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Tambah Sekolah</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('plans', { action: 'create' })}
              className="flex items-center gap-2 p-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg transition"
            >
              <CalendarCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Buat Rencana</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('activity-form')}
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-xs"
            >
              <FilePlus2 className="w-4 h-4 shrink-0" />
              <span>Input Kegiatan</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 p-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg transition"
            >
              <FileBarChart className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Buat Laporan</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('follow-ups')}
              className="flex items-center gap-2 p-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded-lg transition"
            >
              <CheckSquare2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tindak Lanjut</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Sekolah Binaan"
            value={s.schoolCount}
            subtitle="Tanggung jawab Anda"
            icon={<School className="w-5 h-5" />}
            color="blue"
            onClick={() => onNavigate('schools')}
          />
          <StatCard
            title="Rencana Kerja"
            value={s.planCount}
            subtitle="Tahun berjalan"
            icon={<CalendarCheck2 className="w-5 h-5" />}
            color="indigo"
            onClick={() => onNavigate('plans')}
          />
          <StatCard
            title="Kegiatan Terlaksana"
            value={s.executedCount}
            subtitle={`${s.completedCount} diverifikasi`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
            onClick={() => onNavigate('activities')}
          />
          <StatCard
            title="Laporan Draf"
            value={s.draftCount}
            subtitle="Belum diajukan"
            icon={<FileEdit className="w-5 h-5" />}
            color="slate"
            onClick={() => onNavigate('activities', { status: 'Draf' })}
          />
          <StatCard
            title="Menunggu Review"
            value={s.submittedCount}
            subtitle="Diperiksa Admin"
            icon={<Send className="w-5 h-5" />}
            color="amber"
            onClick={() => onNavigate('activities', { status: 'Diajukan' })}
          />
          <StatCard
            title="Tindak Lanjut Terbuka"
            value={s.openFollowUpsCount}
            subtitle="Perlu pemantauan"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="rose"
            onClick={() => onNavigate('follow-ups')}
          />
        </div>

        {/* Two Columns: Upcoming Plans & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Schedules */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Jadwal Rencana Terdekat</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
              >
                Lihat Kalender <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {data.upcomingPlans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada rencana jadwal mendatang. Klik "Buat Rencana" untuk menyusun jadwal.
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingPlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{plan.schoolName}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{plan.objective}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded shrink-0">
                        {plan.plannedDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="primary" size="sm">{plan.supervisionField}</Badge>
                      <span className="text-[10px] text-slate-500">Metode: {plan.method}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Aktivitas Kepengawasan Terbaru</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('activities')}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
              >
                Semua Kegiatan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {data.recentActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada catatan kegiatan. Klik "Input Kegiatan" untuk menambahkan kegiatan pertama Anda.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivities.map((act: any) => (
                  <div
                    key={act.id}
                    onClick={() => onNavigate('activity-detail', { id: act.id })}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">{act.activityNumber}</span>
                          <ActivityStatusBadge status={act.status} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{act.schoolName}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{act.objective}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium shrink-0">
                        {act.activityDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. DASHBOARD KEPALA DINAS PENDIDIKAN (EKSEKUTIF)
  // =========================================================================
  if (isKadis) {
    const s = data.summary;
    return (
      <div className="space-y-6">
        {/* Header Eksekutif */}
        <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-amber-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
                Dashboard Eksekutif Kepala Dinas Pendidikan Kab. Garut
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">
                Pemantauan Kinerja Pengawas SMP se-Kabupaten Garut
              </h2>
              <p className="text-xs text-amber-100 mt-1">
                Ikhtisar Realisasi Program Berdasarkan PermenPANRB No. 7 Tahun 2026 &bull; Akses Mode: Monitoring Resmi (Read-Only)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('monitoring')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shadow-md flex items-center gap-2 self-start sm:self-auto"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Buka Menu Monitoring Pimpinan</span>
            </button>
          </div>
        </div>

        {/* Key Aggregate Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Pengawas Aktif"
            value={s.supervisorCount}
            subtitle="SMP se-Kab. Garut"
            icon={<Users2 className="w-5 h-5" />}
            color="blue"
            onClick={() => onNavigate('supervisors')}
          />
          <StatCard
            title="Sekolah Binaan"
            value={s.schoolCount}
            subtitle={`Tersebar di ${s.subdistrictCount} Kecamatan`}
            icon={<School className="w-5 h-5" />}
            color="indigo"
            onClick={() => onNavigate('schools')}
          />
          <StatCard
            title="Realisasi Kegiatan"
            value={`${s.realizationRate}%`}
            subtitle={`${s.totalExecuted} terlaksana dari ${s.totalPlanned} rencana`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
            onClick={() => onNavigate('activities')}
          />
          <StatCard
            title="Tindak Lanjut Terbuka"
            value={s.openFollowUpsCount}
            subtitle="Rekomendasi di sekolah"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="rose"
            onClick={() => onNavigate('follow-ups')}
          />
        </div>

        {/* Supervisor Performance Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Progres Kinerja dan Pelaporan per Pengawas SMP
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi komparatif beban sekolah binaan dan persentase ketercapaian rencana kerja
              </p>
            </div>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-xs text-blue-700 font-semibold hover:underline"
            >
              Lihat Rincian Lengkap &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Nama Pengawas</th>
                  <th className="py-2.5 px-3">Jenjang Jabatan</th>
                  <th className="py-2.5 px-3 text-center">Sekolah Binaan</th>
                  <th className="py-2.5 px-3 text-center">Rencana</th>
                  <th className="py-2.5 px-3 text-center">Realisasi</th>
                  <th className="py-2.5 px-3 text-center">Selesai Verifikasi</th>
                  <th className="py-2.5 px-3 text-center">TL Terbuka</th>
                  <th className="py-2.5 px-3 text-right">Tingkat Realisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.supervisorStats?.map((sup: any) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>{sup.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">NIP: {sup.nip}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                        {sup.jabatanLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{sup.schoolCount}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sup.planCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">{sup.activityCount}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">{sup.completedCount}</td>
                    <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">{sup.openFollowUps}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden hidden sm:block">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, sup.realizationRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{sup.realizationRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two Panels: Category Breakdown & Subdistrict Coverage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Sebaran Berdasarkan Jenis Kepengawasan
            </h3>
            <div className="space-y-2.5">
              {data.categoryBreakdown?.map((cat: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate pr-2">&bull; {cat.name}</span>
                  <span className="font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                    {cat.count} kegiatan
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Cakupan Wilayah Kecamatan Terbanyak
            </h3>
            <div className="space-y-2.5">
              {data.subdistrictDistribution?.slice(0, 6).map((sub: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">Kecamatan {sub.subdistrict}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{sub.schools} Sekolah</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {sub.activities} Kunjungan
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. DASHBOARD ADMINISTRATOR (FULL CONTROL & STATISTIK)
  // =========================================================================
  const s = data.summary;
  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800">
              Panel Pengelola Utama &bull; Administrator Dinas
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">
              Sistem Informasi Kepengawasan SMP Kabupaten Garut
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Seluruh data terhubung dengan database terpusat dan divalidasi sesuai PermenPANRB Nomor 7 Tahun 2026.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('supervisors', { action: 'batch' })}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Daftar Pengawas</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('users')}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition shadow-xs"
            >
              Kelola Pengguna
            </button>
            <button
              type="button"
              onClick={() => onNavigate('activities', { status: 'Diajukan' })}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Verifikasi ({s.submittedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="Pengawas Aktif"
          value={s.supervisorCount}
          subtitle="SMP Garut"
          icon={<Users2 className="w-5 h-5" />}
          color="blue"
          onClick={() => onNavigate('supervisors')}
        />
        <StatCard
          title="Sekolah Binaan"
          value={s.schoolCount}
          subtitle={`Di ${s.subdistrictCount} Kecamatan`}
          icon={<School className="w-5 h-5" />}
          color="indigo"
          onClick={() => onNavigate('schools')}
        />
        <StatCard
          title="Total Kegiatan"
          value={s.totalExecuted}
          subtitle={`Rasio Realisasi: ${s.realizationRate}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
          onClick={() => onNavigate('activities')}
        />
        <StatCard
          title="Menunggu Review"
          value={s.submittedCount}
          subtitle="Perlu diverifikasi Admin"
          icon={<Send className="w-5 h-5" />}
          color="amber"
          onClick={() => onNavigate('activities', { status: 'Diajukan' })}
        />
        <StatCard
          title="Telah Diverifikasi"
          value={s.completedCount}
          subtitle="Status Selesai"
          icon={<CheckSquare2 className="w-5 h-5" />}
          color="emerald"
          onClick={() => onNavigate('activities', { status: 'Selesai' })}
        />
        <StatCard
          title="Tindak Lanjut Terbuka"
          value={s.openFollowUpsCount}
          subtitle="Masih berjalan/belum"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="rose"
          onClick={() => onNavigate('follow-ups')}
        />
      </div>

      {/* Overview Tables & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Supervisor Activity Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Statistik Kinerja per Pengawas SMP
            </h3>
            <button
              onClick={() => onNavigate('supervisors')}
              className="text-xs text-blue-700 font-semibold hover:underline"
            >
              Lihat Master Pengawas &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold uppercase">
                <tr>
                  <th className="py-2 px-3">Nama Pengawas</th>
                  <th className="py-2 px-3">Jenjang</th>
                  <th className="py-2 px-3 text-center">Sekolah</th>
                  <th className="py-2 px-3 text-center">Rencana</th>
                  <th className="py-2 px-3 text-center">Kegiatan</th>
                  <th className="py-2 px-3 text-center">Realisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.supervisorStats?.map((sup: any) => (
                  <tr key={sup.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {sup.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {sup.jabatanLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{sup.schoolCount}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sup.planCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">{sup.activityCount}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                      {sup.realizationRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right col: Categories Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Distribusi Jenis Pengawasan
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Sesuai ruang lingkup tugas PermenPANRB Nomor 7 Tahun 2026:
          </p>
          <div className="space-y-2">
            {data.categoryBreakdown?.map((cat: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-800 font-medium truncate pr-2">{cat.name}</span>
                <span className="font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Logs Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Log Aktivitas Sistem Terbaru</h3>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="text-xs text-blue-700 font-semibold hover:underline"
          >
            Lihat Semua Log Audit &rarr;
          </button>
        </div>
        <div className="space-y-2 text-xs">
          {data.recentAuditLogs?.map((log: any) => (
            <div key={log.id} className="flex items-start justify-between p-2 rounded bg-slate-50">
              <div>
                <span className="font-bold text-slate-900">{log.userName}</span>{' '}
                <span className="text-slate-600">({log.userRole}):</span>{' '}
                <span className="text-slate-700">{log.details}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0 pl-3">
                {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
