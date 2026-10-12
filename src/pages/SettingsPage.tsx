import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { AppRegulation, AppSetting } from '../types';
import { Modal } from '../components/ui/Modal';
import {
  ScrollText,
  Plus,
  Save,
  Building,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [regulations, setRegulations] = useState<AppRegulation[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Regulasi Baru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<AppRegulation | null>(null);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regFormData, setRegFormData] = useState({
    title: '',
    number: '',
    year: 2026,
    about: '',
    description: '',
    linkUrl: '',
    notes: '',
  });

  // Settings State
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/regulations');
      if (res.success) {
        setRegulations(res.data.regulations);
        setSettings(res.data.settings);

        const map: Record<string, string> = {};
        res.data.settings.forEach((s: AppSetting) => {
          map[s.key] = s.value;
        });
        setSettingsMap(map);
      }
    } catch {
      toast.error('Gagal memuat pengaturan & referensi regulasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddReg = () => {
    setEditingReg(null);
    setRegFormData({
      title: '',
      number: '',
      year: 2026,
      about: '',
      description: '',
      linkUrl: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditReg = (reg: AppRegulation) => {
    setEditingReg(reg);
    setRegFormData({
      title: reg.title,
      number: reg.number,
      year: reg.year,
      about: reg.about,
      description: reg.description,
      linkUrl: reg.linkUrl || '',
      notes: reg.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveReg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      if (editingReg) {
        const res = await api.put(`/api/regulations/${editingReg.id}`, regFormData);
        toast.success(res.message || 'Dasar hukum berhasil diperbarui.');
      } else {
        const res = await api.post('/api/regulations', regFormData);
        toast.success(res.message || 'Dasar hukum baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan regulasi.');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = Object.entries(settingsMap).map(([key, value]) => ({
        key,
        value,
      }));
      const res = await api.put('/api/regulations/settings/update', { settings: payload });
      toast.success(res.message || 'Pengaturan sistem berhasil disimpan.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan konfigurasi.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-700" />
          Referensi Regulasi & Pengaturan Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dasar hukum utama kepengawasan (PermenPANRB No. 7 Tahun 2026), konfigurasi kop kedinasan, dan parameter pelaporan.
        </p>
      </div>

      {/* Bagian 1: Referensi Regulasi Resmi */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Dasar Hukum Operasional Kepengawasan
            </h3>
            <p className="text-[11px] text-slate-500">
              Peraturan resmi yang menjadi rujukan klasifikasi tugas, instrumen, dan pelaporan supervisi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddReg}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dasar Hukum</span>
          </button>
        </div>

        <div className="space-y-3">
          {regulations.map((reg) => (
            <div
              key={reg.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{reg.title}</span>
                    <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.2 rounded text-[10px]">
                      Tahun {reg.year}
                    </span>
                  </div>
                  <p className="font-medium text-slate-700 mt-0.5">Tentang: {reg.about}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEditReg(reg)}
                  className="p-1.5 text-slate-400 hover:text-blue-700 rounded transition"
                  title="Edit Dasar Hukum"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                {reg.description}
              </p>

              {reg.notes && (
                <div className="text-[10px] text-blue-900 font-medium bg-blue-50 p-2 rounded border border-blue-100">
                  Catatan: {reg.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bagian 2: Pengaturan Kop Surat & Identitas Dinas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Pengaturan Kop Laporan Kedinasan & Parameter
            </h3>
            <p className="text-[11px] text-slate-500">
              Konfigurasi teks kop laporan cetak A4 dan informasi institusi resmi.
            </p>
          </div>

          <button
            type="button"
            disabled={savingSettings}
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kop Baris 1 (Pemerintah Daerah)
            </label>
            <input
              type="text"
              value={settingsMap['KOP_SURAT_LINE1'] || ''}
              onChange={(e) =>
                setSettingsMap({ ...settingsMap, KOP_SURAT_LINE1: e.target.value })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kop Baris 2 (Nama Dinas / Instansi)
            </label>
            <input
              type="text"
              value={settingsMap['KOP_SURAT_LINE2'] || ''}
              onChange={(e) =>
                setSettingsMap({ ...settingsMap, KOP_SURAT_LINE2: e.target.value })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Lengkap Kantor Dinas Pendidikan
            </label>
            <input
              type="text"
              value={settingsMap['KOP_SURAT_ADDRESS'] || ''}
              onChange={(e) =>
                setSettingsMap({ ...settingsMap, KOP_SURAT_ADDRESS: e.target.value })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tahun Pelajaran Berjalan
            </label>
            <input
              type="text"
              value={settingsMap['CURRENT_ACADEMIC_YEAR'] || ''}
              onChange={(e) =>
                setSettingsMap({ ...settingsMap, CURRENT_ACADEMIC_YEAR: e.target.value })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Semester Berjalan
            </label>
            <select
              value={settingsMap['CURRENT_SEMESTER'] || 'Genap'}
              onChange={(e) =>
                setSettingsMap({ ...settingsMap, CURRENT_SEMESTER: e.target.value })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Resmi Batasan Dokumen (Disclaimer SKP/e-Kinerja)
            </label>
            <textarea
              rows={2}
              value={settingsMap['DISCLAIMER_SKP'] || ''}
              onChange={(e) =>
                setSettingsMap({ ...settingsMap, DISCLAIMER_SKP: e.target.value })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit Regulasi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReg ? 'Edit Dasar Hukum Kepengawasan' : 'Tambah Dasar Hukum Baru'}
        subtitle="Rujukan resmi untuk klasifikasi kegiatan dan kewenangan fungsional pengawas."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveReg} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Peraturan / Regulasi *
            </label>
            <input
              type="text"
              value={regFormData.title}
              onChange={(e) => setRegFormData({ ...regFormData, title: e.target.value })}
              required
              placeholder="Contoh: PermenPANRB Nomor 7 Tahun 2026"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor *</label>
              <input
                type="text"
                value={regFormData.number}
                onChange={(e) => setRegFormData({ ...regFormData, number: e.target.value })}
                required
                placeholder="Nomor 7"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun *</label>
              <input
                type="number"
                value={regFormData.year}
                onChange={(e) => setRegFormData({ ...regFormData, year: Number(e.target.value) })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tentang *</label>
            <input
              type="text"
              value={regFormData.about}
              onChange={(e) => setRegFormData({ ...regFormData, about: e.target.value })}
              required
              placeholder="Jabatan Fungsional di Bidang Pendidik dan Pengawasan Mutu Pendidikan"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ringkasan / Uraian Regulasi</label>
            <textarea
              rows={3}
              value={regFormData.description}
              onChange={(e) => setRegFormData({ ...regFormData, description: e.target.value })}
              placeholder="Uraian ruang lingkup tugas, kriteria, jenjang jabatan, atau ketentuan utama"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

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
              disabled={submittingReg}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm"
            >
              {submittingReg ? 'Menyimpan...' : editingReg ? 'Simpan Perubahan' : 'Tambah Regulasi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
