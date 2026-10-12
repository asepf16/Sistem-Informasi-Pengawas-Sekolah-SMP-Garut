import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { User, UserRole, SupervisorLevel } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Badge } from '../components/ui/Badge';
import {
  UserCog,
  Plus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'supervisor' as UserRole,
    fullName: '',
    nip: '',
    pangkatGolongan: '',
    jabatanLevel: 'Ahli Madya' as SupervisorLevel,
    phone: '',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users');
      if (res.success) setUsers(res.data);
    } catch {
      toast.error('Gagal memuat manajemen pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'supervisor',
      fullName: '',
      nip: '',
      pangkatGolongan: '',
      jabatanLevel: 'Ahli Madya',
      phone: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      fullName: u.fullName,
      nip: u.nip || '',
      pangkatGolongan: u.pangkatGolongan || '',
      jabatanLevel: u.jabatanLevel || 'Ahli Madya',
      phone: u.phone || '',
      isActive: u.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        const res = await api.put(`/api/users/${editingUser.id}`, payload);
        toast.success(res.message || 'Data pengguna berhasil diperbarui.');
      } else {
        if (!formData.password) {
          toast.error('Kata sandi awal wajib diisi untuk pengguna baru.');
          setSubmitting(false);
          return;
        }
        const res = await api.post('/api/users', formData);
        toast.success(res.message || 'Akun pengguna berhasil dibuat.');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put(`/api/users/${resettingUser.id}`, { password: newPassword });
      toast.success(res.message || 'Kata sandi berhasil direset.');
      setResettingUser(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/api/users/${deletingUser.id}`);
      toast.success(res.message || 'Pengguna berhasil dihapus.');
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nip && u.nip.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-purple-700" />
            Manajemen Pengguna & Otorisasi Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan akun kedinasan, penetapan peran (Admin, Pengawas SMP, Kadis), dan status akses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setFormData({
                username: '',
                email: '',
                password: 'Pengawas123!',
                role: 'supervisor',
                fullName: '',
                nip: '',
                pangkatGolongan: 'Pembina Tingkat I (IV/b)',
                jabatanLevel: 'Ahli Madya',
                phone: '',
                isActive: true,
              });
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengawas Sekolah</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Pengguna</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, NIP, username, atau email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Peran & Jenjang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data akun pengguna...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada akun ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        NIP: {u.nip || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-mono text-slate-800 font-medium">{u.username}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : u.role === 'kadis'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.jabatanLevel && (
                          <span className="text-[11px] text-slate-600 font-medium">
                            {u.jabatanLevel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          <XCircle className="w-3 h-3" /> Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setResettingUser(u)}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          title="Hapus / Nonaktifkan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Data Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
        subtitle="Kelola identitas resmi kedinasan dan hak akses aplikasi."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                disabled={Boolean(editingUser)}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="pengawas_smp"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="nama@disdikgarut.id"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="Contoh: Dr. H. Cecep Gunawan, M.Pd."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peran Pengguna (Role) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <option value="supervisor">Pengawas Sekolah (Pengawas SMP)</option>
                <option value="kadis">Kepala Dinas Pendidikan (Read-Only)</option>
                <option value="admin">Administrator Sistem</option>
              </select>
            </div>

            {formData.role === 'supervisor' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenjang Jabatan Fungsional</label>
                <select
                  value={formData.jabatanLevel}
                  onChange={(e) => setFormData({ ...formData, jabatanLevel: e.target.value as SupervisorLevel })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="Ahli Muda">Pengawas Sekolah Ahli Muda</option>
                  <option value="Ahli Madya">Pengawas Sekolah Ahli Madya</option>
                  <option value="Ahli Utama">Pengawas Sekolah Ahli Utama</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="197xxxxxxxxxxxxxxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
              <input
                type="text"
                value={formData.pangkatGolongan}
                onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                placeholder="Pembina Tingkat I (IV/b)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {!editingUser && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Akun Aktif (Dapat Login)</span>
            </label>
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
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resettingUser)}
        onClose={() => setResettingUser(null)}
        title="Reset Kata Sandi Pengguna"
        subtitle={resettingUser ? `Akun: ${resettingUser.fullName} (${resettingUser.username})` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi Baru *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Minimal 6 karakter"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResettingUser(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Memproses...' : 'Setel Kata Sandi Baru'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate User Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Hapus / Nonaktifkan Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus atau menonaktifkan pengguna ${deletingUser?.fullName}? Jika memiliki sekolah binaan aktif, akun akan dinonaktifkan secara aman.`}
        confirmLabel="Ya, Lanjutkan"
        loading={submitting}
      />
    </div>
  );
};
