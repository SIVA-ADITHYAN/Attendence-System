import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { studentAPI, attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        todayAttendance: 0,
        attendanceRate: 0,
        absentToday: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
    });
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [studentMap, setStudentMap] = useState({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // Fetch all required data in parallel
            const [studentsResponse, todayAttendanceResponse] = await Promise.all([
                studentAPI.getActive(),
                attendanceAPI.getByDate(today),
            ]);

            const students = studentsResponse.data;
            const todayRecords = todayAttendanceResponse.data;

            // Create student map for quick lookup
            const studentLookup = {};
            students.forEach(student => {
                studentLookup[student.id] = student;
            });
            setStudentMap(studentLookup);

            // Calculate statistics
            const totalStudents = students.length;
            const presentCount = todayRecords.filter(r => r.status === 'PRESENT').length;
            const lateCount = todayRecords.filter(r => r.status === 'LATE').length;
            const absentCount = todayRecords.filter(r => r.status === 'ABSENT').length;
            const todayAttendance = presentCount + lateCount;
            const attendanceRate = totalStudents > 0
                ? Math.round((todayAttendance / totalStudents) * 100)
                : 0;

            setStats({
                totalStudents,
                todayAttendance,
                attendanceRate,
                absentToday: absentCount,
                presentCount,
                lateCount,
                absentCount,
            });

            // Sort by most recent check-in and take top 10
            const sortedRecords = [...todayRecords]
                .sort((a, b) => {
                    if (!a.checkInTime) return 1;
                    if (!b.checkInTime) return -1;
                    return b.checkInTime.localeCompare(a.checkInTime);
                })
                .slice(0, 10);

            setRecentAttendance(sortedRecords);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PRESENT':
                return 'bg-success/10 text-success';
            case 'LATE':
                return 'bg-primary/10 text-primary';
            case 'ABSENT':
                return 'bg-red-100 text-red-500';
            default:
                return 'bg-slate-100 text-slate-500';
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return timeString;
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-slate-600">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Top Section Container */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* KPI Cards Bundle */}
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">badge</span>
                                </div>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Total Students</h3>
                            <p className="text-2xl font-bold mt-1">{stats.totalStudents.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-success/10 flex items-center justify-center text-success">
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                </div>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Today's Attendance</h3>
                            <p className="text-2xl font-bold mt-1">{stats.todayAttendance.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                                    <span className="material-symbols-outlined">percent</span>
                                </div>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Attendance Rate</h3>
                            <p className="text-2xl font-bold mt-1">{stats.attendanceRate}%</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                                    <span className="material-symbols-outlined">person_off</span>
                                </div>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Absent Today</h3>
                            <p className="text-2xl font-bold mt-1">{stats.absentToday.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Pie Chart Section */}
                    <div className="xl:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                            <h3 className="text-lg font-bold mb-1">Attendance Status</h3>
                            <p className="text-sm text-slate-500 mb-8">Snapshot for today</p>
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative size-48 flex items-center justify-center">
                                    {/* Track (Grey Ring) */}
                                    <div className="absolute inset-0 rounded-full border-[16px] border-slate-100"></div>

                                    {/* Dynamic Donut Chart using conic-gradient */}
                                    {stats.totalStudents > 0 && (
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: `conic-gradient(
                                                    #22c55e 0deg ${(stats.presentCount / stats.totalStudents) * 360}deg,
                                                    #4f46e5 ${(stats.presentCount / stats.totalStudents) * 360}deg ${((stats.presentCount + stats.lateCount) / stats.totalStudents) * 360}deg,
                                                    #ef4444 ${((stats.presentCount + stats.lateCount) / stats.totalStudents) * 360}deg 360deg
                                                )`,
                                                mask: 'radial-gradient(transparent calc(50% - 16px), black calc(50% - 15px))',
                                                WebkitMask: 'radial-gradient(transparent calc(50% - 16px), black calc(50% - 15px))'
                                            }}
                                        ></div>
                                    )}

                                    {/* Center Text */}
                                    <div className="text-center z-10">
                                        <span className="block text-2xl font-bold">{stats.totalStudents.toLocaleString()}</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                                    </div>
                                </div>
                                <div className="mt-8 w-full space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full bg-success"></span>
                                            <span className="text-slate-600">Present</span>
                                        </div>
                                        <span className="font-bold">{stats.presentCount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full bg-primary"></span>
                                            <span className="text-slate-600">Late</span>
                                        </div>
                                        <span className="font-bold">{stats.lateCount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full bg-red-500"></span>
                                            <span className="text-slate-600">Absent</span>
                                        </div>
                                        <span className="font-bold">{stats.absentCount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold">Recent Check-in's</h3>
                        <button className="text-primary text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Standard</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-in Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-out Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            No attendance records for today
                                        </td>
                                    </tr>
                                ) : (
                                    recentAttendance.map((record) => {
                                        const student = studentMap[record.studentId];
                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                            {student ? getInitials(student.studentName) : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">
                                                                {student?.studentName || 'Unknown Student'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {student?.batchName || ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">{student?.standard || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(record.status)}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {formatTime(record.checkInTime)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {formatTime(record.checkOutTime)}
                                                </td>
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

