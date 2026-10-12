import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import {
  School,
  SupervisionPlan,
  SupervisionCategory,
  SUPERVISION_CATEGORIES_LIST,
  Attachment,
} from '../types';
import {
  FilePlus2,
  School as SchoolIcon,
  Calendar,
  Clock,
  Layers,
  Upload,
  Image,
  FileText,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Info,
} from 'lucide-react';

interface ActivityFormPageProps {
  initialData?: any;
  onNavigate: (page: string, params?: any) => void;
}

export const ActivityFormPage: React.FC<ActivityFormPageProps> = ({
  initialData,
  onNavigate,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [plans, setPlans] = useState<SupervisionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    schoolId: initialData?.schoolId || '',
    activityDate: initialData?.activityDate || new Date().toISOString().split('T')[0],
    activityTime: initialData?.activityTime || '08:30 - 12:30 WIB',
    locationMode: 'Luring (Tatap Muka di Sekolah)' as any,
    academicYear: initialData?.academicYear || '2025/2026',
    semester: (initialData?.semester || 'Genap') as 'Ganjil' | 'Genap',
    categories: (initialData?.categories || ['Pengawasan Akademik']) as SupervisionCategory[],
    planId: initialData?.planId || '',
    objective: initialData?.objective || '',
    background: initialData?.background || '',
    activityDescription: initialData?.activityDescription || '',
    observedAspects: initialData?.observedAspects || '',
    methodsAndInstruments: initialData?.methodsAndInstruments || 'Observasi Kelas, Wawancara, Lembar Telaah Supervisi',
    involvedParties: initialData?.involvedParties || 'Kepala Sekolah, Wakasek Kurikulum, Guru Sasaran',
    supervisionResults: initialData?.supervisionResults || '',
    keyFindings: initialData?.keyFindings || '',
    goodPractices: initialData?.goodPractices || '',
    challengesProblems: initialData?.challengesProblems || '',
    resultAnalysis: initialData?.resultAnalysis || '',
    recommendations: initialData?.recommendations || '',
    followUpPlan: initialData?.followUpPlan || '',
    followUpPersonInCharge: initialData?.followUpPersonInCharge || 'Kepala Sekolah / Tim Kurikulum',
    followUpTargetDate: initialData?.followUpTargetDate || '',
    additionalNotes: initialData?.additionalNotes || '',
    attachments: [] as Attachment[],
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [schoolsRes, plansRes] = await Promise.all([
          api.get('/api/schools'),
          api.get('/api/plans'),
        ]);
        if (schoolsRes.success) {
          setSchools(schoolsRes.data);
          if (!formData.schoolId && schoolsRes.data.length > 0) {
            setFormData((prev) => ({ ...prev, schoolId: schoolsRes.data[0].id }));
          }
        }
        if (plansRes.success) setPlans(plansRes.data);
      } catch {
        toast.error('Gagal memuat data referensi form.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleCategory = (cat: SupervisionCategory) => {
    if (formData.categories.includes(cat)) {
      if (formData.categories.length > 1) {
        setFormData({
          ...formData,
          categories: formData.categories.filter((c) => c !== cat),
        });
      }
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, cat],
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi batas 5MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
        toast.success(`Lampiran ${file.name} berhasil ditambahkan.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  };

  const handleSubmit = async (submitForReview: boolean) => {
    if (!formData.schoolId) {
      toast.error('Pilih sekolah binaan sasaran.');
      return;
    }
    if (!formData.activityDate) {
      toast.error('Tanggal kegiatan wajib diisi.');
      return;
    }
    if (!formData.objective.trim()) {
      toast.error('Tujuan kegiatan kepengawasan wajib diisi.');
      return;
    }
    if (!formData.activityDescription.trim()) {
      toast.error('Uraian proses kegiatan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        submitForReview,
      };

      const res = await api.post('/api/activities', payload);
      toast.success(res.message || 'Kegiatan kepengawasan berhasil disimpan.');
      onNavigate('activities');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan laporan kegiatan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-xs text-slate-500 font-medium">Menyiapkan formulir kepengawasan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('activities')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-blue-700" />
              Formulir Input Kegiatan Kepengawasan SMP
            </h2>
            <p className="text-xs text-slate-500">
              Dokumentasi terpadu pemantauan, penilaian, pembinaan, dan analisis mutu satuan pendidikan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Memproses...' : 'Kirim untuk Diperiksa'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* Section 1: Identitas Kegiatan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <SchoolIcon className="w-4 h-4 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm">1. Identitas Pelaksanaan Kegiatan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sekolah Sasaran *</label>
              <select
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subdistrict})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Kegiatan *</label>
              <input
                type="date"
                value={formData.activityDate}
                onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Waktu Pelaksanaan</label>
              <input
                type="text"
                value={formData.activityTime}
                onChange={(e) => setFormData({ ...formData, activityTime: e.target.value })}
                placeholder="Contoh: 08:30 - 12:30 WIB"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Moda / Lokasi Pelaksanaan</label>
              <select
                value={formData.locationMode}
                onChange={(e) => setFormData({ ...formData, locationMode: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Luring (Tatap Muka di Sekolah)">Luring (Tatap Muka di Sekolah)</option>
                <option value="Daring (Virtual/Zoom)">Daring (Virtual/Zoom)</option>
                <option value="Kombinasi (Hybrid)">Kombinasi (Hybrid)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Klasifikasi Ruang Lingkup Tugas PermenPANRB No. 7/2026 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                2. Klasifikasi Ruang Lingkup Tugas Pengawas (PermenPANRB No. 7/2026)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 italic">Pilih satu atau lebih kategori yang relevan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {SUPERVISION_CATEGORIES_LIST.map((cat) => {
              const isChecked = formData.categories.includes(cat);
              return (
                <label
                  key={cat}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 3: Rincian Pelaksanaan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">3. Rincian Pelaksanaan Pengawasan</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tujuan Kegiatan *</label>
              <textarea
                rows={2}
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                required
                placeholder="Tuliskan tujuan spesifik pelaksanaan supervisi ini"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latar Belakang / Dasar Pelaksanaan</label>
              <textarea
                rows={2}
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                placeholder="Dasar kebutuhan pengawasan, evaluasi periode sebelumnya, atau program prioritas dinas"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Uraian Proses Kegiatan *</label>
              <textarea
                rows={4}
                value={formData.activityDescription}
                onChange={(e) => setFormData({ ...formData, activityDescription: e.target.value })}
                required
                placeholder="Langkah-langkah kegiatan: 1. Pra-observasi 2. Observasi langsung di kelas/manajemen 3. Pasca-observasi dan umpan balik"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aspek yang Diamati</label>
                <input
                  type="text"
                  value={formData.observedAspects}
                  onChange={(e) => setFormData({ ...formData, observedAspects: e.target.value })}
                  placeholder="Modul ajar, diferensiasi, RKT, kombel"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode & Instrumen</label>
                <input
                  type="text"
                  value={formData.methodsAndInstruments}
                  onChange={(e) => setFormData({ ...formData, methodsAndInstruments: e.target.value })}
                  placeholder="Observasi, Wawancara, Lembar telaah"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pihak yang Terlibat</label>
                <input
                  type="text"
                  value={formData.involvedParties}
                  onChange={(e) => setFormData({ ...formData, involvedParties: e.target.value })}
                  placeholder="Kepala sekolah, guru sasaran, TPMPS"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Hasil & Analisis */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm">4. Hasil Pemantauan, Analisis, dan Praktik Baik</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hasil Pemantauan / Penilaian</label>
              <textarea
                rows={3}
                value={formData.supervisionResults}
                onChange={(e) => setFormData({ ...formData, supervisionResults: e.target.value })}
                placeholder="Rangkuman kuantitatif / kualitatif hasil pemantauan atau skor evaluasi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temuan Penting</label>
                <textarea
                  rows={2}
                  value={formData.keyFindings}
                  onChange={(e) => setFormData({ ...formData, keyFindings: e.target.value })}
                  placeholder="Fakta atau temuan esensial di lapangan"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Praktik Baik (Good Practices)</label>
                <textarea
                  rows={2}
                  value={formData.goodPractices}
                  onChange={(e) => setFormData({ ...formData, goodPractices: e.target.value })}
                  placeholder="Inovasi atau keunggulan positif yang ditemukan pada guru/sekolah"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kendala / Permasalahan</label>
                <textarea
                  rows={2}
                  value={formData.challengesProblems}
                  onChange={(e) => setFormData({ ...formData, challengesProblems: e.target.value })}
                  placeholder="Faktor hambatan atau kekurangan sarana/kompetensi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Analisis Hasil Mutu</label>
                <textarea
                  rows={2}
                  value={formData.resultAnalysis}
                  onChange={(e) => setFormData({ ...formData, resultAnalysis: e.target.value })}
                  placeholder="Korelasi temuan dengan indikator Rapor Pendidikan / mutu sekolah"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Rekomendasi & Tindak Lanjut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Save className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-slate-900 text-sm">5. Rekomendasi Perbaikan dan Rencana Tindak Lanjut</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rekomendasi Perbaikan *</label>
              <textarea
                rows={2}
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                required
                placeholder="Rekomendasi konkret pengawas untuk diperbaiki oleh kepala sekolah atau guru"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rencana Tindak Lanjut Sekolah *</label>
              <textarea
                rows={2}
                value={formData.followUpPlan}
                onChange={(e) => setFormData({ ...formData, followUpPlan: e.target.value })}
                required
                placeholder="Langkah aksi nyata yang akan dilakukan satuan pendidikan"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab Tindak Lanjut</label>
                <input
                  type="text"
                  value={formData.followUpPersonInCharge}
                  onChange={(e) => setFormData({ ...formData, followUpPersonInCharge: e.target.value })}
                  placeholder="Contoh: Wakasek Kurikulum / Guru Sasaran"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Waktu Penyelesaian</label>
                <input
                  type="date"
                  value={formData.followUpTargetDate}
                  onChange={(e) => setFormData({ ...formData, followUpTargetDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Dokumentasi Bukti Kegiatan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-slate-900 text-sm">6. Dokumentasi dan Bukti Pendukung</h3>
            </div>
            <span className="text-[11px] text-slate-500">Foto kegiatan, notulen, instrumen (Maks. 5MB/file)</span>
          </div>

          <div>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="font-semibold text-slate-700 text-xs">Pilih Berkas atau Foto Bukti</span>
              <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, PDF didukung</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {formData.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {formData.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {att.type.startsWith('image/') ? (
                        <Image className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className="truncate font-medium text-slate-800">{att.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Submission Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-lg">
          <div>
            <span className="font-bold text-xs">Pengawas Pembina: {user?.fullName}</span>
            <p className="text-[11px] text-slate-400">
              Dokumen tersimpan otomatis dan tercatat dalam log audit dinas pendidikan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              Simpan Draf
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Menyimpan...' : 'Kirim untuk Diperiksa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
