import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { studentAPI, attendanceAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import API_BASE_URL from '../config';

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt12 = (t) => {
    if (!t) return '-';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};
const initials = (name) => {
    if (!name) return '?';
    const p = name.split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Calendar Component ─────────────────────────────────────────────────────
const AttendanceCalendar = ({ coachingCentreId }) => {
    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());  // 0-indexed
    const [selected, setSelected] = useState(null);            // 'YYYY-MM-DD'
    const [dayStats, setDayStats] = useState(null);            // { present, absent, late, leave }
    const [loadingDay, setLoadingDay] = useState(false);

    const todayStr = now.toISOString().split('T')[0];

    // Build calendar grid
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const toDateStr = (d) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${viewYear}-${mm}-${dd}`;
    };

    const isFuture = (d) => toDateStr(d) > todayStr;

    const handleDayClick = async (d) => {
        if (isFuture(d)) return;
        const dateStr = toDateStr(d);
        setSelected(dateStr);
        setDayStats(null);
        try {
            setLoadingDay(true);
            const res = await axios.get(
                `${API_BASE_URL}/api/attendance/coaching-centre/${coachingCentreId}/date/${dateStr}`
            );
            const records = res.data || [];
            const present = records.filter(r => r.status === 'PRESENT').length;
            const absent = records.filter(r => r.status === 'ABSENT').length;
            const late = records.filter(r => r.status === 'LATE').length;
            const leave = records.filter(r => r.status === 'LEAVE').length;
            setDayStats({ present, absent, late, leave, total: records.length });
        } catch (e) {
            toast.error('Failed to load attendance for that date');
        } finally {
            setLoadingDay(false);
        }
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
        setSelected(null); setDayStats(null);
    };
    const nextMonth = () => {
        const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
        if (`${nextY}-${String(nextM + 1).padStart(2, '0')}-01` > todayStr.substring(0, 7) + '-01' &&
            `${nextY}-${String(nextM + 1).padStart(2, '0')}` > todayStr.substring(0, 7)) return;
        setViewMonth(nextM); if (viewMonth === 11) setViewYear(y => y + 1);
        setSelected(null); setDayStats(null);
    };

    const selectedDay = selected ? new Date(selected + 'T00:00:00') : null;
    const selectedLabel = selectedDay
        ? selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-base">Attendance Calendar</h3>
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-1">
                    {cells.map((d, i) => {
                        if (!d) return <div key={`e-${i}`} />;
                        const ds = toDateStr(d);
                        const isToday = ds === todayStr;
                        const isSelected = ds === selected;
                        const future = isFuture(d);
                        return (
                            <button
                                key={d}
                                onClick={() => handleDayClick(d)}
                                disabled={future}
                                className={`
                                    relative mx-auto size-9 rounded-full text-sm font-medium transition-all
                                    ${isSelected
                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                        : isToday
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : future
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                                    }
                                `}
                            >
                                {d}
                                {isToday && !isSelected && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Stats */}
            <div className="border-t border-slate-100 px-5 py-4 min-h-[120px] flex flex-col justify-center">
                {!selected && (
                    <div className="text-center text-slate-400 text-sm py-4">
                        <span className="material-symbols-outlined text-3xl text-slate-200 block mb-1">touch_app</span>
                        Tap any date to see attendance
                    </div>
                )}
                {selected && loadingDay && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <span className="text-sm text-slate-500">Loading...</span>
                    </div>
                )}
                {selected && !loadingDay && dayStats && (
                    <>
                        <p className="text-xs font-semibold text-slate-500 mb-3 truncate">{selectedLabel}</p>
                        {dayStats.total === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-2">No records found</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Present', value: dayStats.present, dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                                    { label: 'Absent', value: dayStats.absent, dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
                                    { label: 'Late', value: dayStats.late, dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                                    { label: 'Leave', value: dayStats.leave, dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2 flex items-center justify-between`}>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`size-2 rounded-full ${s.dot}`} />
                                            <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${s.text}`}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Dashboard ──────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user } = useUser();
    const coachingCentreId = user?.coachingCentreId;
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        leaveCount: 0,
        todayAttendance: 0,
        attendanceRate: 0,
    });
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [studentMap, setStudentMap] = useState({});

    useEffect(() => {
        if (coachingCentreId) fetchDashboardData();
    }, [coachingCentreId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [studentsRes, attRes] = await Promise.all([
                studentAPI.getByCoachingCentre(coachingCentreId),
                attendanceAPI.getByDate(today),
            ]);

            const students = studentsRes.data.content;
            const allRecords = attRes.data;
            const centreIds = new Set(students.map(s => s.id));
            const todayRecords = allRecords.filter(r => centreIds.has(r.studentId));

            const stuMap = {};
            students.forEach(s => { stuMap[s.id] = s; });
            setStudentMap(stuMap);

            const presentCount = todayRecords.filter(r => r.status === 'PRESENT').length;
            const lateCount = todayRecords.filter(r => r.status === 'LATE').length;
            const absentCount = todayRecords.filter(r => r.status === 'ABSENT').length;
            const leaveCount = todayRecords.filter(r => r.status === 'LEAVE').length;
            const todayAttendance = presentCount + lateCount;
            const attendanceRate = students.length > 0
                ? Math.round((todayAttendance / students.length) * 100) : 0;

            setStats({
                totalStudents: students.length,
                presentCount, lateCount, absentCount, leaveCount,
                todayAttendance, attendanceRate,
            });

            const sorted = [...todayRecords]
                .sort((a, b) => {
                    if (!a.checkInTime) return 1;
                    if (!b.checkInTime) return -1;
                    return b.checkInTime.localeCompare(a.checkInTime);
                })
                .slice(0, 10);
            setRecentAttendance(sorted);

        } catch (err) {
            console.error(err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status) => {
        const map = {
            PRESENT: 'bg-emerald-100 text-emerald-700',
            LATE: 'bg-amber-100 text-amber-700',
            ABSENT: 'bg-red-100 text-red-600',
            LEAVE: 'bg-blue-100 text-blue-700',
        };
        return map[status] || 'bg-slate-100 text-slate-500';
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                        <p className="mt-4 text-slate-600">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const total = stats.totalStudents;

    // Donut segments: present/late/leave/absent
    const pressDeg = total > 0 ? (stats.presentCount / total) * 360 : 0;
    const lateDeg = total > 0 ? (stats.lateCount / total) * 360 : 0;
    const leaveDeg = total > 0 ? (stats.leaveCount / total) * 360 : 0;
    const p1 = pressDeg;
    const p2 = p1 + lateDeg;
    const p3 = p2 + leaveDeg;

    return (
        <Layout>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Students', value: total, icon: 'badge', iconBg: 'bg-primary/10', iconTxt: 'text-primary' },
                        { label: 'Present', value: stats.presentCount, icon: 'how_to_reg', iconBg: 'bg-emerald-50', iconTxt: 'text-emerald-600' },
                        { label: 'Absent', value: stats.absentCount, icon: 'person_off', iconBg: 'bg-red-50', iconTxt: 'text-red-500' },
                        { label: 'Late', value: stats.lateCount, icon: 'schedule', iconBg: 'bg-amber-50', iconTxt: 'text-amber-600' },
                        { label: 'Leave', value: stats.leaveCount, icon: 'event_busy', iconBg: 'bg-blue-50', iconTxt: 'text-blue-600' },
                    ].map(card => (
                        <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
                            <div className={`size-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconTxt}`}>
                                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-medium">{card.label}</p>
                                <p className="text-2xl font-black text-slate-800 leading-tight">{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main Content: Donut + Calendar ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Donut Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 text-base mb-1">Today's Snapshot</h3>
                        <p className="text-xs text-slate-400 mb-6">Live attendance breakdown</p>

                        <div className="flex flex-col items-center">
                            <div className="relative size-44 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[14px] border-slate-100" />
                                {total > 0 && (
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: `conic-gradient(
                                                #22c55e 0deg ${p1}deg,
                                                #f59e0b ${p1}deg ${p2}deg,
                                                #3b82f6 ${p2}deg ${p3}deg,
                                                #ef4444 ${p3}deg 360deg
                                            )`,
                                            mask: 'radial-gradient(transparent calc(50% - 14px), black calc(50% - 13px))',
                                            WebkitMask: 'radial-gradient(transparent calc(50% - 14px), black calc(50% - 13px))',
                                        }}
                                    />
                                )}
                                <div className="text-center z-10">
                                    <span className="block text-2xl font-black">{stats.attendanceRate}%</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
                                </div>
                            </div>

                            <div className="mt-6 w-full space-y-2.5">
                                {[
                                    { label: 'Present', value: stats.presentCount, dot: 'bg-emerald-500' },
                                    { label: 'Late', value: stats.lateCount, dot: 'bg-amber-500' },
                                    { label: 'Leave', value: stats.leaveCount, dot: 'bg-blue-500' },
                                    { label: 'Absent', value: stats.absentCount, dot: 'bg-red-500' },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-2.5 rounded-full ${row.dot}`} />
                                            <span className="text-slate-600">{row.label}</span>
                                        </div>
                                        <span className="font-bold text-slate-800">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="lg:col-span-2">
                        <AttendanceCalendar coachingCentreId={coachingCentreId} />
                    </div>
                </div>

                {/* ── Recent Check-ins Table ── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Recent Check-ins</h3>
                        <span className="text-xs text-slate-400">{recentAttendance.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/60">
                                <tr>
                                    {['Name', 'Standard', 'Status', 'Check-in', 'Check-out'].map(h => (
                                        <th key={h} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-sm">
                                            No attendance records for today
                                        </td>
                                    </tr>
                                ) : (
                                    recentAttendance.map(rec => {
                                        const stu = studentMap[rec.studentId];
                                        return (
                                            <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                                            {initials(stu?.studentName)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{stu?.studentName || 'Unknown'}</p>
                                                            <p className="text-[10px] text-slate-400">{stu?.batchName || ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-slate-600">{stu?.standard || '—'}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(rec.status)}`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm font-medium text-slate-600 font-mono">{fmt12(rec.checkInTime)}</td>
                                                <td className="px-6 py-3.5 text-sm font-medium text-slate-600 font-mono">{fmt12(rec.checkOutTime)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default Dashboard;
