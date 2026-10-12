import fs from 'fs';
import path from 'path';
import {
  User,
  School,
  SupervisionPlan,
  SupervisionActivity,
  FollowUpItem,
  AuditLog,
  AppRegulation,
  AppSetting,
} from './types.js';
import { hashPassword } from './auth.js';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface DatabaseStore {
  users: User[];
  schools: School[];
  plans: SupervisionPlan[];
  activities: SupervisionActivity[];
  followUps: FollowUpItem[];
  auditLogs: AuditLog[];
  regulations: AppRegulation[];
  settings: AppSetting[];
}

// In-memory state synchronized atomically to disk
let store: DatabaseStore = {
  users: [],
  schools: [],
  plans: [],
  activities: [],
  followUps: [],
  auditLogs: [],
  regulations: [],
  settings: [],
};

// Guarantee directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Save store to disk atomically
function saveStore(): void {
  try {
    ensureDataDir();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (error) {
    console.error('Failed to write database store:', error);
  }
}

// Load store or initialize with seed
function loadStore(): void {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
      // Ensure all arrays exist
      store.users = store.users || [];
      store.schools = store.schools || [];
      store.plans = store.plans || [];
      store.activities = store.activities || [];
      store.followUps = store.followUps || [];
      store.auditLogs = store.auditLogs || [];
      store.regulations = store.regulations || [];
      store.settings = store.settings || [];
      return;
    } catch (err) {
      console.error('Corrupted store file, reseeding initial data:', err);
    }
  }

  // Reseed if not exists
  seedInitialData();
  saveStore();
}

