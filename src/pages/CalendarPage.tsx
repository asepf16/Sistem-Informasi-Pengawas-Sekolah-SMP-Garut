import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../api/client';
import { SupervisionPlan, SupervisionActivity } from '../types';
import { Badge } from '../components/ui/Badge';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  School,
  Clock,
  CheckCircle2,
  CalendarCheck2,
  MapPin,
} from 'lucide-react';

interface CalendarPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // Default to March 2026 (matching active year)
  const [plans, setPlans] = useState<SupervisionPlan[]>([]);
  const [activities, setActivities] = useState<SupervisionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: string;
    plans: SupervisionPlan[];
    activities: SupervisionActivity[];
  } | null>(null);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [plansRes, actsRes] = await Promise.all([
        api.get('/api/plans'),
        api.get('/api/activities'),
      ]);
      if (plansRes.success) setPlans(plansRes.data);
      if (actsRes.success) setActivities(actsRes.data);
    } catch (err: any) {
      toast.error('Gagal memuat agenda kalender kepengawasan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [user]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents(null);
  };

  // Build grid calendar days
  const calendarCells = [];
  // Empty offset cells before 1st day of month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayPlans = plans.filter((p) => p.plannedDate === dateStr);
    const dayActs = activities.filter((a) => a.activityDate === dateStr);
    calendarCells.push({ day, date: dateStr, dateStr, plans: dayPlans, activities: dayActs });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-700" />
            Kalender Agenda Kepengawasan SMP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal rencana supervisi dan catatan realisasi kegiatan kepengawasan di satuan pendidikan.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 min-w-36 text-center">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-600">
        <span className="font-semibold text-slate-700">Keterangan Agenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span>Rencana Jadwal Supervisi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span>Realisasi Kunjungan Terlaksana</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Day Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
          <div className="text-rose-600">Minggu</div>
          <div>Senin</div>
          <div>Selasa</div>
          <div>Rabu</div>
          <div>Kamis</div>
          <div>Jumat</div>
          <div className="text-indigo-600">Sabtu</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[480px]">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="bg-slate-50/40 p-2 min-h-24" />;
            }

            const hasEvents = cell.plans.length > 0 || cell.activities.length > 0;
            const isToday =
              new Date().toISOString().split('T')[0] === cell.dateStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => hasEvents && setSelectedDayEvents(cell)}
                className={`p-2 min-h-24 transition flex flex-col justify-between ${
                  hasEvents ? 'cursor-pointer hover:bg-blue-50/40' : ''
                } ${isToday ? 'bg-amber-50/50' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-800'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {hasEvents && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cell.plans.length + cell.activities.length} item
                    </span>
                  )}
                </div>

                {/* Event previews inside cell */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {cell.plans.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 rounded px-1.5 py-0.5 font-medium truncate"
                      title={`Rencana: ${p.schoolName} - ${p.objective}`}
                    >
                      &bull; {p.schoolName}
                    </div>
                  ))}
                  {cell.activities.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 font-medium truncate"
                      title={`Kegiatan Terlaksana: ${a.schoolName}`}
                    >
                      &#10003; {a.schoolName}
                    </div>
                  ))}
                  {(cell.plans.length + cell.activities.length > 4) && (
                    <div className="text-[9px] text-slate-500 pl-1 font-semibold">
                      +{cell.plans.length + cell.activities.length - 4} lainnya...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Event Drawer */}
      {selectedDayEvents && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-blue-700" />
              Detail Agenda Tanggal: {selectedDayEvents.date}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDayEvents(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Tutup &times;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plans on this day */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-blue-900 uppercase">
                Rencana Kegiatan ({selectedDayEvents.plans.length})
              </h4>
              {selectedDayEvents.plans.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada rencana terjadwal pada tanggal ini.</p>
              ) : (
                selectedDayEvents.plans.map((p) => (
                  <div key={p.id} className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
                    <div className="font-bold text-slate-900">{p.schoolName}</div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{p.objective}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200/60">
                      <span className="text-[10px] text-slate-500">Pengawas: {p.supervisorName}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('activity-form', {
                            planId: p.id,
                            schoolId: p.schoolId,
                            objective: p.objective,
                            categories: p.category,
                          })
                        }
                        className="text-[11px] text-blue-700 font-bold hover:underline"
                      >
                        Realisasikan &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Activities on this day */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase">
                Kegiatan Terlaksana ({selectedDayEvents.activities.length})
              </h4>
              {selectedDayEvents.activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada catatan kegiatan terlaksana pada tanggal ini.</p>
              ) : (
                selectedDayEvents.activities.map((a) => (
                  <div key={a.id} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{a.schoolName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{a.activityNumber}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{a.objective}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/60">
                      <span className="text-[10px] text-slate-500">{a.activityTime || a.locationMode}</span>
                      <button
                        type="button"
                        onClick={() => onNavigate('activity-detail', { id: a.id })}
                        className="text-[11px] text-emerald-800 font-bold hover:underline"
                      >
                        Lihat Rincian Laporan &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
