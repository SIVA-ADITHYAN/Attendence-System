import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useUser } from '../context/UserContext';
import { studentAPI, attendanceAPI } from '../services/api';
const STATUS_COLORS = {
    PRESENT: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    ABSENT: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    LATE: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    LEAVE: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const fmt12 = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
};

const Reports = () => {
    const { user } = useUser();
    const coachingCentreId = user?.coachingCentreId;

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState([]);
    const [students, setStudents] = useState({});   // id → student
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    // ─── Fetch attendance + student lookup ───────────────────────────────────
    const fetchReport = async () => {
        if (!coachingCentreId) { toast.error('No coaching centre linked'); return; }
        if (!selectedDate) { toast.error('Please select a date'); return; }
        try {
            setLoading(true);
            const [attRes, stuRes] = await Promise.all([
                attendanceAPI.getByDateAndCoachingCentre(coachingCentreId, selectedDate),
                studentAPI.getByCoachingCentre(coachingCentreId, 0, 1000)
            ]);
            const att = attRes.data || [];
            const stus = stuRes.data?.content || [];
            const stuMap = {};
            stus.forEach(s => { stuMap[s.id] = s; });

            // Deduplicate: keep only ONE record per student. Prefer a record with checkInTime.
            const dedupedAtt = Object.values(
                att.reduce((acc, rec) => {
                    const existing = acc[rec.studentId];
                    if (!existing || (rec.checkInTime && !existing.checkInTime)) {
                        acc[rec.studentId] = rec;
                    } else if (rec.checkOutTime && !acc[rec.studentId].checkOutTime) {
                        acc[rec.studentId].checkOutTime = rec.checkOutTime;
                        if (rec.totalTimeSpent) acc[rec.studentId].totalTimeSpent = rec.totalTimeSpent;
                    }
                    return acc;
                }, {})
            );

            setRecords(dedupedAtt);
            setStudents(stuMap);
            setFetched(true);
            if (att.length === 0) toast('No attendance records found for this date.', { icon: '📭' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    // ─── Stats ───────────────────────────────────────────────────────────────
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const leave = records.filter(r => r.status === 'LEAVE').length;
    const pct = total ? Math.round((present / total) * 100) : 0;

    // ─── CSV Download ─────────────────────────────────────────────────────────
    const downloadCSV = () => {
        if (records.length === 0) { toast.error('No data to download'); return; }

        const headers = [
            'Student Name', 'Standard', 'Batch', 'Status',
            'Check-In', 'Check-Out', 'Time Spent', 'Remarks'
        ];
        const rows = records.map(r => {
            const s = students[r.studentId] || {};
            return [
                s.studentName || r.studentId,
                s.standard || '—',
                s.batchName || '—',
                r.status || '—',
                fmt12(r.checkInTime),
                fmt12(r.checkOutTime),
                r.totalTimeSpent || '—',
                r.remarks || '',
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_report_${selectedDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Report downloaded successfully!');
    };

    // ─── Guard ────────────────────────────────────────────────────────────────
    if (!coachingCentreId) {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-64">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">bar_chart</span>
                        <p className="text-slate-600 font-medium">No coaching centre linked to your account.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto w-full">

                {/* ── Page Header ── */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 mb-1">
                        Attendance Reports
                    </h1>
                    <p className="text-slate-500 text-sm">Select a date to view and download daily attendance details.</p>
                </div>

                {/* ── Date Picker Card ── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Select Date
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 text-xl">calendar_today</span>
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={e => { setSelectedDate(e.target.value); setFetched(false); setRecords([]); }}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading
                                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Loading...</>
                                : <><span className="material-symbols-outlined text-[18px]">search</span> Fetch Report</>
                            }
                        </button>

                        {fetched && records.length > 0 && (
                            <button
                                onClick={downloadCSV}
                                className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Download CSV
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                {fetched && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            {[
                                { label: 'Total', value: total, icon: 'group', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
                                { label: 'Present', value: present, icon: 'check_circle', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                { label: 'Absent', value: absent, icon: 'cancel', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
                                { label: 'Late', value: late, icon: 'schedule', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                                { label: 'Leave', value: leave, icon: 'event_busy', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                            ].map(stat => (
                                <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-4 flex flex-col items-center justify-center gap-1`}>
                                    <span className={`material-symbols-outlined text-2xl ${stat.text}`}>{stat.icon}</span>
                                    <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
                                    <p className={`text-xs font-semibold ${stat.text} opacity-70`}>{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Attendance Rate Bar */}
                        {total > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">Attendance Rate</p>
                                    <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {present} out of {total} students present on{' '}
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        )}

                        {/* ── Table ── */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <h2 className="font-bold text-slate-800 text-base">
                                    Attendance Details
                                    <span className="ml-2 text-sm font-normal text-slate-400">
                                        — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </h2>
                                <span className="text-sm text-slate-400">{records.length} records</span>
                            </div>

                            {records.length === 0 ? (
                                <div className="py-20 flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-6xl text-slate-200">event_busy</span>
                                    <p className="text-slate-500 font-medium">No attendance records for this date.</p>
                                    <p className="text-slate-400 text-sm">Try selecting a different date.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/60 border-b border-slate-100">
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">#</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Student</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Standard</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Batch</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Status</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Check-In</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Check-Out</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Time Spent</th>
                                                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {records.map((rec, idx) => {
                                                const s = students[rec.studentId] || {};
                                                const clr = STATUS_COLORS[rec.status] || STATUS_COLORS['ABSENT'];
                                                return (
                                                    <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                                                        <td className="px-6 py-3.5 text-sm text-slate-400 text-center font-medium">{idx + 1}</td>
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                                    {(s.studentName || '?').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-800">{s.studentName || rec.studentId}</p>
                                                                    <p className="text-xs text-slate-400">{s.registerNumber || ''}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-sm text-slate-600 text-center">{s.standard ? `Grade ${s.standard}` : '—'}</td>
                                                        <td className="px-6 py-3.5 text-sm text-slate-600 text-center">{s.batchName || '—'}</td>
                                                        <td className="px-6 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${clr.bg} ${clr.text}`}>
                                                                <span className={`size-1.5 rounded-full ${clr.dot}`} />
                                                                {rec.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-sm text-slate-600 text-center font-mono">{fmt12(rec.checkInTime)}</td>
                                                        <td className="px-6 py-3.5 text-sm text-slate-600 text-center font-mono">{fmt12(rec.checkOutTime)}</td>
                                                        <td className="px-6 py-3.5 text-center">
                                                            {rec.totalTimeSpent ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                                    {rec.totalTimeSpent}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 text-sm">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-sm text-slate-400">{rec.remarks || '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── Empty state before fetch ── */}
                {!fetched && !loading && (
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-20 flex flex-col items-center gap-3">
                        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined text-3xl text-primary">bar_chart</span>
                        </div>
                        <p className="text-slate-700 font-semibold text-base">Select a Date to Get Started</p>
                        <p className="text-slate-400 text-sm text-center max-w-xs">
                            Pick a date above and click <strong>Fetch Report</strong> to view attendance details. You can then download the report as a CSV.
                        </p>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default Reports;
