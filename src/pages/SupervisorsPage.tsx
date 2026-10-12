import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { User, School, SupervisorLevel } from '../types';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  Users2,
  School as SchoolIcon,
  Phone,
  Mail,
  Award,
  CalendarCheck2,
  Search,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Edit2,
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Building,
  Filter,
  Download,
  Upload,
  PlusCircle,
  Trash2,
  Sparkles,
  Info,
  Layers,
  FileDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const PANGKAT_GOLONGAN_OPTIONS = [
  'Pembina Utama (IV/e)',
  'Pembina Utama Madya (IV/d)',
  'Pembina Utama Muda (IV/c)',
  'Pembina Tingkat I (IV/b)',
  'Pembina (IV/a)',
  'Penata Tingkat I (III/d)',
  'Penata (III/c)',
];

interface BatchSupervisorRow {
  id: string;
  fullName: string;
  nip: string;
  jabatanLevel: SupervisorLevel;
  pangkatGolongan: string;
  phone: string;
  email?: string;
  username?: string;
}

interface SupervisorsPageProps {
  initialAction?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const SupervisorsPage: React.FC<SupervisorsPageProps> = ({ initialAction, onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | SupervisorLevel>('all');

  // Modals
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<User | null>(null);

  // Fasilitas Tambah Daftar Pengawas (Batch / Import)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTab, setBatchTab] = useState<'form' | 'excel'>('form');
  const [batchRows, setBatchRows] = useState<BatchSupervisorRow[]>([
    {
      id: 'row-1',
      fullName: '',
      nip: '',
      jabatanLevel: 'Ahli Madya',
      pangkatGolongan: 'Pembina Tingkat I (IV/b)',
      phone: '',
    },
    {
      id: 'row-2',
      fullName: '',
      nip: '',
      jabatanLevel: 'Ahli Madya',
      pangkatGolongan: 'Pembina Tingkat I (IV/b)',
      phone: '',
    },
    {
      id: 'row-3',
      fullName: '',
      nip: '',
      jabatanLevel: 'Ahli Madya',
      pangkatGolongan: 'Pembina Tingkat I (IV/b)',
      phone: '',
    },
  ]);
  const [excelParsedData, setExcelParsedData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelError, setExcelError] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nip: '',
    jabatanLevel: 'Ahli Madya' as SupervisorLevel,
    pangkatGolongan: 'Pembina Tingkat I (IV/b)',
    username: '',
    email: '',
    password: 'Pengawas123!',
    phone: '',
    schoolIds: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supRes, schRes] = await Promise.all([
        api.get('/api/users/supervisors'),
        api.get('/api/schools'),
      ]);
      if (supRes.success) setSupervisors(supRes.data);
      if (schRes.success) setSchools(schRes.data);
    } catch {
      toast.error('Gagal memuat data master pengawas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle initial navigation actions (e.g. from Dashboard or Sidebar)
  useEffect(() => {
    if (isAdmin) {
      if (initialAction === 'create') {
        handleOpenCreate();
      } else if (initialAction === 'batch') {
        setIsBatchModalOpen(true);
      }
    }
  }, [initialAction, isAdmin]);

  // Open Create Modal
  const handleOpenCreate = () => {
    // Generate recommended next username like pengawas4, pengawas5, etc.
    const existingCount = supervisors.length;
    const nextUsername = `pengawas${existingCount + 1}`;

    setFormData({
      fullName: '',
      nip: '',
      jabatanLevel: 'Ahli Madya',
      pangkatGolongan: 'Pembina Tingkat I (IV/b)',
      username: nextUsername,
      email: `${nextUsername}@disdik.garutkab.go.id`,
      password: 'Pengawas123!',
      phone: '',
      schoolIds: [],
    });
    setSchoolSearch('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sup: User) => {
    const assigned = schools.filter((s) => s.supervisorId === sup.id).map((s) => s.id);
    setEditingSupervisor(sup);
    setFormData({
      fullName: sup.fullName,
      nip: sup.nip || '',
      jabatanLevel: sup.jabatanLevel || 'Ahli Madya',
      pangkatGolongan: sup.pangkatGolongan || 'Pembina Tingkat I (IV/b)',
      username: sup.username,
      email: sup.email,
      password: '', // Blank unless admin wants to reset password
      phone: sup.phone || '',
      schoolIds: assigned,
    });
    setSchoolSearch('');
    setIsEditModalOpen(true);
  };

  // Handle Add Supervisor Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.username.trim() || !formData.email.trim()) {
      toast.error('Nama Lengkap, Username, dan Email wajib diisi.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Kata sandi wajib diisi minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/users', {
        role: 'supervisor',
        fullName: formData.fullName.trim(),
        nip: formData.nip.trim(),
        jabatanLevel: formData.jabatanLevel,
        pangkatGolongan: formData.pangkatGolongan,
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        schoolIds: formData.schoolIds,
      });

      if (res.success) {
        toast.success(`Pengawas sekolah "${formData.fullName}" berhasil ditambahkan!`);
        setIsAddModalOpen(false);
        fetchData();
      } else {
        toast.error(res.message || 'Gagal menambahkan pengawas sekolah.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Supervisor Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupervisor) return;

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error('Nama Lengkap dan Email wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        role: 'supervisor',
        fullName: formData.fullName.trim(),
        nip: formData.nip.trim(),
        jabatanLevel: formData.jabatanLevel,
        pangkatGolongan: formData.pangkatGolongan,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        schoolIds: formData.schoolIds,
      };

      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password.trim();
      }

      const res = await api.put(`/api/users/${editingSupervisor.id}`, payload);
      if (res.success) {
        toast.success(`Data pengawas "${formData.fullName}" berhasil diperbarui!`);
        setIsEditModalOpen(false);
        setEditingSupervisor(null);
        fetchData();
      } else {
        toast.error(res.message || 'Gagal memperbarui data pengawas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Batch Row Management
  const handleAddBatchRow = () => {
    const newId = `row-${Date.now().toString(36)}`;
    setBatchRows((prev) => [
      ...prev,
      {
        id: newId,
        fullName: '',
        nip: '',
        jabatanLevel: 'Ahli Madya',
        pangkatGolongan: 'Pembina Tingkat I (IV/b)',
        phone: '',
      },
    ]);
  };

  const handleRemoveBatchRow = (id: string) => {
    if (batchRows.length <= 1) {
      toast.info('Minimal 1 baris pengawas sekolah.');
      return;
    }
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateBatchRow = (id: string, field: keyof BatchSupervisorRow, value: any) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Download Template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Dr. H. Dani Ramdani, M.Pd.',
        'NIP': '197508152002121004',
        'Jenjang Jabatan': 'Ahli Madya',
        'Pangkat Golongan': 'Pembina Tingkat I (IV/b)',
        'Nomor Telepon': '081223344556',
        'Email (Opsional)': 'dani.ramdani@dinas.belajar.id',
        'Username (Opsional)': 'daniramdani',
      },
      {
        'Nama Lengkap': 'Dra. Hj. Siti Nurjanah, M.Pd.',
        'NIP': '197803102005012008',
        'Jenjang Jabatan': 'Ahli Utama',
        'Pangkat Golongan': 'Pembina Utama Muda (IV/c)',
        'Nomor Telepon': '081399887766',
        'Email (Opsional)': 'sitinurjanah@dinas.belajar.id',
        'Username (Opsional)': 'sitinurjanah',
      },
      {
        'Nama Lengkap': 'Drs. Iwan Setiawan, M.M.Pd.',
        'NIP': '197204121999031002',
        'Jenjang Jabatan': 'Ahli Muda',
        'Pangkat Golongan': 'Penata Tingkat I (III/d)',
        'Nomor Telepon': '085211223344',
        'Email (Opsional)': 'iwansetiawan@dinas.belajar.id',
        'Username (Opsional)': 'iwansetiawan',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Daftar Pengawas');
    XLSX.writeFile(wb, 'Template_Daftar_Pengawas_Sekolah_SMP_Garut.xlsx');
    toast.success('Template Excel resmi berhasil diunduh.');
  };

  // Upload & Parse Excel File
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          setExcelError('File Excel tidak memiliki data atau baris kosong.');
          return;
        }

        const parsed = rawData.map((row, idx) => {
          const fullName =
            row['Nama Lengkap'] ||
            row['Nama'] ||
            row['nama'] ||
            row['fullName'] ||
            '';
          const nip =
            row['NIP'] ||
            row['nip'] ||
            row['Nomor Induk Pegawai'] ||
            '';
          const rawJabatan =
            row['Jenjang Jabatan'] ||
            row['Jenjang'] ||
            row['jabatanLevel'] ||
            'Ahli Madya';
          const pangkat =
            row['Pangkat Golongan'] ||
            row['Pangkat'] ||
            row['Golongan'] ||
            row['pangkatGolongan'] ||
            'Pembina Tingkat I (IV/b)';
          const phone =
            row['Nomor Telepon'] ||
            row['No Telepon'] ||
            row['No HP'] ||
            row['phone'] ||
            '-';
          const email =
            row['Email (Opsional)'] ||
            row['Email'] ||
            row['email'] ||
            '';
          const username =
            row['Username (Opsional)'] ||
            row['Username'] ||
            row['username'] ||
            '';

          return {
            id: `excel-${idx}`,
            fullName: String(fullName).trim(),
            nip: String(nip).trim(),
            jabatanLevel: (['Ahli Muda', 'Ahli Madya', 'Ahli Utama'].includes(rawJabatan)
              ? rawJabatan
              : 'Ahli Madya') as SupervisorLevel,
            pangkatGolongan: String(pangkat).trim(),
            phone: String(phone).trim(),
            email: email ? String(email).trim() : undefined,
            username: username ? String(username).trim() : undefined,
            isValid: Boolean(String(fullName).trim()),
          };
        });

        setExcelParsedData(parsed);
        toast.info(`Berhasil membaca ${parsed.length} baris data pengawas.`);
      } catch {
        setExcelError('Gagal membaca file Excel. Pastikan format file .xlsx atau .xls.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Batch Items (Table or Excel)
  const handleSaveBatchSupervisors = async (items: any[]) => {
    const validItems = items.filter((item) => item.fullName && item.fullName.trim());
    if (validItems.length === 0) {
      toast.error('Belum ada data pengawas yang valid (Nama Lengkap wajib diisi).');
      return;
    }

    setBatchSubmitting(true);
    try {
      const payload = validItems.map((item) => ({
        fullName: item.fullName.trim(),
        nip: item.nip?.trim() || '',
        jabatanLevel: item.jabatanLevel || 'Ahli Madya',
        pangkatGolongan: item.pangkatGolongan || 'Pembina Tingkat I (IV/b)',
        phone: item.phone?.trim() || '-',
        email: item.email?.trim() || undefined,
        username: item.username?.trim() || undefined,
      }));

      const res = await api.post('/api/users/batch-supervisors', {
        supervisors: payload,
      });

      if (res.success) {
        toast.success(res.message || `${validItems.length} pengawas sekolah berhasil ditambahkan!`);
        setIsBatchModalOpen(false);
        setExcelParsedData([]);
        setExcelFileName('');
        setBatchRows([
          {
            id: 'row-1',
            fullName: '',
            nip: '',
            jabatanLevel: 'Ahli Madya',
            pangkatGolongan: 'Pembina Tingkat I (IV/b)',
            phone: '',
          },
          {
            id: 'row-2',
            fullName: '',
            nip: '',
            jabatanLevel: 'Ahli Madya',
            pangkatGolongan: 'Pembina Tingkat I (IV/b)',
            phone: '',
          },
        ]);
        fetchData();
      } else {
        toast.error(res.message || 'Gagal menyimpan daftar pengawas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Export current list to Excel
  const handleExportSupervisors = () => {
    if (supervisors.length === 0) {
      toast.error('Belum ada data pengawas untuk diekspor.');
      return;
    }

    const exportData = supervisors.map((s, idx) => {
      const supSchools = schools.filter((sch) => sch.supervisorId === s.id);
      const schoolNames = supSchools.map((sch) => sch.name).join(', ');
      return {
        'No': idx + 1,
        'Nama Lengkap & Gelar': s.fullName,
        'NIP': s.nip || '-',
        'Jenjang Jabatan': s.jabatanLevel || 'Ahli Madya',
        'Pangkat / Golongan': s.pangkatGolongan || '-',
        'Username': s.username,
        'Email Kedinasan': s.email,
        'No. Telepon/WA': s.phone || '-',
        'Jumlah Beban Sekolah Binaan': supSchools.length,
        'Daftar Sekolah Binaan': schoolNames || 'Belum ada alokasi',
        'Status Akun': s.isActive ? 'Aktif' : 'Non-Aktif',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Pengawas SMP');
    XLSX.writeFile(wb, `Daftar_Pengawas_Sekolah_SMP_Garut_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Daftar Pengawas Sekolah berhasil diunduh ke Excel.');
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setFormData((prev) => {
      const exists = prev.schoolIds.includes(schoolId);
      if (exists) {
        return { ...prev, schoolIds: prev.schoolIds.filter((id) => id !== schoolId) };
      } else {
        return { ...prev, schoolIds: [...prev.schoolIds, schoolId] };
      }
    });
  };

  const filtered = supervisors.filter((s) => {
    const matchesSearch =
      !search ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (s.nip && s.nip.includes(search)) ||
      (s.jabatanLevel && s.jabatanLevel.toLowerCase().includes(search.toLowerCase()));

    const matchesLevel = levelFilter === 'all' || s.jabatanLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Calculate statistics
  const countUtama = supervisors.filter((s) => s.jabatanLevel === 'Ahli Utama').length;
  const countMadya = supervisors.filter((s) => s.jabatanLevel === 'Ahli Madya').length;
  const countMuda = supervisors.filter((s) => s.jabatanLevel === 'Ahli Muda').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-700" />
            Data Master & Daftar Pengawas Sekolah SMP Kabupaten Garut
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar fungsional pengawas jenjang SMP, profil kepegawaian, alokasi sekolah binaan, dan fasilitas penambahan pengawas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition shadow-md shadow-indigo-500/20"
                title="Fasilitas Tambah Daftar Pengawas Sekolah secara Massal atau Import Excel"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Daftar Pengawas (Batch/Excel)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md shadow-blue-500/20"
                title="Formulir Tambah Pengawas Sekolah Satuan"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengawas (Satuan)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportSupervisors}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-xs"
            title="Unduh Daftar Lengkap Pengawas Sekolah ke Format Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>

          <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-xs">
            Total: <strong>{supervisors.length}</strong> Pengawas
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Total Pengawas</span>
            <span className="text-lg font-extrabold text-slate-900">{supervisors.length}</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Users2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Ahli Utama</span>
            <span className="text-lg font-extrabold text-purple-700">{countUtama}</span>
          </div>
          <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Ahli Madya</span>
            <span className="text-lg font-extrabold text-blue-700">{countMadya}</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Ahli Muda</span>
            <span className="text-lg font-extrabold text-emerald-700">{countMuda}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Level Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pengawas, NIP, atau jenjang jabatan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Jenjang:
          </span>
          {(['all', 'Ahli Utama', 'Ahli Madya', 'Ahli Muda'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap ${
                levelFilter === lvl
                  ? 'bg-blue-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl === 'all' ? 'Semua Jenjang' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Supervisor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Memuat data pengawas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 p-8 text-slate-500 text-xs space-y-3">
            <Users2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold">Tidak ada pengawas sekolah ditemukan dengan kriteria pencarian ini.</p>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengawas Baru</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((sup) => {
            const supSchools = schools.filter((s) => s.supervisorId === sup.id);

            return (
              <div
                key={sup.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm border border-blue-200 shrink-0">
                        {sup.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-xs leading-snug truncate" title={sup.fullName}>
                          {sup.fullName}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          NIP: {sup.nip || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Jenjang Fungsional:</span>
                      <span className={`font-bold px-2 py-0.5 rounded border text-[10px] ${
                        sup.jabatanLevel === 'Ahli Utama'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : sup.jabatanLevel === 'Ahli Madya'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {sup.jabatanLevel || 'Ahli Madya'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Pangkat / Golongan:</span>
                      <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[170px]" title={sup.pangkatGolongan}>
                        {sup.pangkatGolongan || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Beban Sekolah:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {supSchools.length} SMP Binaan
                      </span>
                    </div>
                  </div>

                  {/* School Pills Preview */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Sekolah Binaan:
                    </span>
                    {supSchools.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Belum ada sekolah binaan dialokasikan</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {supSchools.map((s) => (
                          <span
                            key={s.id}
                            className="bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] truncate max-w-full"
                          >
                            &bull; {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[120px]">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.phone || '-'}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sup)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition flex items-center gap-1 border border-amber-200"
                        title="Ubah Data Pengawas"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedSupervisor(sup)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 border border-blue-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Tambah Pengawas Sekolah (Admin) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Pengawas Sekolah SMP Baru"
        subtitle="Registrasi akun fungsional pengawas sekolah berdasarkan PermenPANRB No. 7 Tahun 2026"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap dan Gelar Akademik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Contoh: Dr. H. Dani Ramdani, M.Pd."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* NIP */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIP (18 Digit)
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Contoh: 197508152002121004"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            {/* Jenjang Fungsional */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenjang Jabatan Fungsional <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.jabatanLevel}
                onChange={(e) => setFormData({ ...formData, jabatanLevel: e.target.value as SupervisorLevel })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="Ahli Muda">Ahli Muda</option>
                <option value="Ahli Madya">Ahli Madya</option>
                <option value="Ahli Utama">Ahli Utama</option>
              </select>
            </div>

            {/* Pangkat / Golongan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pangkat / Golongan Ruang
              </label>
              <select
                value={formData.pangkatGolongan}
                onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {PANGKAT_GOLONGAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Nomor Telepon / WA */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 081223344556"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Username Akun */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username Akun Login <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                placeholder="Contoh: pengawas4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            {/* Email Kedinasan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Kedinasan / Belajar.id <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Contoh: pengawas4@garut.sch.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Kata Sandi */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi Akun <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter (Default: Pengawas123!)"
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Disarankan kata sandi standar kedinasan: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">Pengawas123!</code>
              </p>
            </div>
          </div>

          {/* Alokasi Sekolah Binaan Awal */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <SchoolIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>Pilih Sekolah Binaan Awal ({formData.schoolIds.length} Sekolah Dipilih)</span>
              </label>
              <span className="text-[10px] text-slate-500">Opsional, dapat diatur kembali nanti</span>
            </div>

            <div className="mb-2">
              <input
                type="text"
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                placeholder="Cari sekolah untuk dialokasikan..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 bg-slate-50/50">
              {schools
                .filter((sch) =>
                  !schoolSearch ||
                  sch.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                  sch.subdistrict.toLowerCase().includes(schoolSearch.toLowerCase())
                )
                .map((school) => {
                  const isChecked = formData.schoolIds.includes(school.id);
                  const isAssignedToOther = school.supervisorId && school.supervisorName;

                  return (
                    <label
                      key={school.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                        isChecked
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                          : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSchoolSelection(school.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-xs">{school.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Kec. {school.subdistrict} &bull; NPSN: {school.npsn}
                          </div>
                        </div>
                      </div>

                      {isAssignedToOther && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-normal">
                          Saat ini: {school.supervisorName}
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Menyimpan Pengawas...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengawas Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Edit Data Pengawas Sekolah (Admin) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSupervisor(null);
        }}
        title="Ubah Data Pengawas Sekolah SMP"
        subtitle={editingSupervisor ? `Pembaruan profil: ${editingSupervisor.fullName}` : ''}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap dan Gelar Akademik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP (18 Digit)</label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenjang Jabatan Fungsional <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.jabatanLevel}
                onChange={(e) => setFormData({ ...formData, jabatanLevel: e.target.value as SupervisorLevel })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="Ahli Muda">Ahli Muda</option>
                <option value="Ahli Madya">Ahli Madya</option>
                <option value="Ahli Utama">Ahli Utama</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
              <select
                value={formData.pangkatGolongan}
                onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {PANGKAT_GOLONGAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username (Tetap)</label>
              <input
                type="text"
                disabled
                value={formData.username}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Kedinasan <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Reset Kata Sandi (Kosongkan jika tidak diubah)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Ketik kata sandi baru (minimal 6 karakter)"
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Pengaturan Alokasi Sekolah Binaan */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <SchoolIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>Alokasi Sekolah Binaan ({formData.schoolIds.length} Sekolah Terpilih)</span>
              </label>
            </div>

            <div className="border border-slate-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 bg-slate-50/50">
              {schools.map((school) => {
                const isChecked = formData.schoolIds.includes(school.id);
                return (
                  <label
                    key={school.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                      isChecked
                        ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                        : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSchoolSelection(school.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div>{school.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Kec. {school.subdistrict} &bull; NPSN: {school.npsn}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingSupervisor(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Menyimpan Perubahan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Detail Supervisor Modal */}
      <Modal
        isOpen={Boolean(selectedSupervisor)}
        onClose={() => setSelectedSupervisor(null)}
        title="Profil Lengkap Pengawas Sekolah SMP"
        subtitle={selectedSupervisor ? `${selectedSupervisor.fullName} (NIP: ${selectedSupervisor.nip || '-'})` : ''}
        maxWidth="lg"
      >
        {selectedSupervisor && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Nama Lengkap</span>
                <span className="font-bold text-slate-900">{selectedSupervisor.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">NIP</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedSupervisor.nip || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Jenjang Fungsional</span>
                <span className="font-bold text-blue-700">{selectedSupervisor.jabatanLevel || 'Ahli Madya'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Pangkat / Golongan</span>
                <span className="font-semibold text-slate-800">{selectedSupervisor.pangkatGolongan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Resmi</span>
                <span className="font-medium text-slate-800">{selectedSupervisor.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nomor Telepon</span>
                <span className="font-medium text-slate-800">{selectedSupervisor.phone || '-'}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                  <SchoolIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>Daftar Sekolah Binaan ({schools.filter((s) => s.supervisorId === selectedSupervisor.id).length} Sekolah)</span>
                </h4>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {schools
                  .filter((s) => s.supervisorId === selectedSupervisor.id)
                  .map((school) => (
                    <div
                      key={school.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:border-blue-300 transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <div className="text-[11px] text-slate-500">
                          NPSN: {school.npsn} &bull; Kec. {school.subdistrict} &bull; Kepsek: {school.principalName || '-'}
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">{school.status}</Badge>
                    </div>
                  ))}

                {schools.filter((s) => s.supervisorId === selectedSupervisor.id).length === 0 && (
                  <p className="text-slate-400 italic text-center py-4">Belum ada sekolah binaan yang dialokasikan.</p>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const sup = selectedSupervisor;
                    setSelectedSupervisor(null);
                    handleOpenEdit(sup);
                  }}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-300 rounded-lg transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ubah Data Pengawas Ini</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 4: Fasilitas Tambah Daftar Pengawas Sekolah (Batch & Import Excel) */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Fasilitas Tambah Daftar Pengawas Sekolah SMP"
        subtitle="Tambahkan beberapa pengawas sekaligus melalui tabel multi-baris atau unggah berkas Excel/CSV"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setBatchTab('form')}
              className={`pb-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition ${
                batchTab === 'form'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Input Tabel Multi-Baris ({batchRows.length} Baris)</span>
            </button>
            <button
              type="button"
              onClick={() => setBatchTab('excel')}
              className={`pb-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition ${
                batchTab === 'excel'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unggah / Impor Berkas Excel (.xlsx / .csv)</span>
            </button>
          </div>

          {/* TAB 1: Input Tabel Multi-Baris */}
          {batchTab === 'form' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <p className="text-slate-700">
                  Isi daftar nama dan identitas pengawas sekolah. Akun login akan dibuatkan otomatis oleh sistem dengan kata sandi awal: <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-800 font-bold">Pengawas123!</code>
                </p>
                <button
                  type="button"
                  onClick={handleAddBatchRow}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Baris</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Nama Lengkap & Gelar *</th>
                      <th className="py-2.5 px-3 min-w-[150px]">NIP (18 Digit)</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Jenjang Jabatan</th>
                      <th className="py-2.5 px-3 min-w-[170px]">Pangkat / Golongan</th>
                      <th className="py-2.5 px-3 min-w-[130px]">No. Telepon/WA</th>
                      <th className="py-2.5 px-2 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Dr. H. Dani, M.Pd."
                            value={row.fullName}
                            onChange={(e) => handleUpdateBatchRow(row.id, 'fullName', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="197508152002121004"
                            value={row.nip}
                            onChange={(e) => handleUpdateBatchRow(row.id, 'nip', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.jabatanLevel}
                            onChange={(e) => handleUpdateBatchRow(row.id, 'jabatanLevel', e.target.value as SupervisorLevel)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="Ahli Muda">Ahli Muda</option>
                            <option value="Ahli Madya">Ahli Madya</option>
                            <option value="Ahli Utama">Ahli Utama</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.pangkatGolongan}
                            onChange={(e) => handleUpdateBatchRow(row.id, 'pangkatGolongan', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            {PANGKAT_GOLONGAN_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="08122334455"
                            value={row.phone}
                            onChange={(e) => handleUpdateBatchRow(row.id, 'phone', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Total: <strong>{batchRows.filter((r) => r.fullName.trim()).length}</strong> nama pengawas siap disimpan ke daftar.
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={batchSubmitting || batchRows.filter((r) => r.fullName.trim()).length === 0}
                    onClick={() => handleSaveBatchSupervisors(batchRows)}
                    className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    {batchSubmitting ? 'Menyimpan...' : 'Simpan Semua Daftar Pengawas'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Unggah / Import Berkas Excel */}
          {batchTab === 'excel' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800">Petunjuk Format Berkas Excel</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Gunakan template resmi dengan kolom: Nama Lengkap, NIP, Jenjang Jabatan, Pangkat Golongan, Nomor Telepon, Email, Username.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Template Excel Resmi</span>
                </button>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50">
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <label htmlFor="excelFileInput" className="cursor-pointer block">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {excelFileName ? excelFileName : 'Klik untuk Memilih File Excel atau CSV'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung format .xlsx, .xls, atau .csv (Maksimal 500 baris pengawas)
                  </p>
                </label>
              </div>

              {excelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {excelError}
                </div>
              )}

              {/* Parsed Preview Table */}
              {excelParsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Pratinjau Hasil Pembacaan File ({excelParsedData.length} Pengawas Terdeteksi)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {excelParsedData.filter((p) => p.isValid).length} Baris Valid
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 text-center">#</th>
                          <th className="py-2 px-3">Nama Lengkap</th>
                          <th className="py-2 px-3">NIP</th>
                          <th className="py-2 px-3">Jenjang</th>
                          <th className="py-2 px-3">Pangkat / Golongan</th>
                          <th className="py-2 px-3">No. Kontak</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {excelParsedData.map((item, idx) => (
                          <tr key={item.id} className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                            <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900">
                              {item.fullName || <span className="text-rose-500 italic">Nama kosong</span>}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600">
                              {item.nip || '-'}
                            </td>
                            <td className="py-1.5 px-3 text-slate-700">
                              {item.jabatanLevel}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600 truncate max-w-[150px]">
                              {item.pangkatGolongan || '-'}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">
                              {item.phone || '-'}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              {item.isValid ? (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Siap
                                </span>
                              ) : (
                                <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  Tidak Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setExcelParsedData([]);
                        setExcelFileName('');
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-semibold"
                    >
                      Reset Berkas
                    </button>
                    <button
                      type="button"
                      disabled={batchSubmitting || excelParsedData.filter((p) => p.isValid).length === 0}
                      onClick={() => handleSaveBatchSupervisors(excelParsedData)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      {batchSubmitting ? 'Memproses Import...' : `Simpan ${excelParsedData.filter((p) => p.isValid).length} Pengawas dari Excel`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
