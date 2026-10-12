import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { SupervisionPlan, School, SUPERVISION_CATEGORIES_LIST } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Badge } from '../components/ui/Badge';
import {
  CalendarCheck2,
  Plus,
  Search,
  Filter,
  Calendar,
  School as SchoolIcon,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface PlansPageProps {
  initialAction?: string;
  onNavigate?: (page: string, params?: any) => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({ initialAction, onNavigate }) => {
  const { user, isAdmin, isSupervisor, isKadis } = useAuth();
  const toast = useToast();

  const [plans, setPlans] = useState<SupervisionPlan[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap' | ''>('Genap');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(initialAction === 'create');
  const [editingPlan, setEditingPlan] = useState<SupervisionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SupervisionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    schoolId: '',
    academicYear: '2025/2026',
    semester: 'Genap' as 'Ganjil' | 'Genap',
    category: ['Pengawasan Akademik'],
    supervisionField: 'Akademik' as 'Akademik' | 'Manajerial' | 'Akademik & Manajerial',
    objective: '',
    targetIndicator: '',
    plannedDate: new Date().toISOString().split('T')[0],
    method: 'Observasi Kelas, Wawancara, Diskusi Terpumpun',
    instruments: 'Instrumen Supervisi Pembelajaran Terstandar',
    expectedOutput: 'Laporan telaah perangkat ajar dan rekomendasi pembinaan',
    notes: '',
    status: 'Direncanakan' as 'Direncanakan' | 'Terlaksana' | 'Dibatalkan',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (academicYear) params.academicYear = academicYear;
      if (semester) params.semester = semester;
      if (statusFilter) params.status = statusFilter;
      if (schoolFilter) params.schoolId = schoolFilter;

      const [plansRes, schoolsRes] = await Promise.all([
        api.get('/api/plans', params),
        api.get('/api/schools'),
      ]);

      if (plansRes.success) setPlans(plansRes.data);
      if (schoolsRes.success) setSchools(schoolsRes.data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat rencana kepengawasan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [academicYear, semester, statusFilter, schoolFilter, user]);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      schoolId: schools[0]?.id || '',
      academicYear: '2025/2026',
      semester: 'Genap',
      category: ['Pengawasan Akademik'],
      supervisionField: 'Akademik',
      objective: '',
      targetIndicator: '',
      plannedDate: new Date().toISOString().split('T')[0],
      method: 'Observasi Kelas, Wawancara, Diskusi Terpumpun',
      instruments: 'Instrumen Supervisi Pembelajaran Terstandar',
      expectedOutput: 'Laporan telaah perangkat ajar dan rekomendasi pembinaan',
      notes: '',
      status: 'Direncanakan',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SupervisionPlan) => {
    setEditingPlan(plan);
    setFormData({
      schoolId: plan.schoolId,
      academicYear: plan.academicYear,
      semester: plan.semester,
      category: plan.category,
      supervisionField: plan.supervisionField,
      objective: plan.objective,
      targetIndicator: plan.targetIndicator,
      plannedDate: plan.plannedDate,
      method: plan.method,
      instruments: plan.instruments,
      expectedOutput: plan.expectedOutput,
      notes: plan.notes || '',
      status: plan.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolId || !formData.objective.trim() || !formData.plannedDate) {
      toast.error('Sekolah, tujuan, dan tanggal rencana wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        const res = await api.put(`/api/plans/${editingPlan.id}`, formData);
        toast.success(res.message || 'Rencana berhasil diperbarui.');
      } else {
        const res = await api.post('/api/plans', formData);
        toast.success(res.message || 'Rencana berhasil disusun.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan rencana.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/api/plans/${deletingPlan.id}`);
      toast.success(res.message || 'Rencana dihapus.');
      setDeletingPlan(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus rencana.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (cat: any) => {
    if (formData.category.includes(cat)) {
      if (formData.category.length > 1) {
        setFormData({
          ...formData,
          category: formData.category.filter((c) => c !== cat),
        });
      }
    } else {
      setFormData({
        ...formData,
        category: [...formData.category, cat],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-indigo-700" />
            Rencana Kerja Kepengawasan SMP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyusunan jadwal, sasaran, metode, dan indikator target kepengawasan berdasarkan PermenPANRB No. 7/2026.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lihat Tampilan Kalender</span>
            </button>
          )}

          {!isKadis && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Susun Rencana Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="2025/2026">TP 2025/2026</option>
            <option value="2026/2027">TP 2026/2027</option>
          </select>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua Semester</option>
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="Direncanakan">Direncanakan</option>
            <option value="Terlaksana">Terlaksana</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-xs"
          >
            <option value="">Semua Sekolah Sasaran</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Total: {plans.length} Rencana
        </span>
      </div>

      {/* Plan Cards / Table */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Memuat rencana pengawasan...
          </div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            Belum ada rencana kegiatan untuk filter ini. Klik "Susun Rencana Baru" untuk memulai.
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {plan.planCode}
                    </span>
                    <span className="font-semibold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {plan.schoolName}
                    </span>
                    <Badge
                      variant={
                        plan.status === 'Terlaksana'
                          ? 'success'
                          : plan.status === 'Dibatalkan'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {plan.status}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      TP {plan.academicYear} &bull; {plan.semester}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{plan.objective}</h3>

                  {plan.targetIndicator && (
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-700">Indikator Target:</strong> {plan.targetIndicator}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span>
                      <strong>Pengawas:</strong> {plan.supervisorName}
                    </span>
                    <span>
                      <strong>Bidang:</strong> {plan.supervisionField}
                    </span>
                    <span>
                      <strong>Metode:</strong> {plan.method}
                    </span>
                    <span>
                      <strong>Instrumen:</strong> {plan.instruments}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-end justify-between gap-2">
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 block">
                      Rencana: {plan.plannedDate}
                    </span>
                  </div>

                  {!isKadis && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {onNavigate && plan.status === 'Direncanakan' && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('activity-form', {
                              planId: plan.id,
                              schoolId: plan.schoolId,
                              objective: plan.objective,
                              categories: plan.category,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition flex items-center gap-1 shadow-xs"
                          title="Eksekusi kegiatan dari rencana ini"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Realisasikan</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                        title="Edit Rencana"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPlan(plan)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                        title="Hapus Rencana"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Susun/Edit Rencana */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Rencana Kepengawasan' : 'Susun Rencana Kerja Kepengawasan'}
        subtitle="Rencanakan target pembinaan, pemantauan, dan evaluasi mutu satuan pendidikan."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sekolah Sasaran *
              </label>
              <select
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Pilih Sekolah Binaan</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subdistrict})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rencana Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                value={formData.plannedDate}
                onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Pelajaran *
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bidang Pengawasan *
              </label>
              <select
                value={formData.supervisionField}
                onChange={(e) => setFormData({ ...formData, supervisionField: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Akademik">Akademik</option>
                <option value="Manajerial">Manajerial</option>
                <option value="Akademik & Manajerial">Akademik & Manajerial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Klasifikasi / Ruang Lingkup Tugas (PermenPANRB 7/2026):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-40 overflow-y-auto">
              {SUPERVISION_CATEGORIES_LIST.map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.category.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tujuan Kegiatan Pengawasan *
            </label>
            <textarea
              rows={2}
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              required
              placeholder="Contoh: Supervisi penerapan pembelajaran terdiferensiasi dan asesmen formatif Kurikulum Merdeka."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Indikator / Hasil yang Ingin Dicapai
            </label>
            <input
              type="text"
              value={formData.targetIndicator}
              onChange={(e) => setFormData({ ...formData, targetIndicator: e.target.value })}
              placeholder="Contoh: 100% guru sasaran telah menerapkan asesmen diagnostik dan formatif."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metode / Bentuk Kegiatan
              </label>
              <input
                type="text"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                placeholder="Observasi, Wawancara, FGD, Coaching"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Instrumen Supervisi
              </label>
              <input
                type="text"
                value={formData.instruments}
                onChange={(e) => setFormData({ ...formData, instruments: e.target.value })}
                placeholder="Instrumen Supervisi Pembelajaran / PBD"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Keluaran (Output)
            </label>
            <input
              type="text"
              value={formData.expectedOutput}
              onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
              placeholder="Laporan hasil supervisi, rekomendasi perbaikan, atau matriks tindak lanjut"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {editingPlan && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Keterlaksanaan
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Direncanakan">Direncanakan</option>
                <option value="Terlaksana">Terlaksana</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Menyimpan...' : editingPlan ? 'Simpan Perubahan' : 'Simpan Rencana'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDelete}
        title="Hapus Rencana Pengawasan"
        message={`Apakah Anda yakin ingin menghapus rencana ${deletingPlan?.planCode} untuk ${deletingPlan?.schoolName}?`}
        confirmLabel="Hapus Rencana"
        loading={submitting}
      />
    </div>
  );
};