function seedInitialData(): void {
  const now = new Date().toISOString();

  // 1. Users
  // Admin Utama, 3 Pengawas SMP Garut (Muda, Madya, Utama), Kepala Dinas Pendidikan
  const adminPass = hashPassword('AdminGarut2026!');
  const pengawas1Pass = hashPassword('Pengawas123!');
  const pengawas2Pass = hashPassword('Pengawas123!');
  const pengawas3Pass = hashPassword('Pengawas123!');
  const kadisPass = hashPassword('KadisGarut2026!');

  const users: User[] = [
    {
      id: 'usr-admin-01',
      username: 'admin',
      email: 'asepfirdausy16@dinas.belajar.id',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      role: 'admin',
      fullName: 'Asep Saepulloh F. S.Ag.,M.Pd',
      nip: '197006211997021006',
      pangkatGolongan: 'Pembina Utama Muda (IV/c)',
      jabatanLevel: 'Ahli Utama',
      phone: '081322116537',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-kadis-01',
      username: 'kadis',
      email: 'kadis@disdik.garutkab.go.id',
      passwordHash: kadisPass.hash,
      salt: kadisPass.salt,
      role: 'kadis',
      fullName: 'H. Asep Wawan Budiman, S.Pd.,M.Si',
      nip: '197207061998021001',
      pangkatGolongan: 'Pembina Utama Muda (IV C)',
      jabatanLevel: 'Ahli Madya',
      phone: '081122334455',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-pengawas-01',
      username: 'pengawas1',
      email: 'asep.pengawas@garut.sch.id',
      passwordHash: pengawas1Pass.hash,
      salt: pengawas1Pass.salt,
      role: 'supervisor',
      fullName: 'Dr. Jajang Supriatna, S.Pd., M.Pd.',
      nip: '197006211997021006',
      pangkatGolongan: 'Pembina Utama Madya (IV/d)',
      jabatanLevel: 'Ahli Utama',
      phone: '081394556677',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-pengawas-02',
      username: 'pengawas2',
      email: 'iis.pengawas@garut.sch.id',
      passwordHash: pengawas2Pass.hash,
      salt: pengawas2Pass.salt,
      role: 'supervisor',
      fullName: 'Dr. Endang Kasupardi, M.Pd.',
      nip: '197121061998021004',
      pangkatGolongan: 'Pembina Tingkat I (IV/b)',
      jabatanLevel: 'Ahli Madya',
      phone: '081221889900',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-pengawas-03',
      username: 'pengawas3',
      email: 'cecep.pengawas@garut.sch.id',
      passwordHash: pengawas3Pass.hash,
      salt: pengawas3Pass.salt,
      role: 'supervisor',
      fullName: 'H. Tony Syafari Surpriatna',
      nip: '196911021994121005',
      pangkatGolongan: 'Pembina Utama Muda (IV/c)',
      jabatanLevel: 'Ahli Madya',
      phone: '081312345678',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 2. Sekolah Binaan Riil SMP di Kabupaten Garut
  const schools: School[] = [
    {
      id: 'sch-001',
      npsn: '20209351',
      name: 'SMP Negeri 1 Garut',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. Ahmad Yani No. 43, Pakuwon',
      subdistrict: 'Garut Kota',
      principalName: 'H. Aceng Mulyana, S.Pd., M.Pd.',
      phone: '(0262) 231562',
      email: 'smpn1garut@disdikgarut.id',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      notes: 'Sekolah Rujukan Mutu Wilayah Garut Kota',
      isActive: true,
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-002',
      npsn: '20209352',
      name: 'SMP Negeri 2 Garut',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. Pasundan No. 48, Kota Kulon',
      subdistrict: 'Garut Kota',
      principalName: 'Dra. Hj. Nunung Siti Sarah, M.Pd.',
      phone: '(0262) 232145',
      email: 'smpn2garut@disdikgarut.id',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      notes: 'Program Unggulan Penguatan Literasi & Numerasi',
      isActive: true,
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-003',
      npsn: '20209354',
      name: 'SMP Negeri 1 Tarogong Kidul',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. Terusan Pembangunan No. 12',
      subdistrict: 'Tarogong Kidul',
      principalName: 'Dadan Supriatna, S.Pd., M.M.',
      phone: '(0262) 233789',
      email: 'smpn1tarkid@disdikgarut.id',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      notes: 'Fokus Implementasi Kurikulum Merdeka & Adiwiyata',
      isActive: true,
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-004',
      npsn: '20209355',
      name: 'SMP Negeri 2 Tarogong Kidul',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. Suherman No. 25, Tarogong',
      subdistrict: 'Tarogong Kidul',
      principalName: 'Endang Kuswara, S.Pd., M.Pd.',
      phone: '(0262) 234112',
      email: 'smpn2tarkid@disdikgarut.id',
      supervisorId: 'usr-pengawas-02',
      supervisorName: 'Hj. Iis Rohaeti, S.Pd., M.Si.',
      notes: 'Pendampingan Pengelolaan Kinerja Guru PMM',
      isActive: true,
      createdBy: 'usr-pengawas-02',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-005',
      npsn: '20209358',
      name: 'SMP Negeri 1 Tarogong Kaler',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. Raya Cipanas No. 104',
      subdistrict: 'Tarogong Kaler',
      principalName: 'Yayan Sofyan, M.Pd.',
      phone: '(0262) 235661',
      email: 'smpn1tarkal@disdikgarut.id',
      supervisorId: 'usr-pengawas-02',
      supervisorName: 'Hj. Iis Rohaeti, S.Pd., M.Si.',
      notes: 'Sekolah Ramah Anak dan Pencegahan Perundungan',
      isActive: true,
      createdBy: 'usr-pengawas-02',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-006',
      npsn: '20209363',
      name: 'SMP Negeri 1 Banyuresmi',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. KH. Hasan Arif No. 34',
      subdistrict: 'Banyuresmi',
      principalName: 'Dra. Eni Heryani, M.Pd.',
      phone: '(0262) 441029',
      email: 'smpn1banyuresmi@disdikgarut.id',
      supervisorId: 'usr-pengawas-03',
      supervisorName: 'Drs. Cecep Gunawan, M.Pd.',
      notes: 'Penguatan Asesmen Pembelajaran Terdiferensiasi',
      isActive: true,
      createdBy: 'usr-pengawas-03',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-007',
      npsn: '69786432',
      name: 'SMP IT Darul Abror Garut',
      status: 'Swasta',
      educationLevel: 'SMP',
      address: 'Jl. Cimanuk No. 88, Jayawaras',
      subdistrict: 'Tarogong Kidul',
      principalName: 'Ust. Ridwan Kamil, S.S., M.Ag.',
      phone: '081220998877',
      email: 'darulabror.smpit@gmail.com',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      notes: 'Sekolah Swasta Berbasis Pesantren Terpadu',
      isActive: true,
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sch-008',
      npsn: '20209360',
      name: 'SMP Negeri 1 Cilawu',
      status: 'Negeri',
      educationLevel: 'SMP',
      address: 'Jl. Raya Garut-Tasik KM 8',
      subdistrict: 'Cilawu',
      principalName: 'H. Kusnadi, S.Pd., M.Pd.',
      phone: '(0262) 241902',
      email: 'smpn1cilawu@disdikgarut.id',
      supervisorId: 'usr-pengawas-03',
      supervisorName: 'Drs. Cecep Gunawan, M.Pd.',
      notes: 'Sekolah Berwawasan Lingkungan Hijau',
      isActive: true,
      createdBy: 'usr-pengawas-03',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 3. Rencana Kepengawasan Contoh
  const plans: SupervisionPlan[] = [
    {
      id: 'pln-001',
      planCode: 'RKP-2026-001',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. Jajang Supriatna, S.Pd., M.Pd.',
      schoolId: 'sch-001',
      schoolName: 'SMP Negeri 1 Garut',
      academicYear: '2025/2026',
      semester: 'Genap',
      category: ['Pengawasan Akademik', 'Pembinaan'],
      supervisionField: 'Akademik',
      objective: 'Supervisi klinis modul ajar dan penerapan pembelajaran berdiferensiasi serta asesmen formatif guru SMP Negeri 1 Garut.',
      targetIndicator: '100% guru sasaran telah menyusun modul ajar berdiferensiasi dan instrumen asesmen formatif yang valid.',
      plannedDate: '2026-03-12',
      method: 'Observasi Kelas, Wawancara, Diskusi Kelompok Terpumpun (FGD)',
      instruments: 'Instrumen Observasi Pembelajaran Berdiferensiasi & Telaah Modul Ajar',
      expectedOutput: 'Laporan hasil telaah perangkat ajar dan rekomendasi pembinaan guru.',
      notes: 'Koordinasi dengan Tim Pengembang Kurikulum Sekolah.',
      status: 'Terlaksana',
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pln-002',
      planCode: 'RKP-2026-002',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. Jajang Supriatna, S.Pd., M.Pd.',
      schoolId: 'sch-003',
      schoolName: 'SMP Negeri 1 Tarogong Kidul',
      academicYear: '2025/2026',
      semester: 'Genap',
      category: ['Pengawasan Manajerial', 'Analisis Mutu Satuan Pendidikan'],
      supervisionField: 'Manajerial',
      objective: 'Evaluasi ketercapaian Rapor Pendidikan dan Rencana Kerja Tahunan (RKT) berbasis data.',
      targetIndicator: 'Dokumen RKT dan RKAS berbasis analisis prioritas Rapor Pendidikan tahun berjalan.',
      plannedDate: '2026-03-24',
      method: 'Audit Dokumen, Wawancara Manajemen Sekolah',
      instruments: 'Instrumen Verifikasi Perencanaan Berbasis Data (PBD)',
      expectedOutput: 'Catatan rekomendasi penyelarasan RKAS dengan rekomendasi Rapor Pendidikan.',
      notes: 'Melibatkan Kepala Sekolah, Bendahara BOS, dan Tim PBD.',
      status: 'Terlaksana',
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pln-003',
      planCode: 'RKP-2026-003',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. Jajang Supriatna, S.Pd., M.Pd.',
      schoolId: 'sch-007',
      schoolName: 'SMP IT Darul Abror Garut',
      academicYear: '2025/2026',
      semester: 'Genap',
      category: ['Pemantauan', 'Penguatan Pendidikan Karakter'],
      supervisionField: 'Akademik & Manajerial',
      objective: 'Pemantauan iklim keamanan sekolah, pencegahan perundungan, dan implementasi 7 Kebiasaan Anak Indonesia Hebat.',
      targetIndicator: 'Terbentuknya TPPK aktif dan terlaksananya SOP pencegahan kekerasan di lingkungan sekolah.',
      plannedDate: '2026-04-18',
      method: 'Verifikasi Fisik, Survei Lingkungan Belajar Singkat, Dialog Siswa & Guru',
      instruments: 'Instrumen Pemantauan TPPK & Iklim Inklusif',
      expectedOutput: 'Rekomendasi penguatan program ramah anak dan laporan iklim sekolah.',
      notes: 'Pelaksanaan bertepatan dengan monitoring terpadu wilayah Tarogong Kidul.',
      status: 'Direncanakan',
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pln-004',
      planCode: 'RKP-2026-004',
      supervisorId: 'usr-pengawas-02',
      supervisorName: 'Dr. Endang Kasupardi, M.Pd.',
      schoolId: 'sch-004',
      schoolName: 'SMP Negeri 2 Tarogong Kidul',
      academicYear: '2025/2026',
      semester: 'Genap',
      category: ['Pembinaan', 'Pengawasan Akademik'],
      supervisionField: 'Akademik',
      objective: 'Pendampingan komunitas belajar intra-sekolah (Kombel) untuk optimalisasi PMM.',
      targetIndicator: 'Seluruh guru aktif dalam kombel mingguan dan menyelesaikan aksi nyata.',
      plannedDate: '2026-03-18',
      method: 'Coaching, Mentoring, Praktik Berbagi',
      instruments: 'Instrumen Efektivitas Komunitas Belajar Sekolah',
      expectedOutput: 'Jadwal rutin kombel dan portofolio praktik baik.',
      notes: 'Didampingi narasumber kombel kabupaten.',
      status: 'Terlaksana',
      createdBy: 'usr-pengawas-02',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 4. Kegiatan Kepengawasan Riil
  const activities: SupervisionActivity[] = [
    {
      id: 'act-001',
      activityNumber: 'PS-SMP-2026-001',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      schoolId: 'sch-001',
      schoolName: 'SMP Negeri 1 Garut',
      activityDate: '2026-03-12',
      activityTime: '08:30 - 13:00 WIB',
      locationMode: 'Luring (Tatap Muka di Sekolah)',
      academicYear: '2025/2026',
      semester: 'Genap',
      categories: ['Pengawasan Akademik', 'Pembinaan'],
      planId: 'pln-001',
      objective: 'Supervisi klinis pelaksanaan pembelajaran berdiferensiasi dan asesmen formatif bagi pendidik rumpun MIPA dan IPS.',
      background: 'Tindak lanjut rekomendasi hasil supervisi semester ganjil terkait perlunya penguatan diferensiasi proses dan produk belajar siswa.',
      activityDescription: '1. Pertemuan pra-observasi dengan Kepala Sekolah dan 6 guru sasaran.\n2. Observasi langsung proses pembelajaran di 3 ruang kelas.\n3. Pertemuan pasca-observasi dan pemberian umpan balik konstruktif.\n4. Diskusi terfokus penyusunan rubrik asesmen autentik.',
      observedAspects: 'Kesesuaian modul ajar dengan kebutuhan peserta didik, variasi metode berdiferensiasi, partisipasi aktif murid, dan pemanfaatan media digital.',
      methodsAndInstruments: 'Observasi terstruktur, wawancara reflektif, lembar telaah instrumen asesmen formatif kurikulum merdeka.',
      involvedParties: 'Kepala Sekolah (H. Aceng Mulyana), Wakasek Kurikulum, 6 Guru Sasaran, dan Pengawas Pembina.',
      supervisionResults: 'Telah diobservasi 6 guru (3 IPA, 2 Matematika, 1 IPS). Skor rata-rata pelaksanaan pembelajaran 88,5 (Kategori Amat Baik). 5 dari 6 guru telah memfasilitasi diferensiasi konten dan proses secara dinamis.',
      keyFindings: 'Terdapat kemajuan pesat dalam penggunaan media digital interaktif. Namun, diferensiasi produk masih belum terwadahi secara merata bagi siswa berkebutuhan tempo belajar lebih lambat.',
      goodPractices: 'Penerapan "Corner Learning" di kelas VIII-A di mana siswa memilih media belajar (video, diagram visual, artikel rangkuman) sesuai gaya belajar masing-masing.',
      challengesProblems: 'Guru masih membutuhkan waktu lebih untuk menyiapkan instrumen rubrik penilaian berjenjang (tiering rubrics).',
      resultAnalysis: 'Pembelajaran di SMPN 1 Garut sudah berpusat pada murid, namun penguatan asesmen diagnostik awal materi pokok masih perlu ditingkatkan agar diferensiasi tepat sasaran.',
      recommendations: '1. Mengadakan workshop mini di komunitas belajar sekolah khusus pembuatan rubrik penilaian berjenjang.\n2. Mendokumentasikan praktik baik ke dalam PMM.',
      followUpPlan: 'Kepala sekolah dan Wakasek Kurikulum memfasilitasi sesi berbagi di Komunitas Belajar Sekolah pada hari Sabtu pekan depan.',
      followUpPersonInCharge: 'Wakasek Bidang Akademik / Kurikulum',
      followUpTargetDate: '2026-04-10',
      additionalNotes: 'Kepala sekolah sangat suportif dan berkomitmen menindaklanjuti seluruh rekomendasi.',
      attachments: [],
      status: 'Selesai',
      verificationNotes: [
        {
          id: 'vnt-001',
          verifierId: 'usr-admin-01',
          verifierName: 'Drs. H. Maman Sutarman, M.Pd.',
          role: 'admin',
          status: 'Selesai',
          comment: 'Laporan sangat lengkap, bukti pendukung memenuhi standar PermenPANRB No. 7 Tahun 2026. Diverifikasi resmi.',
          createdAt: now,
        },
      ],
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act-002',
      activityNumber: 'PS-SMP-2026-002',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      schoolId: 'sch-003',
      schoolName: 'SMP Negeri 1 Tarogong Kidul',
      activityDate: '2026-03-24',
      activityTime: '09:00 - 12:30 WIB',
      locationMode: 'Luring (Tatap Muka di Sekolah)',
      academicYear: '2025/2026',
      semester: 'Genap',
      categories: ['Pengawasan Manajerial', 'Analisis Mutu Satuan Pendidikan'],
      planId: 'pln-002',
      objective: 'Evaluasi integrasi rekomendasi Rapor Pendidikan 2025 ke dalam Rencana Kerja Tahunan (RKT) dan RKAS 2026.',
      background: 'Memastikan alokasi anggaran BOS dan program sekolah tepat sasaran pada indikator mutu prioritas (Literasi & Iklim Keamanan Satuan Pendidikan).',
      activityDescription: '1. Telaah dokumen RKT dan draf RKAS bersama Tim Manajemen Sekolah.\n2. Pencocokan program intervensi dengan indikator merah/kuning pada Rapor Pendidikan.\n3. Perumusan indikator kinerja sekolah tahun 2026.',
      observedAspects: 'Kesesuaian pagu anggaran BOS untuk pengadaan buku non-teks bermutu, pelatihan guru, dan sarana ramah anak.',
      methodsAndInstruments: 'Instrumen telaah keselarasan PBD (Perencanaan Berbasis Data), cek silang ARKAS.',
      involvedParties: 'Kepala Sekolah (Dadan Supriatna), Bendahara BOS, Tim Penjaminan Mutu Pendidikan Sekolah (TPMPS).',
      supervisionResults: 'RKT telah mengakomodasi 4 rekomendasi prioritas dari Rapor Pendidikan. Anggaran peningkatan literasi dialokasikan sebesar 18% dari pagu BOS reguler.',
      keyFindings: 'Masih terdapat beberapa kegiatan pelatihan yang belum memiliki indikator keluaran terukur dan jadwal evaluasi berkala.',
      goodPractices: 'Keterlibatan perwakilan Komite Sekolah dalam penyusunan RKT sangat tinggi dan transparan.',
      challengesProblems: 'Keterbatasan sumber daya pendampingan untuk guru mata pelajaran non-bahasa dalam mengintegrasikan literasi.',
      resultAnalysis: 'Kesiapan manajerial sekolah sangat baik. Diperlukan penajaman pada instrumen monitoring internal sekolah terhadap realisasi RKT per triwulan.',
      recommendations: '1. Menambahkan matriks target kinerja per triwulan pada dokumen RKT.\n2. Kepala Sekolah menyelenggarakan rapat evaluasi realisasi RKT setiap akhir triwulan.',
      followUpPlan: 'Penyempurnaan matriks RKT dan pengesahan final oleh Kepala Sekolah bersama Komite Sekolah.',
      followUpPersonInCharge: 'Ketua Tim Pengembang Sekolah (TPS)',
      followUpTargetDate: '2026-04-15',
      additionalNotes: 'Menunggu pengesahan akhir dokumen RKT yang telah disempurnakan.',
      attachments: [],
      status: 'Diajukan',
      verificationNotes: [],
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act-003',
      activityNumber: 'PS-SMP-2026-003',
      supervisorId: 'usr-pengawas-02',
      supervisorName: 'Hj. Iis Rohaeti, S.Pd., M.Si.',
      schoolId: 'sch-004',
      schoolName: 'SMP Negeri 2 Tarogong Kidul',
      activityDate: '2026-03-18',
      activityTime: '10:00 - 14:00 WIB',
      locationMode: 'Luring (Tatap Muka di Sekolah)',
      academicYear: '2025/2026',
      semester: 'Genap',
      categories: ['Pembinaan', 'Pengawasan Akademik'],
      planId: 'pln-004',
      objective: 'Coaching pengurus Komunitas Belajar (Kombel) sekolah untuk akselerasi berbagi praktik baik di platform merdeka mengajar.',
      background: 'Rendahnya keaktifan kombel intra sekolah pada semester sebelumnya berdasarkan pantauan dashboard dinas.',
      activityDescription: '1. Refleksi kendala pertemuan kombel bersama pengurus inti.\n2. Simulasi format telaah praktik baik bersama guru.\n3. Penyusunan jadwal kegiatan kombel 6 pekan ke depan.',
      observedAspects: 'Keaktifan pengurus, keterlibatan guru dalam diskusi kolaboratif, rencana jadwal berbagi praktik.',
      methodsAndInstruments: 'Instrumen telaah kombel, lembar observasi refleksi terbimbing.',
      involvedParties: 'Kepala Sekolah, Pengurus Kombel "Mitra Cendekia", 18 orang Guru SMPN 2 Tarogong Kidul.',
      supervisionResults: 'Pengurus Kombel telah menetapkan 4 topik prioritas untuk 6 pertemuan mendatang. Komitmen kepala sekolah untuk memberikan jam kolaborasi terjadwal.',
      keyFindings: 'Guru membutuhkan pendampingan teknis dalam pembuatan video dokumentasi praktik baik untuk diunggah ke PMM.',
      goodPractices: 'Tersedianya ruang podcast/studio mini sekolah yang siap dimanfaatkan guru untuk berbagi konten pendidikan.',
      challengesProblems: 'Kepadatan jam mengajar guru sering membuat pertemuan kombel tertunda.',
      resultAnalysis: 'Kombel SMPN 2 Tarogong Kidul memiliki potensi besar dengan sarana multimedia yang memadai. Kuncinya pada ketegasan alokasi waktu mingguan.',
      recommendations: 'Menetapkan hari Jumat pekan genap pukul 13.00-15.00 WIB sebagai waktu wajib kombel tanpa benturan tugas mengajar.',
      followUpPlan: 'Penerbitan Surat Keputusan (SK) Kepala Sekolah mengenai jadwal resmi dan penugasan koordinator kombel per rumpun mata pelajaran.',
      followUpPersonInCharge: 'Koordinator Komunitas Belajar Sekolah',
      followUpTargetDate: '2026-04-05',
      additionalNotes: 'Laporan menunggu verifikasi dari koordinator pengawas.',
      attachments: [],
      status: 'Diajukan',
      verificationNotes: [],
      createdBy: 'usr-pengawas-02',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 5. Follow-ups
  const followUps: FollowUpItem[] = [
    {
      id: 'flw-001',
      activityId: 'act-001',
      activityNumber: 'PS-SMP-2026-001',
      schoolId: 'sch-001',
      schoolName: 'SMP Negeri 1 Garut',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      findingDescription: 'Diferensiasi produk dan rubrik penilaian berjenjang belum merata di seluruh rumpun mapel.',
      recommendation: 'Menyelenggarakan workshop penyusunan rubrik asesmen autentik dan berjenjang di Kombel Sekolah.',
      actionPlan: 'Pelaksanaan workshop internal Kombel dan bedah modul ajar berdiferensiasi bersama narasumber internal.',
      personInCharge: 'Wakasek Akademik / Kurikulum',
      targetDate: '2026-04-10',
      status: 'Sedang Berjalan',
      progressNotes: [
        {
          id: 'pnt-001',
          note: 'Jadwal workshop telah disepakati pada hari Sabtu tanggal 28 Maret 2026. Bahan modul telah disiapkan.',
          authorName: 'Wakasek Kurikulum',
          createdAt: now,
        },
      ],
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'flw-002',
      activityId: 'act-002',
      activityNumber: 'PS-SMP-2026-002',
      schoolId: 'sch-003',
      schoolName: 'SMP Negeri 1 Tarogong Kidul',
      supervisorId: 'usr-pengawas-01',
      supervisorName: 'Dr. H. Asep Saepulloh, M.M.Pd.',
      findingDescription: 'Dokumen RKT belum mencantumkan matriks target keluaran per triwulan secara spesifik.',
      recommendation: 'Melengkapi matriks indikator keberhasilan triwulan sebelum penetapan final ARKAS.',
      actionPlan: 'Tim Penjaminan Mutu Sekolah menyusun matriks triwulan dan mengintegrasikannya ke lampiran RKT.',
      personInCharge: 'Ketua Tim Pengembang Sekolah (TPS)',
      targetDate: '2026-04-15',
      status: 'Belum Dimulai',
      progressNotes: [],
      createdBy: 'usr-pengawas-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'flw-003',
      activityId: 'act-003',
      activityNumber: 'PS-SMP-2026-003',
      schoolId: 'sch-004',
      schoolName: 'SMP Negeri 2 Tarogong Kidul',
      supervisorId: 'usr-pengawas-02',
      supervisorName: 'Hj. Iis Rohaeti, S.Pd., M.Si.',
      findingDescription: 'Belum ada SK dan kepastian waktu luang guru untuk kegiatan kombel intra sekolah.',
      recommendation: 'Menerbitkan SK Kepala Sekolah yang menetapkan waktu wajib kombel tanpa benturan jadwal KBM.',
      actionPlan: 'Kepala Sekolah merumuskan SK Kombel dan menyosialisasikannya kepada seluruh dewan guru.',
      personInCharge: 'Kepala SMPN 2 Tarogong Kidul',
      targetDate: '2026-04-05',
      status: 'Sedang Berjalan',
      progressNotes: [
        {
          id: 'pnt-002',
          note: 'Draf SK penetapan kombel telah selesai disusun dan diselaraskan dengan pembagian tugas mengajar semester genap.',
          authorName: 'Hj. Iis Rohaeti, S.Pd., M.Si.',
          createdAt: now,
        },
      ],
      createdBy: 'usr-pengawas-02',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 6. Audit Logs Awal
  const auditLogs: AuditLog[] = [
    {
      id: 'log-001',
      userId: 'usr-admin-01',
      userName: 'Drs. H. Maman Sutarman, M.Pd.',
      userRole: 'admin',
      action: 'BOOTSTRAP_SYSTEM',
      entityType: 'System',
      entityId: 'SIPENGAWAS-GARUT',
      details: 'Inisialisasi sistem informasi kepengawasan SMP Kabupaten Garut dan konfigurasi master data awal.',
      timestamp: now,
    },
  ];

  // 7. Dasar Hukum Resmi Kepengawasan
  const regulations: AppRegulation[] = [
    {
      id: 'reg-001',
      title: 'PermenPANRB Nomor 7 Tahun 2026',
      number: 'Nomor 7',
      year: 2026,
      about: 'Jabatan Fungsional di Bidang Pendidik dan Pengawasan Mutu Pendidikan',
      description: 'Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi yang mengatur kedudukan, tugas pokok, jenjang jabatan (Ahli Muda, Ahli Madya, Ahli Utama), ruang lingkup pengawasan akademik dan manajerial, serta mekanisme pembinaan mutu satuan pendidikan.',
      linkUrl: 'https://jdih.menpan.go.id',
      isActive: true,
      notes: 'Rujukan hukum utama operasional pengawasan pada aplikasi SIPENGAWAS SMP GARUT.',
    },
    {
      id: 'reg-002',
      title: 'Permendikbudristek Nomor 40 Tahun 2021',
      number: 'Nomor 40',
      year: 2021,
      about: 'Penugasan Guru sebagai Kepala Sekolah',
      description: 'Ketentuan supervisi dan pendampingan manajerial bagi satuan pendidikan dan kepala sekolah oleh Pengawas Sekolah.',
      linkUrl: 'https://jdih.kemdikbud.go.id',
      isActive: true,
      notes: 'Rujukan supervisi manajerial tata kelola satuan pendidikan.',
    },
    {
      id: 'reg-003',
      title: 'Peraturan Dirjen GTK Nomor 4831/B/HK.03.01/2023',
      number: '4831/B/HK.03.01/2023',
      year: 2023,
      about: 'Peran Pengawas Sekolah dalam Implementasi Kebijakan Merdeka Belajar',
      description: 'Transformasi peran pengawas sekolah dari pengendali administratif menjadi pendamping/coach satuan pendidikan dalam memfasilitasi peningkatan mutu pembelajaran murid.',
      linkUrl: 'https://gurudikdas.kemdikbud.go.id',
      isActive: true,
      notes: 'Panduan teknis pendampingan transformatif sekolah.',
    },
  ];

  // 8. Pengaturan Aplikasi
  const settings: AppSetting[] = [
    {
      id: 'set-001',
      key: 'CURRENT_ACADEMIC_YEAR',
      value: '2025/2026',
      description: 'Tahun Pelajaran Berjalan',
    },
    {
      id: 'set-002',
      key: 'CURRENT_SEMESTER',
      value: 'Genap',
      description: 'Semester Pelaporan Berjalan (Ganjil / Genap)',
    },
    {
      id: 'set-003',
      key: 'DISDIK_REGENCY',
      value: 'KABUPATEN GARUT',
      description: 'Nama Kabupaten Instansi Induk',
    },
    {
      id: 'set-004',
      key: 'KOP_SURAT_LINE1',
      value: 'PEMERINTAH KABUPATEN GARUT',
      description: 'Kop Surat Baris 1',
    },
    {
      id: 'set-005',
      key: 'KOP_SURAT_LINE2',
      value: 'DINAS PENDIDIKAN',
      description: 'Kop Surat Baris 2',
    },
    {
      id: 'set-006',
      key: 'KOP_SURAT_ADDRESS',
      value: 'Jl. Pembangunan No. 179, Tarogong Kidul, Garut - Jawa Barat 44151',
      description: 'Alamat Kantor Dinas Pendidikan Kabupaten Garut',
    },
    {
      id: 'set-007',
      key: 'DISCLAIMER_SKP',
      value: 'Laporan pada SIPENGAWAS merupakan dokumen pemantauan operasional kepengawasan dinas pendidikan dan tidak secara otomatis menggantikan dokumen SKP/e-Kinerja BKN.',
      description: 'Pernyataan Resmi Batasan Sistem',
    },
  ];

  store = {
    users,
    schools,
    plans,
    activities,
    followUps,
    auditLogs,
    regulations,
    settings,
  };
}

// Ensure loaded immediately on module import
loadStore();

// Export Database methods
export const db = {
  users: {
    find: (predicate?: (u: User) => boolean): User[] => {
      return predicate ? store.users.filter(predicate) : [...store.users];
    },
    findById: (id: string): User | undefined => {
      return store.users.find((u) => u.id === id);
    },
    findByUsername: (username: string): User | undefined => {
      return store.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
      );
    },
    create: (user: User): User => {
      store.users.push(user);
      saveStore();
      return user;
    },
    update: (id: string, updates: Partial<User>): User | undefined => {
      const idx = store.users.findIndex((u) => u.id === id);
      if (idx === -1) return undefined;
      store.users[idx] = {
        ...store.users[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveStore();
      return store.users[idx];
    },
    delete: (id: string): boolean => {
      const initLen = store.users.length;
      store.users = store.users.filter((u) => u.id !== id);
      const changed = store.users.length !== initLen;
      if (changed) saveStore();
      return changed;
    },
  },

  schools: {
    find: (predicate?: (s: School) => boolean): School[] => {
      return predicate ? store.schools.filter(predicate) : [...store.schools];
    },
    findById: (id: string): School | undefined => {
      return store.schools.find((s) => s.id === id);
    },
    findByNpsn: (npsn: string): School | undefined => {
      return store.schools.find((s) => s.npsn === npsn);
    },
    create: (school: School): School => {
      store.schools.push(school);
      saveStore();
      return school;
    },
    update: (id: string, updates: Partial<School>): School | undefined => {
      const idx = store.schools.findIndex((s) => s.id === id);
      if (idx === -1) return undefined;
      store.schools[idx] = {
        ...store.schools[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveStore();
      return store.schools[idx];
    },
    delete: (id: string): boolean => {
      const initLen = store.schools.length;
      store.schools = store.schools.filter((s) => s.id !== id);
      const changed = store.schools.length !== initLen;
      if (changed) saveStore();
      return changed;
    },
  },

  plans: {
    find: (predicate?: (p: SupervisionPlan) => boolean): SupervisionPlan[] => {
      return predicate ? store.plans.filter(predicate) : [...store.plans];
    },
    findById: (id: string): SupervisionPlan | undefined => {
      return store.plans.find((p) => p.id === id);
    },
    create: (plan: SupervisionPlan): SupervisionPlan => {
      store.plans.push(plan);
      saveStore();
      return plan;
    },
    update: (id: string, updates: Partial<SupervisionPlan>): SupervisionPlan | undefined => {
      const idx = store.plans.findIndex((p) => p.id === id);
      if (idx === -1) return undefined;
      store.plans[idx] = {
        ...store.plans[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveStore();
      return store.plans[idx];
    },
    delete: (id: string): boolean => {
      const initLen = store.plans.length;
      store.plans = store.plans.filter((p) => p.id !== id);
      const changed = store.plans.length !== initLen;
      if (changed) saveStore();
      return changed;
    },
  },

  activities: {
    find: (predicate?: (a: SupervisionActivity) => boolean): SupervisionActivity[] => {
      return predicate ? store.activities.filter(predicate) : [...store.activities];
    },
    findById: (id: string): SupervisionActivity | undefined => {
      return store.activities.find((a) => a.id === id);
    },
    create: (activity: SupervisionActivity): SupervisionActivity => {
      store.activities.push(activity);
      saveStore();
      return activity;
    },
    update: (id: string, updates: Partial<SupervisionActivity>): SupervisionActivity | undefined => {
      const idx = store.activities.findIndex((a) => a.id === id);
      if (idx === -1) return undefined;
      store.activities[idx] = {
        ...store.activities[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveStore();
      return store.activities[idx];
    },
    delete: (id: string): boolean => {
      const initLen = store.activities.length;
      store.activities = store.activities.filter((a) => a.id !== id);
      const changed = store.activities.length !== initLen;
      if (changed) saveStore();
      return changed;
    },
  },

  followUps: {
    find: (predicate?: (f: FollowUpItem) => boolean): FollowUpItem[] => {
      return predicate ? store.followUps.filter(predicate) : [...store.followUps];
    },
    findById: (id: string): FollowUpItem | undefined => {
      return store.followUps.find((f) => f.id === id);
    },
    create: (item: FollowUpItem): FollowUpItem => {
      store.followUps.push(item);
      saveStore();
      return item;
    },
    update: (id: string, updates: Partial<FollowUpItem>): FollowUpItem | undefined => {
      const idx = store.followUps.findIndex((f) => f.id === id);
      if (idx === -1) return undefined;
      store.followUps[idx] = {
        ...store.followUps[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveStore();
      return store.followUps[idx];
    },
    delete: (id: string): boolean => {
      const initLen = store.followUps.length;
      store.followUps = store.followUps.filter((f) => f.id !== id);
      const changed = store.followUps.length !== initLen;
      if (changed) saveStore();
      return changed;
    },
  },

  auditLogs: {
    find: (predicate?: (l: AuditLog) => boolean): AuditLog[] => {
      const list = predicate ? store.auditLogs.filter(predicate) : [...store.auditLogs];
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    log: (user: User, action: string, entityType: string, entityId: string, details: string): void => {
      const entry: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString(),
      };
      store.auditLogs.push(entry);
      // Keep last 1000 logs
      if (store.auditLogs.length > 1000) {
        store.auditLogs = store.auditLogs.slice(-1000);
      }
      saveStore();
    },
  },

  regulations: {
    find: (): AppRegulation[] => [...store.regulations],
    findById: (id: string): AppRegulation | undefined => store.regulations.find((r) => r.id === id),
    create: (reg: AppRegulation): AppRegulation => {
      store.regulations.push(reg);
      saveStore();
      return reg;
    },
    update: (id: string, updates: Partial<AppRegulation>): AppRegulation | undefined => {
      const idx = store.regulations.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      store.regulations[idx] = { ...store.regulations[idx], ...updates };
      saveStore();
      return store.regulations[idx];
    },
    delete: (id: string): boolean => {
      const initLen = store.regulations.length;
      store.regulations = store.regulations.filter((r) => r.id !== id);
      const changed = store.regulations.length !== initLen;
      if (changed) saveStore();
      return changed;
    },
  },

  settings: {
    find: (): AppSetting[] => [...store.settings],
    get: (key: string): string => {
      const found = store.settings.find((s) => s.key === key);
      return found ? found.value : '';
    },
    set: (key: string, value: string, description?: string): void => {
      const idx = store.settings.findIndex((s) => s.key === key);
      if (idx !== -1) {
        store.settings[idx].value = value;
        if (description) store.settings[idx].description = description;
      } else {
        store.settings.push({
          id: `set-${Date.now()}`,
          key,
          value,
          description: description || '',
        });
      }
      saveStore();
    },
  },

  // Reset database to initial seed (useful for testing and admin recovery)
  resetToSeed: (): void => {
    seedInitialData();
    saveStore();
  },
};
