import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { School, User, GARUT_SUBDISTRICTS } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Badge } from '../components/ui/Badge';
import {
  School as SchoolIcon,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SchoolsPageProps {
  initialAction?: string;
  onNavigate?: (page: string, params?: any) => void;
}

export const SchoolsPage: React.FC<SchoolsPageProps> = ({ initialAction, onNavigate }) => {
  const { user, isAdmin, isSupervisor, isKadis } = useAuth();
  const toast = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subdistrictFilter, setSubdistrictFilter] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(initialAction === 'create');
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    npsn: '',
    name: '',
    status: 'Negeri' as 'Negeri' | 'Swasta',
    address: '',
    subdistrict: 'Garut Kota',
    principalName: '',
    phone: '',
    email: '',
    supervisorId: user?.role === 'supervisor' ? user.id : '',
    notes: '',
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (subdistrictFilter) params.subdistrict = subdistrictFilter;
      if (supervisorFilter) params.supervisorId = supervisorFilter;

      const [schoolsRes, supervisorsRes] = await Promise.all([
        api.get('/api/schools', params),
        api.get('/api/users/supervisors'),
      ]);

      if (schoolsRes.success) setSchools(schoolsRes.data);
      if (supervisorsRes.success) setSupervisors(supervisorsRes.data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data sekolah binaan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, subdistrictFilter, supervisorFilter, user]);

  const handleOpenCreate = () => {
    setEditingSchool(null);
    setFormData({
      npsn: '',
      name: '',
      status: 'Negeri',
      address: '',
      subdistrict: 'Garut Kota',
      principalName: '',
      phone: '',
      email: '',
      supervisorId: user?.role === 'supervisor' ? user.id : supervisors[0]?.id || '',
      notes: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      npsn: school.npsn,
      name: school.name,
      status: school.status,
      address: school.address,
      subdistrict: school.subdistrict,
      principalName: school.principalName,
      phone: school.phone,
      email: school.email,
      supervisorId: school.supervisorId,
      notes: school.notes || '',
      isActive: school.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.npsn.trim() || !formData.name.trim()) {
      toast.error('NPSN dan Nama Sekolah wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSchool) {
        const res = await api.put(`/api/schools/${editingSchool.id}`, formData);
        toast.success(res.message || 'Data sekolah berhasil diperbarui.');
      } else {
        const res = await api.post('/api/schools', formData);
        toast.success(res.message || 'Data sekolah berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan sekolah.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSchool) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/api/schools/${deletingSchool.id}`);
      toast.success(res.message || 'Sekolah berhasil dihapus.');
      setDeletingSchool(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus sekolah.');
    } finally {
      setSubmitting(false);
    }
  };

  const exportExcel = () => {
    const dataToExport = schools.map((s, idx) => ({
      No: idx + 1,
      NPSN: s.npsn,
      'Nama Sekolah': s.name,
      Status: s.status,
      Jenjang: s.educationLevel,
      Kecamatan: s.subdistrict,
      Alamat: s.address,
      'Kepala Sekolah': s.principalName,
      Kontak: s.phone,
      Email: s.email,
      'Pengawas Pembina': s.supervisorName || '-',
      Status_Aktif: s.isActive ? 'Aktif' : 'Non-Aktif',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sekolah_Binaan');
    XLSX.writeFile(wb, `Sekolah_Binaan_SMP_Garut_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('File Excel berhasil diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SchoolIcon className="w-5 h-5 text-blue-700" />
            Sekolah Binaan SMP Kabupaten Garut
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSupervisor
              ? 'Daftar seluruh SMP yang berada dalam binaan dan tanggung jawab supervisi Anda.'
              : 'Daftar master seluruh SMP binaan di 42 kecamatan se-Kabupaten Garut.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportExcel}
            disabled={schools.length === 0}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          {!isKadis && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sekolah Binaan</span>
            </button>
          )}
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
            placeholder="Cari berdasarkan nama sekolah, NPSN, kepala sekolah..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kecamatan Filter */}
          <select
            value={subdistrictFilter}
            onChange={(e) => setSubdistrictFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Semua Kecamatan ({GARUT_SUBDISTRICTS.length})</option>
            {GARUT_SUBDISTRICTS.map((sub) => (
              <option key={sub} value={sub}>
                Kec. {sub}
              </option>
            ))}
          </select>

          {/* Supervisor Filter (Admin & Kadis only) */}
          {!isSupervisor && (
            <select
              value={supervisorFilter}
              onChange={(e) => setSupervisorFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-xs"
            >
              <option value="">Semua Pengawas</option>
              {supervisors.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.fullName}
                </option>
              ))}
            </select>
          )}

          {(search || subdistrictFilter || supervisorFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSubdistrictFilter('');
                setSupervisorFilter('');
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1 font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Sekolah & NPSN</th>
                <th className="py-3 px-4">Kecamatan & Alamat</th>
                <th className="py-3 px-4">Kepala Sekolah & Kontak</th>
                <th className="py-3 px-4">Pengawas Pembina</th>
                <th className="py-3 px-4 text-center">Status</th>
                {!isKadis && <th className="py-3 px-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data sekolah...
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada sekolah ditemukan.
                  </td>
                </tr>
              ) : (
                schools.map((school, idx) => (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        {school.name}
                        <Badge
                          variant={school.status === 'Negeri' ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {school.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        NPSN: {school.npsn}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Kec. {school.subdistrict}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {school.address || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">
                        {school.principalName || '-'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {school.phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-3 h-3" /> {school.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {school.supervisorName || 'Belum Ditetapkan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {school.isActive ? (
                        <Badge variant="success" size="sm">Aktif</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Non-Aktif</Badge>
                      )}
                    </td>
                    {!isKadis && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(school)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit Data Sekolah"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSchool(school)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Hapus Sekolah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {schools.length} data sekolah binaan SMP.</span>
          <span className="italic">Kabupaten Garut &bull; Terverifikasi</span>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchool ? 'Edit Data Sekolah Binaan' : 'Tambah Sekolah Binaan Baru'}
        subtitle="Pastikan NPSN sesuai data resmi Kemendikbudristek untuk mencegah duplikasi data."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional) *
              </label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                required
                placeholder="Contoh: 20209351"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Sekolah *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Sekolah *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Contoh: SMP Negeri 1 Garut"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kecamatan (Kab. Garut) *
              </label>
              <select
                value={formData.subdistrict}
                onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {GARUT_SUBDISTRICTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                placeholder="Nama lengkap beserta gelar"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Lengkap Sekolah
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Nama jalan, desa/kelurahan, nomor"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Telepon / Kontak
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Nomor kantor atau kontak sekolah"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Sekolah
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="smp@disdikgarut.id"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Admin can change supervisor assignment */}
          {isAdmin && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pengawas Penanggung Jawab (Penetapan Admin)
              </label>
              <select
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.fullName} ({sup.jabatanLevel || 'Pengawas'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Khusus Sekolah
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan keunggulan, program rujukan, atau karakteristik satuan pendidikan"
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
              disabled={submitting}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Menyimpan...' : editingSchool ? 'Simpan Perubahan' : 'Tambah Sekolah Binaan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingSchool)}
        onClose={() => setDeletingSchool(null)}
        onConfirm={handleDelete}
        title="Hapus Data Sekolah Binaan"
        message={`Apakah Anda yakin ingin menghapus ${deletingSchool?.name} (NPSN: ${deletingSchool?.npsn})? Data yang memiliki riwayat kegiatan supervisi tidak dapat dihapus permanen.`}
        confirmLabel="Hapus Sekolah"
        loading={submitting}
      />
    </div>
  );
};
