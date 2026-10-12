import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { SupervisionActivity } from '../types';
import { ActivityStatusBadge } from '../components/ui/Badge';
import {
  ClipboardList,
  Search,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  School,
  ArrowRight,
} from 'lucide-react';

interface ResultsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [activities, setActivities] = useState<SupervisionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'findings' | 'goodPractices' | 'analysis'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/activities');
      if (res.success) {
        setActivities(res.data);
      }
    } catch {
      toast.error('Gagal memuat hasil kepengawasan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filtered = activities.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.schoolName.toLowerCase().includes(q) ||
      a.supervisorName.toLowerCase().includes(q) ||
      a.keyFindings.toLowerCase().includes(q) ||
      a.goodPractices.toLowerCase().includes(q) ||
      a.resultAnalysis.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            Dokumentasi Hasil Pengawasan dan Analisis Mutu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kompendium temuan supervisi, identifikasi praktik baik, dan evaluasi ketercapaian mutu satuan pendidikan SMP.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('follow-ups')}
          className="px-3.5 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Buka Matriks Tindak Lanjut</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Hasil ({filtered.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'findings'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Temuan Penting
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goodPractices')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'goodPractices'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Praktik Baik
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'analysis'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Analisis Mutu
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari temuan atau sekolah..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Memuat kompendium hasil pengawasan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            Tidak ada catatan hasil pengawasan ditemukan.
          </div>
        ) : (
          filtered.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{act.activityNumber}</span>
                  <span className="font-bold text-sm text-slate-900">{act.schoolName}</span>
                  <ActivityStatusBadge status={act.status} />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {act.activityDate} &bull; Pengawas: <strong>{act.supervisorName}</strong>
                </div>
              </div>

              {/* Conditional Content based on Tab */}
              {(activeTab === 'all' || activeTab === 'findings') && act.keyFindings && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 uppercase text-[11px] mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Temuan Penting:
                  </div>
                  <p className="text-amber-900 whitespace-pre-line leading-relaxed">
                    {act.keyFindings}
                  </p>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'goodPractices') && act.goodPractices && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 uppercase text-[11px] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Praktik Baik / Inovasi yang Ditemukan:
                  </div>
                  <p className="text-emerald-900 whitespace-pre-line leading-relaxed">
                    {act.goodPractices}
                  </p>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'analysis') && act.resultAnalysis && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950 uppercase text-[11px] mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Analisis Mutu Pendidikan:
                  </div>
                  <p className="text-indigo-900 whitespace-pre-line leading-relaxed">
                    {act.resultAnalysis}
                  </p>
                </div>
              )}

              {/* Recommendation Preview */}
              {act.recommendations && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800">
                  <span className="font-bold text-slate-700 block mb-0.5">Rekomendasi Pengawas:</span>
                  <p className="text-slate-600 line-clamp-2">{act.recommendations}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('activity-detail', { id: act.id })}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                >
                  Buka Laporan Lengkap <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
