import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { SupervisionActivity, ActivityStatus, School, User } from '../types';
import { ActivityStatusBadge, Badge } from '../components/ui/Badge';
import {
  ArrowLeft,
  Printer,
  Calendar,
  School as SchoolIcon,
  User as UserIcon,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface ActivityDetailPageProps {
  activityId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ActivityDetailPage: React.FC<ActivityDetailPageProps> = ({
  activityId,
  onNavigate,
}) => {
  const { user, isAdmin, isSupervisor } = useAuth();
  const toast = useToast();

  const [activity, setActivity] = useState<SupervisionActivity | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin verification form state
  const [verifyStatus, setVerifyStatus] = useState<ActivityStatus>('Selesai');
  const [verifyComment, setVerifyComment] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/activities/${activityId}`);
      if (res.success) {
        setActivity(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat detail kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activityId) fetchDetail();
  }, [activityId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyComment.trim()) {
      toast.error('Catatan verifikasi dinas wajib diisi.');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.post(`/api/activities/${activityId}/verify`, {
        status: verifyStatus,
        comment: verifyComment.trim(),
      });
      toast.success(res.message || 'Verifikasi berhasil disimpan.');
      setVerifyComment('');
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses verifikasi.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-xs text-slate-500 font-medium">
        Memuat rincian kegiatan kepengawasan...
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
        Data kegiatan tidak ditemukan.
        <button
          onClick={() => onNavigate('activities')}
          className="mt-3 block mx-auto text-blue-700 font-bold hover:underline"
        >
          Kembali ke Daftar Kegiatan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('activities')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {activity.activityNumber}
              </span>
              <ActivityStatusBadge status={activity.status} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {activity.schoolName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('official-print', { id: activity.id })}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Format Resmi A4</span>
          </button>
        </div>
      </div>

      {/* Admin Verification Box (when Admin is logged in) */}
      {isAdmin && (
        <div className="bg-purple-50/70 border-2 border-purple-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-200/80">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
            <div>
              <h3 className="font-bold text-purple-950 text-xs uppercase tracking-wide">
                Verifikasi Laporan Kepengawasan (Wewenang Administrator)
              </h3>
              <p className="text-[11px] text-purple-800">
                Lakukan telaah dokumen, berikan catatan umpan balik, dan tetapkan status pengesahan.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-purple-900 mb-1">
                  Ubah Status Verifikasi:
                </label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as ActivityStatus)}
                  className="w-full p-2 bg-white border border-purple-300 rounded-lg text-purple-950 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="Selesai">Selesai (Diverifikasi & Sah)</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan (Kembalikan ke Pengawas)</option>
                  <option value="Diperiksa">Diperiksa (Sedang Ditelaah)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-purple-900 mb-1">
                  Catatan Pemeriksaan / Umpan Balik Resmi *
                </label>
                <input
                  type="text"
                  value={verifyComment}
                  onChange={(e) => setVerifyComment(e.target.value)}
                  required
                  placeholder="Contoh: Dokumen lengkap dan bukti pendukung memenuhi ketentuan PermenPANRB 7/2026."
                  className="w-full p-2 bg-white border border-purple-300 rounded-lg text-purple-950 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{verifying ? 'Memproses...' : 'Simpan Verifikasi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History of Verification Notes */}
      {activity.verificationNotes && activity.verificationNotes.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            Riwayat Catatan Pemeriksaan Dinas
          </h4>
          <div className="space-y-2">
            {activity.verificationNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {note.verifierName} ({note.role}) &bull; Status: <ActivityStatusBadge status={note.status} />
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(note.createdAt).toLocaleString('id-ID')} WIB
                  </span>
                </div>
                <p className="text-slate-700 mt-1 text-xs pl-2 border-l-2 border-blue-600">
                  {note.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Details View */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs text-slate-900">
        {/* Row 1: Key Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Pengawas Pembina</span>
            <span className="font-bold text-slate-900">{activity.supervisorName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Tanggal Pelaksanaan</span>
            <span className="font-bold text-slate-900">{activity.activityDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Waktu & Moda</span>
            <span className="font-semibold text-slate-800">
              {activity.activityTime || '-'} &bull; {activity.locationMode}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Tahun & Semester</span>
            <span className="font-semibold text-slate-800">
              {activity.academicYear} ({activity.semester})
            </span>
          </div>
        </div>

        {/* Categories */}
        <div>
          <span className="text-slate-500 block text-[11px] font-medium mb-1.5">
            Klasifikasi Ruang Lingkup Tugas (PermenPANRB No. 7/2026):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activity.categories.map((cat, idx) => (
              <span
                key={idx}
                className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold"
              >
                &bull; {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Objectives & Descriptions */}
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Tujuan Kegiatan</h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {activity.objective}
            </div>
          </div>

          {activity.background && (
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Latar Belakang</h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                {activity.background}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Uraian Proses Kegiatan</h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed">
              {activity.activityDescription}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Aspek yang Diamati:</span>
              <p className="text-slate-600">{activity.observedAspects || '-'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Metode & Instrumen:</span>
              <p className="text-slate-600">{activity.methodsAndInstruments || '-'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Pihak yang Terlibat:</span>
              <p className="text-slate-600">{activity.involvedParties || '-'}</p>
            </div>
          </div>
        </div>

        {/* Hasil & Temuan */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Hasil Pemantauan dan Analisis</h3>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Hasil Pemantauan / Penilaian:</span>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {activity.supervisionResults || 'Belum diisi'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-950 block mb-1">Temuan Penting:</span>
              <p className="text-amber-900 whitespace-pre-line">
                {activity.keyFindings || '-'}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-950 block mb-1">Praktik Baik (Good Practices):</span>
              <p className="text-emerald-900 whitespace-pre-line">
                {activity.goodPractices || '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Kendala / Permasalahan:</span>
              <p className="text-slate-700 whitespace-pre-line">
                {activity.challengesProblems || '-'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Analisis Hasil Mutu:</span>
              <p className="text-slate-700 whitespace-pre-line">
                {activity.resultAnalysis || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Rekomendasi & Tindak Lanjut */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Rekomendasi dan Rencana Tindak Lanjut</h3>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
            <span className="font-bold text-blue-950 block mb-1">Rekomendasi Perbaikan Pengawas:</span>
            <p className="text-blue-900 whitespace-pre-line leading-relaxed font-medium">
              {activity.recommendations || '-'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Rencana Tindak Lanjut Sekolah:</span>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {activity.followUpPlan || '-'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Penanggung Jawab Tindak Lanjut:</span>
              <span className="font-bold text-slate-900">{activity.followUpPersonInCharge || '-'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Target Tanggal Penyelesaian:</span>
              <span className="font-bold text-slate-900">{activity.followUpTargetDate || '-'}</span>
            </div>
          </div>
        </div>

        {/* Lampiran */}
        {activity.attachments && activity.attachments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Dokumentasi dan Bukti Kegiatan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activity.attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    {att.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className="truncate font-semibold text-slate-800 text-xs">{att.name}</span>
                  </div>
                  <a
                    href={att.dataUrl}
                    download={att.name}
                    className="text-[11px] text-blue-700 font-bold hover:underline shrink-0 pl-2"
                  >
                    Unduh
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
