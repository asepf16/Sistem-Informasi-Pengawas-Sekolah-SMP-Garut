import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { FollowUpItem, FollowUpStatus } from '../types';
import { FollowUpStatusBadge, Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  CheckSquare2,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  School,
  Edit2,
  MessageSquare,
  Send,
  PlusCircle,
} from 'lucide-react';

interface FollowUpsPageProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({ onNavigate }) => {
  const { user, isKadis } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Update Progress Modal
  const [selectedItem, setSelectedItem] = useState<FollowUpItem | null>(null);
  const [newStatus, setNewStatus] = useState<FollowUpStatus>('Sedang Berjalan');
  const [progressNote, setProgressNote] = useState('');
  const [completionProof, setCompletionProof] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/api/follow-ups', params);
      if (res.success) {
        setItems(res.data);
      }
    } catch {
      toast.error('Gagal memuat daftar tindak lanjut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, user]);

  const handleOpenUpdate = (item: FollowUpItem) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setProgressNote('');
    setCompletionProof(item.completionProofNote || '');
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const payload = {
        status: newStatus,
        progressNote: progressNote.trim(),
        completionProofNote: completionProof.trim(),
      };

      const res = await api.put(`/api/follow-ups/${selectedItem.id}`, payload);
      toast.success(res.message || 'Progres tindak lanjut berhasil diperbarui.');
      setSelectedItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan progres.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      it.schoolName.toLowerCase().includes(q) ||
      it.findingDescription.toLowerCase().includes(q) ||
      it.recommendation.toLowerCase().includes(q) ||
      it.personInCharge.toLowerCase().includes(q) ||
      it.supervisorName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare2 className="w-5 h-5 text-amber-600" />
            Monitoring Tindak Lanjut Rekomendasi Pengawasan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan progres perbaikan mutu di satuan pendidikan berdasarkan rekomendasi supervisi pengawas sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Total:</span>
          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full font-bold">
            {filtered.length} Tindak Lanjut
          </span>
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
            placeholder="Cari sekolah, temuan, rekomendasi, atau PIC..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Semua Status Tindak Lanjut</option>
            <option value="Belum Dimulai">Belum Dimulai</option>
            <option value="Sedang Berjalan">Sedang Berjalan</option>
            <option value="Selesai">Selesai</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Perlu Evaluasi Kembali">Perlu Evaluasi</option>
          </select>

          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Memuat data tindak lanjut...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            Tidak ada data tindak lanjut yang sesuai.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{item.schoolName}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Ref: {item.activityNumber}
                  </span>
                  <FollowUpStatusBadge status={item.status} />
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <Clock className="w-3.5 h-3.5" /> Target: {item.targetDate}
                  </span>
                  <span>Pengawas: <strong>{item.supervisorName}</strong></span>
                </div>
              </div>

              {/* Temuan & Rekomendasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-700 block mb-0.5">Uraian Temuan Supervisi:</span>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{item.findingDescription}</p>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-0.5">Rekomendasi Perbaikan:</span>
                  <p className="text-blue-950 font-medium leading-relaxed">{item.recommendation}</p>
                </div>
              </div>

              {/* Action Plan & PIC */}
              <div className="p-3 bg-slate-50/70 rounded-lg text-xs space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 mb-1">
                  <span><strong>Penanggung Jawab Sekolah:</strong> {item.personInCharge}</span>
                  {item.completedDate && (
                    <span className="text-emerald-700 font-semibold">
                      Tanggal Penyelesaian: {item.completedDate}
                    </span>
                  )}
                </div>
                <p className="text-slate-700">
                  <strong>Rencana Tindakan:</strong> {item.actionPlan}
                </p>
                {item.completionProofNote && (
                  <p className="text-emerald-800 text-[11px] pt-1">
                    <strong>Bukti Penyelesaian:</strong> {item.completionProofNote}
                  </p>
                )}
              </div>

              {/* Progress Notes Log */}
              {item.progressNotes && item.progressNotes.length > 0 && (
                <div className="pl-3 border-l-2 border-amber-400 space-y-1 text-[11px]">
                  <span className="font-bold text-slate-600 block">Riwayat Catatan Progres:</span>
                  {item.progressNotes.map((pn) => (
                    <div key={pn.id} className="text-slate-700">
                      &bull; <strong>{pn.authorName}</strong>: {pn.note}{' '}
                      <span className="text-slate-400 text-[10px]">
                        ({new Date(pn.createdAt).toLocaleDateString('id-ID')})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400">
                  Dibuat pada: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </span>

                {!isKadis && (
                  <button
                    type="button"
                    onClick={() => handleOpenUpdate(item)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Perbarui Status & Catatan Progres</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Progress Modal */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title="Perbarui Perkembangan Tindak Lanjut"
        subtitle={selectedItem ? `${selectedItem.schoolName} (Ref: ${selectedItem.activityNumber})` : ''}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status Tindak Lanjut *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as FollowUpStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold"
            >
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Perlu Evaluasi Kembali">Perlu Evaluasi Kembali</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tambah Catatan Perkembangan Baru
            </label>
            <textarea
              rows={3}
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="Contoh: Sekolah telah melaksanakan workshop kurikulum mini dan menyusun SK jadwal kombel."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Uraian Bukti Penyelesaian (Opsional)
            </label>
            <input
              type="text"
              value={completionProof}
              onChange={(e) => setCompletionProof(e.target.value)}
              placeholder="Contoh: Dokumen SK Kombel No. 421/08/SMP-2026 dan daftar hadir kegiatan."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pembaruan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
