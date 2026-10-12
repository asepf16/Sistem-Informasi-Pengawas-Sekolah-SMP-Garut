import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { AuditLog } from '../types';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Layers,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/api/audit-logs', params);
      if (res.success) setLogs(res.data);
    } catch {
      toast.error('Gagal memuat log audit aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-700" />
            Log Audit Aktivitas & Rekam Jejak Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan riwayat setiap aksi penambahan data, pembaruan, penghapusan, verifikasi, dan otentikasi.
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          Tercatat: {logs.length} Jejak Aktivitas
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama pengguna, aksi, atau rincian..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE_SCHOOL">TAMBAH SEKOLAH</option>
            <option value="UPDATE_SCHOOL">UBAH SEKOLAH</option>
            <option value="CREATE_ACTIVITY">INPUT KEGIATAN</option>
            <option value="UPDATE_ACTIVITY">UPDATE KEGIATAN</option>
            <option value="VERIFY_ACTIVITY">VERIFIKASI KEGIATAN</option>
            <option value="CREATE_PLAN">BUAT RENCANA</option>
            <option value="CREATE_USER">BUAT PENGGUNA</option>
          </select>

          {(search || actionFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActionFilter('');
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-44">Waktu (WIB)</th>
                <th className="py-3 px-4">Pengguna & Peran</th>
                <th className="py-3 px-4">Aksi / Tindakan</th>
                <th className="py-3 px-4">Entitas Terkait</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat log audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada log audit ditemukan.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleDateString('id-ID')}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed">
                      {log.details}
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
