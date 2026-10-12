import React from 'react';
import { SupervisionActivity, School, User } from '../../types';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

interface OfficialReportPrintProps {
  activity: SupervisionActivity;
  school?: School;
  supervisor?: User;
  onBack: () => void;
}

export const OfficialReportPrint: React.FC<OfficialReportPrintProps> = ({
  activity,
  school,
  supervisor,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = [
      ['KOP LAPORAN', 'DINAS PENDIDIKAN KABUPATEN GARUT'],
      ['SISTEM', 'SIPENGAWAS SMP GARUT (PermenPANRB No. 7 Tahun 2026)'],
      [],
      ['NOMOR KEGIATAN', activity.activityNumber],
      ['TANGGAL KEGIATAN', activity.activityDate],
      ['WAKTU PELAKSANAAN', activity.activityTime || '-'],
      ['MODA / LOKASI', activity.locationMode],
      ['TAHUN PELAJARAN', activity.academicYear],
      ['SEMESTER', activity.semester],
      ['STATUS LAPORAN', activity.status],
      [],
      ['PENGAWAS PEMBINA', activity.supervisorName],
      ['NIP PENGAWAS', supervisor?.nip || '-'],
      ['PANGKAT / GOLONGAN', supervisor?.pangkatGolongan || '-'],
      ['JENJANG JABATAN', supervisor?.jabatanLevel || 'Ahli Madya'],
      [],
      ['SEKOLAH BINAAN', activity.schoolName],
      ['NPSN', school?.npsn || '-'],
      ['KECAMATAN', school?.subdistrict || '-'],
      ['KEPALA SEKOLAH', school?.principalName || '-'],
      [],
      ['KLASIFIKASI KEGIATAN', activity.categories.join(', ')],
      ['TUJUAN KEGIATAN', activity.objective],
      ['LATAR BELAKANG', activity.background || '-'],
      ['URAIAN KEGIATAN', activity.activityDescription || '-'],
      ['ASPEK YANG DIAMATI', activity.observedAspects || '-'],
      ['METODE & INSTRUMEN', activity.methodsAndInstruments || '-'],
      ['PIHAK TERLIBAT', activity.involvedParties || '-'],
      ['HASIL PENGAWASAN', activity.supervisionResults || '-'],
      ['TEMUAN PENTING', activity.keyFindings || '-'],
      ['PRAKTIK BAIK', activity.goodPractices || '-'],
      ['KENDALA / PERMASALAHAN', activity.challengesProblems || '-'],
      ['ANALISIS HASIL', activity.resultAnalysis || '-'],
      ['REKOMENDASI PERBAIKAN', activity.recommendations || '-'],
      ['RENCANA TINDAK LANJUT', activity.followUpPlan || '-'],
      ['PENANGGUNG JAWAB TL', activity.followUpPersonInCharge || '-'],
      ['TARGET PENYELESAIAN', activity.followUpTargetDate || '-'],
      ['CATATAN TAMBAHAN', activity.additionalNotes || '-'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Supervisi');
    XLSX.writeFile(wb, `Laporan_${activity.activityNumber.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white">
      {/* Control Actions (hidden in print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            Cetak Format A4 (PDF)
          </button>
        </div>
      </div>

      {/* Sheet A4 Paper */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-none shadow-xl print:shadow-none p-8 sm:p-12 rounded-sm print:rounded-none">
        {/* KOP SURAT PEMERINTAH KABUPATEN GARUT */}
        <div className="text-center pb-4 border-b-4 border-double border-slate-900 relative">
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

        {/* Title */}
        <div className="text-center my-6">
          <h1 className="text-base font-bold text-slate-900 uppercase underline tracking-wide">
            Laporan Pelaksanaan Kegiatan Kepengawasan SMP
          </h1>
          <p className="text-xs font-medium text-slate-600 mt-1">
            Nomor: {activity.activityNumber}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 italic">
            Berdasarkan PermenPANRB Nomor 7 Tahun 2026 tentang Jabatan Fungsional di Bidang Pendidik dan Pengawasan Mutu Pendidikan
          </p>
        </div>

        {/* Identitas Section */}
        <div className="space-y-6 text-xs text-slate-900 leading-relaxed">
          {/* Bagian A */}
          <div>
            <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-sm border-l-4 border-blue-800 uppercase mb-3">
              A. Identitas Kepengawasan dan Satuan Pendidikan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-36 py-1 text-slate-600 font-medium">Pengawas Pembina</td>
                    <td className="w-3 py-1">:</td>
                    <td className="py-1 font-bold">{activity.supervisorName}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">NIP</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{supervisor?.nip || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Pangkat / Golongan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{supervisor?.pangkatGolongan || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Jenjang Jabatan</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-semibold">{supervisor?.jabatanLevel || 'Ahli Madya'}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-36 py-1 text-slate-600 font-medium">Sekolah Sasaran</td>
                    <td className="w-3 py-1">:</td>
                    <td className="py-1 font-bold">{activity.schoolName}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">NPSN</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{school?.npsn || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Kecamatan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{school?.subdistrict || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Kepala Sekolah</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{school?.principalName || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bagian B */}
          <div>
            <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-sm border-l-4 border-blue-800 uppercase mb-3">
              B. Waktu dan Klasifikasi Kegiatan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-36 py-1 text-slate-600 font-medium">Hari / Tanggal</td>
                    <td className="w-3 py-1">:</td>
                    <td className="py-1 font-semibold">{formatDateIndo(activity.activityDate)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Waktu</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{activity.activityTime || 'Sesuai Jadwal'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Moda / Lokasi</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{activity.locationMode}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-36 py-1 text-slate-600 font-medium">Tahun Pelajaran</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{activity.academicYear}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Semester</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{activity.semester}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Status Verifikasi</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-bold text-blue-900">{activity.status}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 px-2">
              <p className="text-slate-600 font-medium">Ruang Lingkup Tugas / Klasifikasi:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {activity.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-50 border border-blue-200 text-blue-900 px-2 py-0.5 rounded-xs text-[11px] font-semibold"
                  >
                    &bull; {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bagian C: Rincian Pelaksanaan */}
          <div>
            <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-sm border-l-4 border-blue-800 uppercase mb-3">
              C. Rincian Pelaksanaan Kepengawasan
            </h4>
            <div className="space-y-3 px-2">
              <div>
                <p className="font-semibold text-slate-800">1. Tujuan Kegiatan:</p>
                <p className="text-slate-700 pl-4 mt-0.5">{activity.objective}</p>
              </div>

              {activity.background && (
                <div>
                  <p className="font-semibold text-slate-800">2. Latar Belakang / Dasar Pelaksanaan:</p>
                  <p className="text-slate-700 pl-4 mt-0.5">{activity.background}</p>
                </div>
              )}

              {activity.activityDescription && (
                <div>
                  <p className="font-semibold text-slate-800">3. Uraian Proses Pelaksanaan:</p>
                  <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.activityDescription}</p>
                </div>
              )}

              {activity.observedAspects && (
                <div>
                  <p className="font-semibold text-slate-800">4. Aspek yang Diamati / Dievaluasi:</p>
                  <p className="text-slate-700 pl-4 mt-0.5">{activity.observedAspects}</p>
                </div>
              )}

              {activity.methodsAndInstruments && (
                <div>
                  <p className="font-semibold text-slate-800">5. Metode dan Instrumen Supervisi:</p>
                  <p className="text-slate-700 pl-4 mt-0.5">{activity.methodsAndInstruments}</p>
                </div>
              )}

              {activity.involvedParties && (
                <div>
                  <p className="font-semibold text-slate-800">6. Pihak yang Terlibat:</p>
                  <p className="text-slate-700 pl-4 mt-0.5">{activity.involvedParties}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bagian D: Hasil dan Temuan */}
          <div>
            <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-sm border-l-4 border-blue-800 uppercase mb-3">
              D. Hasil Pemantauan, Analisis, dan Temuan
            </h4>
            <div className="space-y-3 px-2">
              {activity.supervisionResults && (
                <div>
                  <p className="font-semibold text-slate-800">1. Hasil Pemantauan / Penilaian:</p>
                  <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.supervisionResults}</p>
                </div>
              )}

              {activity.keyFindings && (
                <div>
                  <p className="font-semibold text-slate-800">2. Temuan Penting:</p>
                  <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.keyFindings}</p>
                </div>
              )}

              {activity.goodPractices && (
                <div>
                  <p className="font-semibold text-slate-800">3. Praktik Baik / Kekuatan yang Ditemukan:</p>
                  <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.goodPractices}</p>
                </div>
              )}

              {activity.challengesProblems && (
                <div>
                  <p className="font-semibold text-slate-800">4. Kendala / Permasalahan:</p>
                  <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.challengesProblems}</p>
                </div>
              )}

              {activity.resultAnalysis && (
                <div>
                  <p className="font-semibold text-slate-800">5. Analisis Hasil Mutu:</p>
                  <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.resultAnalysis}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bagian E: Rekomendasi & Tindak Lanjut */}
          <div>
            <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-sm border-l-4 border-blue-800 uppercase mb-3">
              E. Rekomendasi dan Rencana Tindak Lanjut
            </h4>
            <div className="space-y-3 px-2">
              <div>
                <p className="font-semibold text-slate-800">1. Rekomendasi Perbaikan:</p>
                <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.recommendations}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">2. Rencana Tindak Lanjut Sekolah:</p>
                <p className="text-slate-700 pl-4 mt-0.5 whitespace-pre-line">{activity.followUpPlan}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="border border-slate-200 p-2.5 rounded-sm bg-slate-50/50">
                  <span className="text-slate-500 font-medium block">Penanggung Jawab Tindak Lanjut:</span>
                  <span className="font-bold text-slate-900">{activity.followUpPersonInCharge || 'Kepala Sekolah'}</span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-sm bg-slate-50/50">
                  <span className="text-slate-500 font-medium block">Target Waktu Penyelesaian:</span>
                  <span className="font-bold text-slate-900">{formatDateIndo(activity.followUpTargetDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Verifikasi Administrator jika ada */}
          {activity.verificationNotes && activity.verificationNotes.length > 0 && (
            <div className="border border-emerald-200 bg-emerald-50/60 p-3 rounded-sm">
              <h5 className="font-bold text-emerald-900 text-xs mb-1">Catatan Verifikasi Dinas Pendidikan:</h5>
              {activity.verificationNotes.map((note) => (
                <div key={note.id} className="text-[11px] text-emerald-800">
                  <p>&bull; <strong>{note.verifierName}</strong> ({note.status}): {note.comment}</p>
                  <span className="text-[10px] text-emerald-600 block pl-3">
                    Waktu Verifikasi: {new Date(note.createdAt).toLocaleString('id-ID')} WIB
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tanda Tangan */}
          <div className="pt-8 mt-12 border-t border-slate-200 break-inside-avoid">
            <div className="grid grid-cols-2 text-center text-xs">
              <div>
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-semibold text-slate-800">Kepala Dinas Pendidikan Kab. Garut</p>
                <div className="h-24 flex items-end justify-center">
                  <p className="text-[11px] italic text-slate-400">[Tanda tangan & stempel dinas]</p>
                </div>
                <p className="font-bold text-slate-900 underline">
                  H. Asep Wawan Budiman, S.Pd.,M.Si
                </p>
                <p className="text-slate-600 text-[11px]">NIP. 197207061998021001</p>
              </div>

              <div>
                <p className="text-slate-600">Garut, {formatDateIndo(activity.activityDate)}</p>
                <p className="font-semibold text-slate-800">Pengawas Pembina,</p>
                <div className="h-24 flex items-end justify-center">
                  <p className="text-[11px] italic text-slate-400">[Tanda tangan]</p>
                </div>
                <p className="font-bold text-slate-900 underline">
                  {activity.supervisorName}
                </p>
                <p className="text-slate-600 text-[11px]">
                  NIP. {supervisor?.nip || '..............................'}
                </p>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-slate-400 italic">
              Dokumen resmi dicetak melalui SIPENGAWAS SMP GARUT pada {new Date().toLocaleString('id-ID')} WIB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
