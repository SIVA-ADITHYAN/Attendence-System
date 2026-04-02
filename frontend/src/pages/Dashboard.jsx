import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import AttendanceCalendar from '../components/AttendanceCalendar';

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        leaveCount: 0,
        attendanceRate: 0
    });
    const [standardStats, setStandardStats] = useState([]);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const coachingCentreId = localStorage.getItem('coachingCentreId');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsRes, recentRes, studentsRes] = await Promise.all([
                    axios.get(`http://localhost:8080/api/attendance/stats/${coachingCentreId}`),
                    axios.get(`http://localhost:8080/api/attendance/recent/${coachingCentreId}`),
                    axios.get(`http://localhost:8080/api/students/centre/${coachingCentreId}`)
                ]);

                setStats(statsRes.data);
                setRecentAttendance(recentRes.data);
                setStudents(studentsRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (coachingCentreId) {
            fetchDashboardData();
        }
    }, [coachingCentreId]);

    const studentMap = useMemo(() => {
        return students.reduce((acc, student) => {
            acc[student.id] = student;
            return acc;
        }, {});
    }, [students]);

    const total = students.length;
    
    const initials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        try {
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h12 = hour % 12 || 12;
            return `${h12}:${m} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            case 'ABSENT': return 'bg-rose-50 text-rose-600 border border-rose-100';
            case 'LATE': return 'bg-amber-50 text-amber-600 border border-amber-100';
            case 'LEAVE': return 'bg-blue-50 text-blue-600 border border-blue-100';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    {[
                        { label: 'Total Students', value: total, icon: 'badge', iconBg: 'bg-primary/10', iconTxt: 'text-primary' },
                        { label: 'Present', value: stats.presentCount, icon: 'how_to_reg', iconBg: 'bg-emerald-50', iconTxt: 'text-emerald-600' },
                        { label: 'Absent', value: stats.absentCount, icon: 'person_off', iconBg: 'bg-red-50', iconTxt: 'text-red-500' },
                        { label: 'Late', value: stats.lateCount, icon: 'schedule', iconBg: 'bg-amber-50', iconTxt: 'text-amber-600' },
                        { label: 'Leave', value: stats.leaveCount, icon: 'event_busy', iconBg: 'bg-blue-50', iconTxt: 'text-blue-600' },
                    ].map(card => (
                        <div key={card.label} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-2 md:gap-3 transition-transform hover:scale-[1.02] active:scale-95">
                            <div className={`size-8 md:size-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconTxt}`}>
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">{card.icon}</span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[10px] md:text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800 leading-tight">{card.value}</p>
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
                        <AttendanceCalendar coachingCentreId={coachingCentreId} user={user} />
                    </div>
                </div>

                {/* ── Recent Check-ins Table ── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Recent Check-ins</h3>
                        <span className="text-xs text-slate-400">{recentAttendance.length} records</span>
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/60 border-b border-slate-100">
                                <tr>
                                    {['Name', 'Standard', 'Status', 'Check-in', 'Check-out'].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm">No recent attendance records today.</td>
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
                                                <td className="px-6 py-3.5 text-sm text-slate-600 font-medium">
                                                    {stu?.standard || '—'}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(rec.status)}`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-600">{formatTime(rec.checkInTime)}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-600">{formatTime(rec.checkOutTime)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {recentAttendance.length === 0 ? (
                            <div className="px-6 py-10 text-center text-slate-400 text-xs italic">No attendance records for today</div>
                        ) : (
                            recentAttendance.map(rec => {
                                const stu = studentMap[rec.studentId];
                                return (
                                    <div key={rec.id} className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-100">
                                                {initials(stu?.studentName)}
                                            </div>
                                            <div className="max-w-[120px]">
                                                <p className="text-sm font-bold text-slate-800 truncate">{stu?.studentName || 'Unknown'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[9px] font-black uppercase ${rec.status === 'PRESENT' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {rec.status}
                                                    </span>
                                                    <span className="size-1 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] font-bold text-slate-400">{stu?.standard || ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-700 font-mono">{formatTime(rec.checkInTime)}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Check-in</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
