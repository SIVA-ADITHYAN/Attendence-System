import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { studentAPI, attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStandard, setFilterStandard] = useState('All Standards');
    const [filterBatch, setFilterBatch] = useState('All Batches');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        total: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStandard, filterBatch]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            const [studentsRes, attendanceRes] = await Promise.all([
                studentAPI.getActive(),
                attendanceAPI.getByDate(today)
            ]);

            setStudents(studentsRes.data);

            // Map attendance by studentId
            const attMap = {};
            let present = 0, absent = 0, late = 0;

            attendanceRes.data.forEach(record => {
                attMap[record.studentId] = record;
                if (record.status === 'PRESENT') present++;
                else if (record.status === 'ABSENT') absent++;
                else if (record.status === 'LATE') late++;
            });

            setAttendanceMap(attMap);
            setStats({
                present,
                absent,
                late,
                total: studentsRes.data.length
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const getLocalTime = () => {
        return new Date().toTimeString().split(' ')[0]; // Returns HH:MM:SS
    };

    const handleMarkAttendance = async (studentId, status) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const existingRecord = attendanceMap[studentId];

            const payload = {
                studentId,
                date: today,
                status,
                // Preserve times if updating, or set checkInTime if marking Present/Late for first time
                checkInTime: existingRecord?.checkInTime || ((status === 'PRESENT' || status === 'LATE') ? getLocalTime() : null),
                checkOutTime: existingRecord?.checkOutTime || null
            };

            let response;
            if (existingRecord) {
                response = await attendanceAPI.update(existingRecord.id, payload);
            } else {
                response = await attendanceAPI.create(payload);
            }

            // Update local state
            setAttendanceMap(prev => ({
                ...prev,
                [studentId]: response.data
            }));

            // Update stats
            updateStats(existingRecord?.status, status);

            toast.success(`Marked as ${status}`);
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error('Failed to update attendance');
        }
    };

    const handleCheckIn = async (studentId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const existingRecord = attendanceMap[studentId];
            const nowTime = getLocalTime();

            const payload = {
                studentId,
                date: today,
                status: existingRecord?.status === 'LATE' ? 'LATE' : 'PRESENT', // Keep Late if already late
                checkInTime: nowTime,
                checkOutTime: existingRecord?.checkOutTime || null
            };

            let response;
            if (existingRecord) {
                response = await attendanceAPI.update(existingRecord.id, payload);
            } else {
                response = await attendanceAPI.create(payload);
            }

            setAttendanceMap(prev => ({
                ...prev,
                [studentId]: response.data
            }));

            if (!existingRecord) updateStats(null, 'PRESENT');

            toast.success('Checked in successfully');
        } catch (error) {
            console.error('Error checking in:', error);
            toast.error('Failed to check in');
        }
    };

    const handleCheckOut = async (studentId) => {
        try {
            const existingRecord = attendanceMap[studentId];
            if (!existingRecord) {
                toast.error('Student must be checked in first');
                return;
            }

            // Use the dedicated checkout endpoint if available, or update manually
            await attendanceAPI.checkOut(existingRecord.id);

            // Optimistic update
            const nowTime = getLocalTime();
            setAttendanceMap(prev => ({
                ...prev,
                [studentId]: { ...existingRecord, checkOutTime: nowTime }
            }));

            toast.success('Checked out successfully');
        } catch (error) {
            console.error('Error checking out:', error);
            toast.error('Failed to check out');
        }
    };

    const handleMarkAllPresent = async () => {
        if (!window.confirm('Mark all displayed students as Present?')) return;

        try {
            const promises = filteredStudents
                .filter(student => !attendanceMap[student.id]) // Only those not yet marked
                .map(student => {
                    const payload = {
                        studentId: student.id,
                        date: new Date().toISOString().split('T')[0],
                        status: 'PRESENT',
                        checkInTime: getLocalTime()
                    };
                    return attendanceAPI.create(payload);
                });

            if (promises.length === 0) {
                toast('No unmarked students to update');
                return;
            }

            await Promise.all(promises);
            await fetchData(); // Refetch to ensure sync
            toast.success('Marked all as Present');
        } catch (error) {
            console.error('Error marking all present:', error);
            toast.error('Failed to mark all present');
        }
    };

    const updateStats = (oldStatus, newStatus) => {
        setStats(prev => {
            const newStats = { ...prev };
            // Decrement old status count only if valid
            if (oldStatus) {
                if (oldStatus === 'PRESENT') newStats.present = Math.max(0, newStats.present - 1);
                else if (oldStatus === 'ABSENT') newStats.absent = Math.max(0, newStats.absent - 1);
                else if (oldStatus === 'LATE') newStats.late = Math.max(0, newStats.late - 1);
            }

            // Increment new status count
            if (newStatus === 'PRESENT') newStats.present++;
            else if (newStatus === 'ABSENT') newStats.absent++;
            else if (newStatus === 'LATE') newStats.late++;

            return newStats;
        });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-- : --';
        try {
            // Assuming timeString is HH:mm or HH:mm:ss
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return timeString;
        }
    };

    // Derived state for filtering
    const filteredStudents = students.filter(student => {
        const matchesSearch = (student.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.regId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesStandard = filterStandard === 'All Standards' || student.standard === filterStandard;
        const matchesBatch = filterBatch === 'All Batches' || student.batchName === filterBatch;

        return matchesSearch && matchesStandard && matchesBatch;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const uniqueStandards = ['All Standards', ...new Set(students.map(s => s.standard).filter(Boolean))];
    const uniqueBatches = ['All Batches', ...new Set(students.map(s => s.batchName).filter(Boolean))];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-[#f8fafc] text-slate-900 font-display min-h-full transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                    {/* Header Section */}
                    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-4xl font-black tracking-tight text-slate-900">Mark Attendance</h1>
                            <p className="text-slate-500 font-medium">Manage student presence and session check-ins for today</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleMarkAllPresent}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white hover:bg-primary/90 transition-all rounded-xl font-semibold text-sm shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">done_all</span>
                                Mark All Present
                            </button>
                        </div>
                    </header>

                    {/* Filters & Search Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            {/* Search Input */}
                            <div className="relative w-full lg:flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-slate-900"
                                    placeholder="Search student by name or ID..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                <div className="relative min-w-[140px] flex-1 lg:flex-none">
                                    <select
                                        value={filterStandard}
                                        onChange={(e) => setFilterStandard(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-slate-700"
                                    >
                                        {uniqueStandards.map(std => (
                                            <option key={std} value={std}>{std}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                    </div>
                                </div>
                                <div className="relative min-w-[140px] flex-1 lg:flex-none">
                                    <select
                                        value={filterBatch}
                                        onChange={(e) => setFilterBatch(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-slate-700"
                                    >
                                        {uniqueBatches.map(batch => (
                                            <option key={batch} value={batch}>{batch}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                    </div>
                                </div>
                                <button className="flex items-center justify-center p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">filter_list</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Table Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Standard</th>
                                        <th className="px-6 py-4 min-w-[280px]">Status</th>
                                        <th className="px-6 py-4">Check-in</th>
                                        <th className="px-6 py-4">Check-out</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                No students found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentStudents.map(student => {
                                            const record = attendanceMap[student.id];
                                            const status = record?.status;

                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-600">
                                                                {getInitials(student.studentName)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900">{student.studentName}</p>
                                                                <p className="text-xs text-slate-400">ID: #{student.regId || student.id.substring(0, 6)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                                            {student.standard}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                                                            <button
                                                                onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${status === 'PRESENT' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${status === 'ABSENT' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                            >
                                                                Absent
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkAttendance(student.id, 'LATE')}
                                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${status === 'LATE' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                            >
                                                                Late
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`text-sm font-medium ${record?.checkInTime ? 'text-slate-600' : 'text-slate-400'}`}>
                                                            {formatTime(record?.checkInTime)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`text-sm font-medium ${record?.checkOutTime ? 'text-slate-600' : 'text-slate-400'}`}>
                                                            {formatTime(record?.checkOutTime)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {!record?.checkInTime ? (
                                                                <button
                                                                    onClick={() => handleCheckIn(student.id)}
                                                                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
                                                                >
                                                                    Check-in
                                                                </button>
                                                            ) : !record?.checkOutTime ? (
                                                                <button
                                                                    onClick={() => handleCheckOut(student.id)}
                                                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                                                                >
                                                                    Check-out
                                                                </button>
                                                            ) : (
                                                                <span className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Table Footer / Pagination */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-medium">
                                Showing {currentStudents.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${currentPage === 1
                                            ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                            : 'text-slate-400 hover:bg-white cursor-pointer'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${currentPage === totalPages || totalPages === 0
                                            ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                            : 'text-slate-400 hover:bg-white cursor-pointer'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Summary Card (Mobile Only visible indicator or Desktop secondary) */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <span className="material-symbols-outlined">how_to_reg</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present Today</p>
                                <p className="text-2xl font-black text-slate-900">{stats.present} <span className="text-sm font-normal text-slate-400">/ {stats.total}</span></p>
                            </div>
                        </div>
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                                <span className="material-symbols-outlined">person_off</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Absent</p>
                                <p className="text-2xl font-black text-slate-900">{stats.absent}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Late Arrivals</p>
                                <p className="text-2xl font-black text-slate-900">{stats.late}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Attendance;
