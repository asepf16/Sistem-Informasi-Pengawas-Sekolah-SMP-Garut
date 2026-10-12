import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import {
  SupervisionActivity,
  SupervisionPlan,
  School,
  User,
  GARUT_SUBDISTRICTS,
  SUPERVISION_CATEGORIES_LIST,
} from '../types';
import {
  FileBarChart,
  Printer,
  Download,
  Filter,
  Calendar,
  Layers,
  School as SchoolIcon,
  UserCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const REPORT_TYPES = [
  { id: '1', title: '1. Laporan Kegiatan Individual Pengawas' },
  { id: '2', title: '2. Rekapitulasi Kegiatan Berdasarkan Sekolah' },
  { id: '3', title: '3. Rekapitulasi Kegiatan Berdasarkan Pengawas' },
  { id: '4', title: '4. Rekapitulasi Kegiatan per Kecamatan' },
  { id: '5', title: '5. Laporan Pengawasan Akademik' },
  { id: '6', title: '6. Laporan Pengawasan Manajerial' },
  { id: '7', title: '7. Laporan Pemantauan, Penilaian, dan Pembinaan' },
  { id: '8', title: '8. Laporan Penguatan Pendidikan Karakter' },
  { id: '9', title: '9. Laporan Rencana dan Realisasi Kegiatan' },
  { id: '10', title: '10. Laporan Hasil, Rekomendasi, dan Tindak Lanjut' },
  { id: '11', title: '11. Laporan Bulanan Kepengawasan' },
  { id: '12', title: '12. Laporan Semester Kepengawasan' },
  { id: '13', title: '13. Laporan Tahunan Kepengawasan' },
  { id: '14', title: '14. Laporan Rekapitulasi Keseluruhan Kabupaten Garut' },
];

export const ReportsPage: React.FC = () => {
  const { user, isAdmin, isSupervisor, isKadis } = useAuth();
  const toast = useToast();

  const [selectedReportId, setSelectedReportId] = useState('1');
  const [activities, setActivities] = useState<SupervisionActivity[]>([]);
  const [plans, setPlans] = useState<SupervisionPlan[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Genap');
  const [selectedSupervisor, setSelectedSupervisor] = useState(isSupervisor ? user?.id : '');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('03'); // Maret
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actRes, plnRes, schRes, supRes] = await Promise.all([
        api.get('/api/activities'),
        api.get('/api/plans'),
        api.get('/api/schools'),
        api.get('/api/users/supervisors'),
      ]);

      if (actRes.success) setActivities(actRes.data);
      if (plnRes.success) setPlans(plnRes.data);
      if (schRes.success) setSchools(schRes.data);
      if (supRes.success) setSupervisors(supRes.data);
    } catch {
      toast.error('Gagal memuat data sumber laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Compute filtered activities based on selected report criteria
  const getFilteredData = () => {
    let list = [...activities];

    // If supervisor, always lock to own activities
    if (isSupervisor) {
      list = list.filter((a) => a.supervisorId === user?.id);
    } else if (selectedSupervisor) {
      list = list.filter((a) => a.supervisorId === selectedSupervisor);
    }

    if (academicYear) list = list.filter((a) => a.academicYear === academicYear);
    if (semester) list = list.filter((a) => a.semester === semester);
    if (selectedSchool) list = list.filter((a) => a.schoolId === selectedSchool);

    if (selectedSubdistrict) {
      const schInSub = new Set(
        schools.filter((s) => s.subdistrict === selectedSubdistrict).map((s) => s.id)
      );
      list = list.filter((a) => schInSub.has(a.schoolId));
    }

    if (statusFilter) list = list.filter((a) => a.status === statusFilter);

    // Filter by specific report types
    switch (selectedReportId) {
      case '5': // Pengawasan Akademik
        list = list.filter((a) => a.categories.includes('Pengawasan Akademik'));
        break;
      case '6': // Pengawasan Manajerial
        list = list.filter((a) => a.categories.includes('Pengawasan Manajerial'));
        break;
      case '7': // Pemantauan, Penilaian, Pembinaan
        list = list.filter((a) =>
          a.categories.some((c) => ['Pemantauan', 'Penilaian', 'Pembinaan'].includes(c))
        );
        break;
      case '8': // Penguatan Karakter
        list = list.filter((a) => a.categories.includes('Penguatan Pendidikan Karakter'));
        break;
      case '11': // Bulanan
        list = list.filter((a) => {
          const m = a.activityDate.split('-')[1];
          return m === selectedMonth;
        });
        break;
      default:
        break;
    }

    return list;
  };

  const reportData = getFilteredData();
  const currentReportTitle = REPORT_TYPES.find((r) => r.id === selectedReportId)?.title || 'Laporan Kepengawasan';

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const rows = [
      ['KOP LAPORAN', 'PEMERINTAH KABUPATEN GARUT - DINAS PENDIDIKAN'],
      ['SISTEM', 'SIPENGAWAS SMP GARUT (PermenPANRB No. 7 Tahun 2026)'],
      ['JENIS LAPORAN', currentReportTitle],
      ['TAHUN PELAJARAN', academicYear],
      ['SEMESTER', semester],
      ['TANGGAL CETAK', new Date().toLocaleDateString('id-ID')],
      [],
      [
        'No',
        'Nomor Kegiatan',
        'Tanggal',
        'Pengawas Pembina',
        'Sekolah Sasaran',
        'Kecamatan',
        'Klasifikasi Tugas',
        'Tujuan Kegiatan',
        'Hasil Pemantauan',
        'Temuan Penting',
        'Rekomendasi',
        'Rencana Tindak Lanjut',
        'Status Laporan',
      ],
    ];

    reportData.forEach((act, idx) => {
      const sch = schools.find((s) => s.id === act.schoolId);
      rows.push([
        String(idx + 1),
        act.activityNumber,
        act.activityDate,
        act.supervisorName,
        act.schoolName,
        sch?.subdistrict || '-',
        act.categories.join('; '),
        act.objective,
        act.supervisionResults,
        act.keyFindings,
        act.recommendations,
        act.followUpPlan,
        act.status,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_SIPENGAWAS');
    XLSX.writeFile(wb, `Laporan_${selectedReportId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Laporan berhasil diekspor ke Excel.');
  };

  // Available reports based on role
  // Supervisor cannot choose Cross-Supervisor Reports (3, 4, 14)
  const availableReports = REPORT_TYPES.filter((r) => {
    if (isSupervisor && ['3', '4', '14'].includes(r.id)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Control Banner (Hidden in Print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-blue-700" />
              Pusat Pembuatan Laporan Kepengawasan SMP
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih dari 14 jenis laporan resmi, sesuaikan filter, dan cetak dalam format A4 resmi atau ekspor Excel.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={reportData.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={reportData.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Format A4 (PDF)</span>
            </button>
          </div>
        </div>

        {/* Selection & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Jenis Laporan:
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {availableReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tahun & Semester:
            </label>
            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>

          {/* Supervisor Filter (Admin & Kadis only) */}
          {!isSupervisor ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pengawas Sasaran:
              </label>
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="">Semua Pengawas SMP Garut</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.jabatanLevel || 'Pengawas'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sekolah Sasaran:
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="">Semua Sekolah Binaan Anda</option>
                {schools
                  .filter((s) => s.supervisorId === user?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Secondary Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kecamatan (Kab. Garut):</label>
            <select
              value={selectedSubdistrict}
              onChange={(e) => setSelectedSubdistrict(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            >
              <option value="">Semua Wilayah Kecamatan</option>
              {GARUT_SUBDISTRICTS.map((sub) => (
                <option key={sub} value={sub}>
                  Kec. {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Laporan:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="Selesai">Hanya yang Telah Selesai / Sah</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Draf">Draf</option>
            </select>
          </div>

          {selectedReportId === '11' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bulan Pelaporan:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE PREVIEW SHEET A4 FORMAT */}
      <div className="bg-white border border-slate-300 shadow-xl print:border-none print:shadow-none p-8 sm:p-12 rounded-sm print:p-0">
        {/* KOP RESMI */}
        <div className="text-center pb-4 border-b-4 border-double border-slate-900">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold tracking-wider text-slate-800 uppercase">
              Pemerintah Kabupaten Garut
            </h3>
            <h2 className="text-lg font-black tracking-wide text-slate-950 uppercase">
              Dinas Pendidikan
            </h2>
            <p className="text-xs text-slate-700">
              Jalan Pembangunan No. 179, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151
            </p>
            <p className="text-[11px] text-slate-600">
              Laman: disdik.garutkab.go.id &bull; Pos-el: disdik@garutkab.go.id
            </p>
          </div>
        </div>

        {/* Header Laporan */}
        <div className="text-center my-6">
          <h1 className="text-base font-bold text-slate-900 uppercase underline tracking-wide">
            {currentReportTitle}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Tahun Pelajaran: {academicYear} &bull; Semester: {semester}
          </p>
          <p className="text-[11px] text-slate-500 italic mt-0.5">
            Sistem Informasi Kepengawasan Sekolah Menengah Pertama (PermenPANRB Nomor 7 Tahun 2026)
          </p>
        </div>

        {/* Ringkasan Filter & Rekapitulasi */}
        <div className="mb-4 text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 flex flex-wrap justify-between items-center">
          <div>
            <span><strong>Filter Wilayah:</strong> {selectedSubdistrict ? `Kec. ${selectedSubdistrict}` : 'Semua Kecamatan'}</span> &bull;{' '}
            <span><strong>Pengawas:</strong> {isSupervisor ? user?.fullName : (supervisors.find(s => s.id === selectedSupervisor)?.fullName || 'Seluruh Pengawas SMP')}</span>
          </div>
          <div className="font-bold text-slate-900">
            Total Temuan / Kegiatan: {reportData.length} Kegiatan
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse border border-slate-300 text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px]">
              <tr>
                <th className="border border-slate-300 py-2 px-2.5 text-center w-10">No</th>
                <th className="border border-slate-300 py-2 px-2.5 w-24">Tanggal</th>
                <th className="border border-slate-300 py-2 px-2.5">Sekolah Sasaran</th>
                <th className="border border-slate-300 py-2 px-2.5">Pengawas Pembina</th>
                <th className="border border-slate-300 py-2 px-2.5">Tujuan & Klasifikasi</th>
                <th className="border border-slate-300 py-2 px-2.5">Hasil & Rekomendasi</th>
                <th className="border border-slate-300 py-2 px-2.5 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 py-8 text-center text-slate-400 italic">
                    Belum ada data kegiatan kepengawasan untuk parameter laporan yang dipilih.
                  </td>
                </tr>
              ) : (
                reportData.map((act, idx) => (
                  <tr key={act.id} className="align-top">
                    <td className="border border-slate-300 py-2 px-2 text-center text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-mono text-[11px]">
                      <div>{act.activityDate}</div>
                      <div className="text-[10px] text-slate-400">{act.activityNumber}</div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 font-bold text-slate-900">
                      <div>{act.schoolName}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        {schools.find((s) => s.id === act.schoolId)?.subdistrict || '-'}
                      </div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 font-medium text-slate-800">
                      {act.supervisorName}
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5">
                      <div className="font-semibold text-slate-800">{act.objective}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        {act.categories.join(', ')}
                      </div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5">
                      {act.keyFindings && (
                        <div className="text-[11px] mb-1">
                          <strong>Temuan:</strong> {act.keyFindings}
                        </div>
                      )}
                      {act.recommendations && (
                        <div className="text-[11px] text-blue-900 font-medium">
                          <strong>Rekomendasi:</strong> {act.recommendations}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-bold text-[10px]">
                      {act.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Disclaimer SKP Resmi */}
        <div className="mt-6 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500 italic">
          Catatan: Laporan pada SIPENGAWAS SMP GARUT merupakan dokumen pemantauan operasional kepengawasan dinas pendidikan Kabupaten Garut dan tidak secara otomatis menggantikan dokumen SKP/e-Kinerja BKN.
        </div>

        {/* Ruang Tanda Tangan Resmi */}
        <div className="pt-8 mt-10 border-t border-slate-200 break-inside-avoid">
          <div className="grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-800">Kepala Dinas Pendidikan Kab. Garut</p>
              <div className="h-24 flex items-end justify-center">
                <p className="text-[10px] italic text-slate-400">[Tanda tangan & stempel dinas]</p>
              </div>
              <p className="font-bold text-slate-900 underline">
                H. Asep Wawan Budiman, S.Pd.,M.Si
              </p>
              <p className="text-slate-600 text-[11px]">NIP. 197207061998021001</p>
            </div>

            <div>
              <p className="text-slate-600">Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-semibold text-slate-800">
                {isSupervisor ? 'Pengawas Pembina,' : 'Koordinator Pengawas SMP Kab. Garut,'}
              </p>
              <div className="h-24 flex items-end justify-center">
                <p className="text-[10px] italic text-slate-400">[Tanda tangan]</p>
              </div>
              <p className="font-bold text-slate-900 underline">
                {isSupervisor
                  ? user?.fullName
                  : (supervisors.find(
                      (s) =>
                        s.fullName.toLowerCase().includes('endang') ||
                        s.fullName.toLowerCase().includes('kasupardi')
                    )?.fullName || 'Dr. Endang Kasupardi, M.Pd')}
              </p>
              <p className="text-slate-600 text-[11px]">
                NIP.{' '}
                {isSupervisor
                  ? user?.nip || '-'
                  : (supervisors.find(
                      (s) =>
                        s.fullName.toLowerCase().includes('endang') ||
                        s.fullName.toLowerCase().includes('kasupardi')
                    )?.nip || '197121061998021004')}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400">
            Halaman 1 dari 1 &bull; Dicetak melalui SIPENGAWAS SMP GARUT pada {new Date().toLocaleString('id-ID')} WIB
          </div>
        </div>
      </div>
    </div>
  );
};
