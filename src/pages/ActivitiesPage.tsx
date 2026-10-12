import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { SupervisionActivity, SUPERVISION_CATEGORIES_LIST, School } from '../types';
import { ActivityStatusBadge, Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ActivitiesPageProps {
  initialStatus?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({
  initialStatus,
  onNavigate,
}) => {
  const { user, isAdmin, isSupervisor, isKadis } = useAuth();
  const toast = useToast();

  const [activities, setActivities] = useState<SupervisionActivity[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Delete modal
  const [deletingActivity, setDeletingActivity] = useState<SupervisionActivity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (schoolFilter) params.schoolId = schoolFilter;

      const [actRes, schRes] = await Promise.all([
        api.get('/api/activities', params),
        api.get('/api/schools'),
      ]);

      if (actRes.success) setActivities(actRes.data);
      if (schRes.success) setSchools(schRes.data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, categoryFilter, schoolFilter, user]);

  const handleDelete = async () => {
    if (!deletingActivity) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/api/activities/${deletingActivity.id}`);
      toast.success(res.message || 'Kegiatan berhasil dihapus.');
      setDeletingActivity(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kegiatan.');
    } finally {
      setDeleting(false);
    }
  };

  const exportExcel = () => {
    const dataToExport = activities.map((a, idx) => ({
      No: idx + 1,
      'Nomor Kegiatan': a.activityNumber,
      Tanggal: a.activityDate,
      'Pengawas Pembina': a.supervisorName,
      'Sekolah Sasaran': a.schoolName,
      'Klasifikasi / Ruang Lingkup': a.categories.join('; '),
      'Tujuan Supervisi': a.objective,
      'Hasil Pengawasan': a.supervisionResults,
      'Temuan Penting': a.keyFindings,
      'Praktik Baik': a.goodPractices,
      'Kendala / Masalah': a.challengesProblems,
      Rekomendasi: a.recommendations,
      'Rencana Tindak Lanjut': a.followUpPlan,
      'Status Laporan': a.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kegiatan_Supervisi');
    XLSX.writeFile(wb, `Laporan_Kegiatan_SIPENGAWAS_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('File Excel berhasil diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            Daftar Kegiatan Kepengawasan SMP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSupervisor
              ? 'Arsip dan status pemeriksaan seluruh kegiatan kepengawasan milik Anda.'
              : 'Seluruh arsip kegiatan kepengawasan SMP se-Kabupaten Garut.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportExcel}
            disabled={activities.length === 0}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          {!isKadis && (
            <button
              type="button"
              onClick={() => onNavigate('activity-form')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Input Kegiatan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nomor kegiatan, sekolah, tujuan, temuan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Semua Status Laporan</option>
            <option value="Draf">Draf</option>
            <option value="Diajukan">Diajukan</option>
            <option value="Diperiksa">Diperiksa</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Selesai">Selesai Diverifikasi</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-xs"
          >
            <option value="">Semua Klasifikasi</option>
            {SUPERVISION_CATEGORIES_LIST.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* School Filter */}
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-xs"
          >
            <option value="">Semua Sekolah</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {(search || statusFilter || categoryFilter || schoolFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setCategoryFilter('');
                setSchoolFilter('');
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nomor & Tanggal</th>
                <th className="py-3 px-4">Sekolah Sasaran</th>
                <th className="py-3 px-4">Pengawas Pembina</th>
                <th className="py-3 px-4">Klasifikasi Tugas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data kegiatan kepengawasan...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada kegiatan ditemukan untuk kriteria filter ini.
                  </td>
                </tr>
              ) : (
                activities.map((act, idx) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono">
                        {act.activityNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {act.activityDate}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{act.schoolName}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {act.objective}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {act.supervisorName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {act.categories.slice(0, 2).map((cat, cIdx) => (
                          <span
                            key={cIdx}
                            className="bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          >
                            {cat}
                          </span>
                        ))}
                        {act.categories.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{act.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ActivityStatusBadge status={act.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigate('activity-detail', { id: act.id })}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition"
                          title="Lihat Detail & Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('official-print', { id: act.id })}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition"
                          title="Cetak Format Resmi A4"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {/* Edit & Delete allowed if not Kadis and (if supervisor, status must not be Selesai) */}
                        {!isKadis && (isAdmin || act.status !== 'Selesai') && (
                          <button
                            type="button"
                            onClick={() => setDeletingActivity(act)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {activities.length} laporan kegiatan kepengawasan.</span>
          <span className="italic">SIPENGAWAS SMP GARUT &bull; Sistem Resmi</span>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingActivity)}
        onClose={() => setDeletingActivity(null)}
        onConfirm={handleDelete}
        title="Hapus Laporan Kegiatan"
        message={`Apakah Anda yakin ingin menghapus kegiatan ${deletingActivity?.activityNumber} di ${deletingActivity?.schoolName}?`}
        confirmLabel="Hapus Kegiatan"
        loading={deleting}
      />
    </div>
  );
};
