import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { GARUT_SUBDISTRICTS, User } from '../types';
import { Badge } from '../components/ui/Badge';
import {
  SlidersHorizontal,
  TrendingUp,
  School,
  Users2,
  CalendarCheck2,
  AlertTriangle,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  Building,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MonitoringPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isKadis } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Genap');
  const [subdistrict, setSubdistrict] = useState('');

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { academicYear, semester };
      if (subdistrict) params.subdistrict = subdistrict;

      const res = await api.get('/api/stats/monitoring', params);
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast.error('Gagal memuat monitoring pimpinan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, [academicYear, semester, subdistrict]);

  const exportExcel = () => {
    if (!data?.supervisorTable) return;

    const rows = data.supervisorTable.map((sup: any, idx: number) => ({
      No: idx + 1,
      'Nama Pengawas': sup.name,
      NIP: sup.nip,
      'Jenjang Jabatan': sup.jabatanLevel,
      'Pangkat / Golongan': sup.pangkat,
      'Jumlah Sekolah Binaan': sup.schoolCount,
      'Daftar Sekolah': sup.schools.join(', '),
      'Rencana Kegiatan': sup.planCount,
      'Realisasi Kegiatan': sup.activityCount,
      'Draf Laporan': sup.draftCount,
      'Menunggu Verifikasi': sup.submittedCount,
      'Selesai Diverifikasi': sup.completedCount,
      'Tindak Lanjut Terbuka': sup.openFollowUps,
      'Tingkat Realisasi (%)': `${sup.realizationRate}%`,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monitoring_Pengawas_SMP');
    XLSX.writeFile(wb, `Monitoring_Pengawas_SMP_Garut_${academicYear.replace('/', '_')}_${semester}.xlsx`);
    toast.success('Rekapitulasi monitoring berhasil diekspor.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-700" />
            Monitoring Eksekutif Kepengawasan SMP Kabupaten Garut
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instrumen pemantauan terpadu untuk Kepala Dinas dan Administrator dalam mengawal pelaksanaan PermenPANRB No. 7/2026.
          </p>
        </div>

        <button
          type="button"
          onClick={exportExcel}
          disabled={!data}
          className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Rekapitulasi Monitoring</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Periode Pemantauan:</span>
          </div>

          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
          >
            <option value="2025/2026">TP 2025/2026</option>
            <option value="2026/2027">TP 2026/2027</option>
          </select>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>

          <select
            value={subdistrict}
            onChange={(e) => setSubdistrict(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
          >
            <option value="">Semua Kecamatan Garut ({GARUT_SUBDISTRICTS.length})</option>
            {GARUT_SUBDISTRICTS.map((sub) => (
              <option key={sub} value={sub}>
                Kec. {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Total: {data?.totalSchools || 0} SMP Binaan &bull; {data?.totalActivities || 0} Realisasi Kegiatan
        </div>
      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Kinerja Pengawas SMP se-Kabupaten Garut
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rumus Tingkat Realisasi: (Total Kegiatan Terlaksana &divide; Total Rencana Terjadwal) &times; 100%
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-4">Nama Pengawas & NIP</th>
                <th className="py-3 px-3">Jenjang Jabatan</th>
                <th className="py-3 px-3 text-center">Sekolah Binaan</th>
                <th className="py-3 px-3 text-center">Rencana</th>
                <th className="py-3 px-3 text-center">Realisasi</th>
                <th className="py-3 px-3 text-center">Menunggu Review</th>
                <th className="py-3 px-3 text-center">Selesai Diverifikasi</th>
                <th className="py-3 px-3 text-center">TL Terbuka</th>
                <th className="py-3 px-4 text-right">Tingkat Realisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Memuat data komparasi pengawas...
                  </td>
                </tr>
              ) : !data?.supervisorTable || data.supervisorTable.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Tidak ada data pengawas ditemukan untuk parameter ini.
                  </td>
                </tr>
              ) : (
                data.supervisorTable.map((sup: any, idx: number) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{sup.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        NIP: {sup.nip} &bull; Pangkat: {sup.pangkat}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-blue-50 text-blue-900 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-200">
                        {sup.jabatanLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {sup.schoolCount} SMP
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-medium">
                      {sup.planCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700">
                      {sup.activityCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {sup.submittedCount > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {sup.submittedCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {sup.completedCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {sup.openFollowUps > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {sup.openFollowUps}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden hidden sm:block">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, sup.realizationRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {sup.realizationRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
