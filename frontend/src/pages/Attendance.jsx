import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { studentAPI, attendanceAPI, faceAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';

const Attendance = () => {
    const { user } = useUser();
    const coachingCentreId = user?.coachingCentreId;
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

    const [attendanceMode, setAttendanceMode] = useState('manual'); // 'camera', 'manual'
    const webcamRef = React.useRef(null);
    const [recognizing, setRecognizing] = useState(false);
    const [cameraStatus, setCameraStatus] = useState('Starting camera...');
    const [cameraReady, setCameraReady] = useState(false);
    
    const processingStudents = React.useRef(new Set()); // Lock: prevents duplicate actions per student

    // ── Remarks modal state ───────────────────────────────────────────────────
    const [remarkModal, setRemarkModal] = useState(null); // { studentId, status }
    const [remarkText, setRemarkText] = useState('');

    // ── Compress a base64 image to a smaller size for API transmission ──────
    const compressImage = (base64, maxWidth = 320, quality = 0.6) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxWidth / img.width);
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(base64); // fallback: use original
            img.src = base64;
        });
    };


    useEffect(() => {
        let intervalId;
        if (attendanceMode === 'camera') {
            intervalId = setInterval(async () => {
                if (webcamRef.current && !recognizing) {
                    setRecognizing(true);
                    setCameraStatus('Scanning face...');

                    try {
                        // ── Collect 3 burst frames (reduced from 5 to cut payload size) ──
                        const BURST = 3;
                        const rawImages = [];
                        for (let i = 0; i < BURST; i++) {
                            const shot = webcamRef.current.getScreenshot();
                            if (shot) rawImages.push(shot);
                            await new Promise(r => setTimeout(r, 200));
                        }

                        if (rawImages.length === 0) {
                            setCameraStatus('Looking for face...');
                            return;
                        }

                        // ── Compress each frame to ~320px wide JPEG before sending ──────
                        const images = await Promise.all(rawImages.map(img => compressImage(img)));

                        const res = await faceAPI.recognizeFused(images);

                        if (res.data.match) {
                            const studentId   = res.data.student.id;
                            const tutorId     = res.data.student.tutorId;
                            const studentName = res.data.student.studentName;
                            const similarity  = res.data.similarity
                                ? ` (${(res.data.similarity * 100).toFixed(0)}% match)`
                                : '';

                            setCameraStatus(`Recognized: ${studentName}${similarity}`);

                            if (processingStudents.current.has(studentId)) return;
                            processingStudents.current.add(studentId);

                            try {
                                const checkInRes = await attendanceAPI.faceCheckIn(studentId, tutorId);
                                const { action, message, attendance: rec } = checkInRes.data;

                                switch (action) {
                                    case 'CHECKIN':
                                        setAttendanceMap(prev => {
                                            const existing = prev[studentId];
                                            if (!existing || existing.status !== 'PRESENT') {
                                                updateStats(existing?.status, 'PRESENT');
                                            }
                                            return { ...prev, [studentId]: rec };
                                        });
                                        toast.success(`✅ ${studentName} checked in!`);
                                        setCameraStatus(`✅ ${studentName} — Checked In${similarity}`);
                                        break;

                                    case 'CHECKOUT':
                                        setAttendanceMap(prev => ({ ...prev, [studentId]: rec }));
                                        toast.success(`🚪 ${studentName} checked out! Time: ${rec.totalTimeSpent || ''}`);
                                        setCameraStatus(`🚪 ${studentName} — Checked Out`);
                                        break;

                                    case 'COOLING':
                                        toast(`⏳ ${message}`, { icon: '🕐', duration: 4000 });
                                        setCameraStatus(`⏳ ${studentName} — Please Wait`);
                                        break;

                                    case 'ALREADY_PRESENT':
                                        toast(`${studentName} is already marked present.`, { icon: '✅', duration: 3000 });
                                        setCameraStatus(`✅ ${studentName} — Already Present`);
                                        break;

                                    case 'COMPLETED':
                                        toast(`${studentName} has already completed attendance today.`, { icon: '✅', duration: 3000 });
                                        setCameraStatus(`✅ ${studentName} — Completed`);
                                        break;

                                    default:
                                        setCameraStatus(`Recognized: ${studentName}${similarity}`);
                                }
                            } catch (apiErr) {
                                console.error('Attendance API error:', apiErr);
                                toast.error('Failed to record attendance');
                            } finally {
                                processingStudents.current.delete(studentId);
                            }
                        } else {
                            const bestScore = res.data.best_score
                                ? ` (best: ${(res.data.best_score * 100).toFixed(0)}%)`
                                : '';
                            setCameraStatus(`Looking for face...${bestScore}`);
                        }
                    } catch (e) {
                        console.error('Face recognition error:', e);
                        setCameraStatus('Face API unavailable');
                    } finally {
                        setTimeout(() => setRecognizing(false), 1500);
                    }
                }
            }, 3000);  // run every 3 s (5 frames × 200 ms = 1 s burst + 2 s pause)
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [attendanceMode, recognizing]);

    useEffect(() => {
        if (coachingCentreId) {
            fetchData();
        }
    }, [coachingCentreId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStandard, filterBatch]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const today = new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time

            let studentsPromise;
            if (user?.role === 'TUTOR') {
                studentsPromise = studentAPI.getByTutor(user.id);
            } else {
                // Fetch all coaching centre students for ADMIN
                studentsPromise = studentAPI.getByCoachingCentre(coachingCentreId);
            }

            const [studentsRes, attendanceRes] = await Promise.all([
                studentsPromise,
                attendanceAPI.getByDate(today)
            ]);

            // Normalize response: paginated Page (ADMIN) vs direct list (TUTOR)
            const centreStudents = studentsRes.data.content !== undefined 
                ? studentsRes.data.content 
                : (studentsRes.data || []);
            const allTodayRecords = attendanceRes.data;

            // Build a Set of student IDs for this coaching centre
            const centreStudentIds = new Set(centreStudents.map(s => s.id));

            setStudents(centreStudents);

            // Map attendance — only for this centre's students
            const attMap = {};
            let present = 0, absent = 0, late = 0;

            allTodayRecords
                .filter(record => centreStudentIds.has(record.studentId))
                .forEach(record => {
                    const existing = attMap[record.studentId];
                    // Overwrite if it doesn't exist, OR if the new record has a checkInTime while the old didn't.
                    // This gracefully handles any old duplicate rows in the database.
                    if (!existing || (record.checkInTime && !existing.checkInTime)) {
                        attMap[record.studentId] = record;
                    } else if (record.checkOutTime && !attMap[record.studentId].checkOutTime) {
                        attMap[record.studentId].checkOutTime = record.checkOutTime;
                        if (record.totalTimeSpent) attMap[record.studentId].totalTimeSpent = record.totalTimeSpent;
                    }
                });

            Object.values(attMap).forEach(record => {
                if (record.status === 'PRESENT') present++;
                else if (record.status === 'ABSENT') absent++;
                else if (record.status === 'LATE') late++;
            });

            setAttendanceMap(attMap);
            setStats({
                present,
                absent,
                late,
                total: centreStudents.length
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

    const handleMarkAttendance = async (studentId, status, remarks = '') => {
        try {
            const today = new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
            const existingRecord = attendanceMap[studentId];

            const payload = {
                studentId,
                date: today,
                status,
                remarks: remarks || existingRecord?.remarks || null,
                checkInTime: existingRecord?.checkInTime || ((status === 'PRESENT' || status === 'LATE') ? getLocalTime() : null),
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

            updateStats(existingRecord?.status, status);
            toast.success(`Marked as ${status}`);
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error('Failed to update attendance');
        }
    };

    // Open remarks modal for statuses that need it
    const openRemarkModal = (studentId, status) => {
        const existing = attendanceMap[studentId];
        setRemarkText(existing?.remarks || '');
        setRemarkModal({ studentId, status });
    };

    const handleRemarkSubmit = async () => {
        if (!remarkModal) return;
        await handleMarkAttendance(remarkModal.studentId, remarkModal.status, remarkText);
        setRemarkModal(null);
        setRemarkText('');
    };

    const handleCheckIn = async (studentId) => {
        try {
            const today = new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
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
                        date: new Date().toLocaleDateString('en-CA'),
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

    const handleMarkAllCheckout = async () => {
        if (!window.confirm('Mark checkout for all currently checked-in students?')) return;

        try {
            const promises = filteredStudents
                .map(student => attendanceMap[student.id])
                .filter(record => record && (record.status === 'PRESENT' || record.status === 'LATE') && !record.checkOutTime)
                .map(record => attendanceAPI.checkOut(record.id));

            if (promises.length === 0) {
                toast('No students are currently checked in without a checkout.');
                return;
            }

            toast.loading('Checking out students...', { id: 'checkoutAll' });
            await Promise.all(promises);
            await fetchData();
            toast.success('Checked out all active students', { id: 'checkoutAll' });
        } catch (error) {
            console.error('Error marking all checkout:', error);
            toast.error('Failed to check out all students', { id: 'checkoutAll' });
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
        const matchesSearch =
            (student.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.registerNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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
        <>
            <Layout>
                <div className="bg-[#f8fafc] text-slate-900 font-display min-h-full transition-colors duration-200">
                    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                        {/* Header Section */}
                        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">Mark Attendance</h1>
                                <p className="text-slate-500 font-medium text-sm md:text-base">Manage student presence and session check-ins for today</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handleMarkAllPresent}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white hover:bg-primary/90 transition-all rounded-xl font-bold text-sm shadow-sm cursor-pointer whitespace-nowrap w-full sm:w-auto"
                                >
                                    <span className="material-symbols-outlined text-[20px]">done_all</span>
                                    Mark All Present
                                </button>
                                <button
                                    onClick={handleMarkAllCheckout}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 text-white hover:bg-slate-700 transition-all rounded-xl font-bold text-sm shadow-sm cursor-pointer whitespace-nowrap w-full sm:w-auto"
                                >
                                    <span className="material-symbols-outlined text-[20px]">logout</span>
                                    Mark All Checkout
                                </button>
                            </div>

                        </header>

                        {/* Mode Toggle Tabs */}
                        <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-6 w-full sm:w-fit mx-auto md:mx-0">
                            <button
                                onClick={() => setAttendanceMode('manual')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${attendanceMode === 'manual' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                                Manual Mode
                            </button>
                            <button
                                onClick={() => { setAttendanceMode('camera'); setCameraReady(false); setCameraStatus('Starting camera...'); }}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${attendanceMode === 'camera' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                Camera Mode
                            </button>
                           
                        </div>

                        {attendanceMode === 'camera' && (
                            <div className="bg-white border text-center border-slate-100 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Biometric Face Scanner</h2>
                                <p className="text-sm text-slate-500 mb-6 font-medium">Please face the camera to automatically mark your attendance or scan.</p>
                                
                                <div className="relative rounded-2xl overflow-hidden shadow-inner border-4 border-slate-50 bg-slate-900 w-full max-w-[600px] aspect-video">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                                        className="w-full h-full object-cover"
                                        mirrored={true}
                                        onUserMedia={() => { setCameraReady(true); setCameraStatus('Looking for a face...'); }}
                                        onUserMediaError={() => { setCameraReady(false); setCameraStatus('Camera access denied or unavailable'); }}
                                    />
                                    {/* Scanner overlay effect */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-[scan_3s_ease-in-out_infinite]" />
                                    
                                    {/* Camera status badge */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 border border-white/10">
                                        <div className={`h-2 w-2 rounded-full ${!cameraReady ? 'bg-amber-400 animate-pulse' : recognizing ? 'bg-primary animate-pulse' : 'bg-emerald-400'}`}></div>
                                        {cameraStatus}
                                    </div>
                                </div>
                            </div>
                        )}


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
                                        placeholder="Search by name or register number..."
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
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse border-b border-slate-100">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-b border-slate-100">
                                            <th className="px-6 py-4">Student Name</th>
                                            <th className="px-6 py-4">Standard</th>
                                            <th className="px-6 py-4">Status</th>
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
                                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group whitespace-nowrap">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-primary/10 text-primary shrink-0">
                                                                    {getInitials(student.studentName)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">{student.studentName}</p>
                                                                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                                                                        {student.registerNumber || 'No reg. number'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                                                {student.standard}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit gap-0.5">
                                                                {['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => (s === 'LATE' || s === 'LEAVE') ? openRemarkModal(student.id, s) : handleMarkAttendance(student.id, s)}
                                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                                                            status === s 
                                                                            ? (s === 'PRESENT' ? 'bg-emerald-500 text-white shadow-sm' : 
                                                                               s === 'ABSENT' ? 'bg-rose-500 text-white shadow-sm' : 
                                                                               s === 'LATE' ? 'bg-amber-500 text-white shadow-sm' : 
                                                                               'bg-blue-500 text-white shadow-sm') 
                                                                            : 'text-slate-400 hover:text-slate-600'
                                                                        }`}
                                                                    >
                                                                        {s.charAt(0) + s.slice(1).toLowerCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`text-sm font-medium font-mono ${record?.checkInTime ? 'text-slate-600' : 'text-slate-300'}`}>
                                                                {record?.checkInTime ? formatTime(record.checkInTime) : '--:-- --'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`text-sm font-medium font-mono ${record?.checkOutTime ? 'text-slate-600' : 'text-slate-300'}`}>
                                                                {record?.checkOutTime ? formatTime(record.checkOutTime) : '--:-- --'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {!record?.checkInTime ? (
                                                                    <button
                                                                        onClick={() => handleCheckIn(student.id)}
                                                                        className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm shadow-primary/20"
                                                                    >
                                                                        Check-in
                                                                    </button>
                                                                ) : !record?.checkOutTime ? (
                                                                    <button
                                                                        onClick={() => handleCheckOut(student.id)}
                                                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all cursor-pointer shadow-sm shadow-slate-800/20"
                                                                    >
                                                                        Check-out
                                                                    </button>
                                                                ) : (
                                                                    <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold border border-slate-100 uppercase tracking-wider">
                                                                        Finished
                                                                    </span>
                                                                )}

                                                                {record?.remarks && (
                                                                    <button 
                                                                        onClick={() => openRemarkModal(student.id, record.status)}
                                                                        className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 rounded-lg"
                                                                        title={record.remarks}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                                                                    </button>
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

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {currentStudents.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No students found matching your criteria.
                                    </div>
                                ) : (
                                    currentStudents.map(student => {
                                        const record = attendanceMap[student.id];
                                        const status = record?.status;

                                        return (
                                            <div key={student.id} className="p-4 space-y-4 active:bg-slate-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-primary/10 text-primary shrink-0">
                                                            {getInitials(student.studentName)}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-bold text-slate-900 text-sm truncate">{student.studentName}</p>
                                                            <p className="text-[10px] font-mono text-slate-400 font-bold">
                                                                {student.registerNumber || 'No Register Number'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                                                        {student.standard}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">In</p>
                                                            <p className="text-xs font-black text-slate-700 font-mono">
                                                                {record?.checkInTime ? formatTime(record.checkInTime) : '--:--'}
                                                            </p>
                                                        </div>
                                                        <span className={`material-symbols-outlined text-sm ${record?.checkInTime ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                            login
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Out</p>
                                                            <p className="text-xs font-black text-slate-700 font-mono">
                                                                {record?.checkOutTime ? formatTime(record.checkOutTime) : '--:--'}
                                                            </p>
                                                        </div>
                                                        <span className={`material-symbols-outlined text-sm ${record?.checkOutTime ? 'text-rose-500' : 'text-slate-300'}`}>
                                                            logout
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl w-full">
                                                        {[
                                                            { label: 'P', val: 'PRESENT', color: 'emerald' },
                                                            { label: 'A', val: 'ABSENT', color: 'rose' },
                                                            { label: 'L', val: 'LATE', color: 'amber' },
                                                            { label: 'LV', val: 'LEAVE', color: 'blue' }
                                                        ].map(btn => (
                                                            <button
                                                                key={btn.val}
                                                                onClick={() => btn.val === 'PRESENT' || btn.val === 'ABSENT' 
                                                                    ? handleMarkAttendance(student.id, btn.val) 
                                                                    : openRemarkModal(student.id, btn.val)}
                                                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                                                    status === btn.val 
                                                                    ? `bg-white text-${btn.color}-600 shadow-sm border border-slate-200` 
                                                                    : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {!record?.checkInTime ? (
                                                            <button
                                                                onClick={() => handleCheckIn(student.id)}
                                                                className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">login</span>
                                                                Check-in
                                                            </button>
                                                        ) : !record?.checkOutTime ? (
                                                            <button
                                                                onClick={() => handleCheckOut(student.id)}
                                                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                                                Check-out
                                                            </button>
                                                        ) : (
                                                            <div className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black text-center uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-2">
                                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                                Attendance Done
                                                            </div>
                                                        )}
                                                        
                                                        <button 
                                                            onClick={() => openRemarkModal(student.id, record?.status || 'PRESENT')}
                                                            className={`p-3 rounded-xl border transition-all ${record?.remarks ? 'bg-primary/10 border-primary/20 text-primary animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                                            title={record?.remarks || 'Add remark'}
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
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

            {/* ── Remarks Modal ── */}
            {remarkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Add Remark</h2>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Marking student as{' '}
                                    <span className={`font-semibold ${remarkModal.status === 'LATE' ? 'text-amber-600' : 'text-blue-600'}`}>
                                        {remarkModal.status}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => { setRemarkModal(null); setRemarkText(''); }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>
                        <textarea
                            autoFocus
                            rows={3}
                            value={remarkText}
                            onChange={e => setRemarkText(e.target.value)}
                            placeholder={remarkModal.status === 'LATE'
                                ? 'e.g. Came 15 mins late due to traffic...'
                                : 'e.g. Sick leave, family function...'}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleRemarkSubmit}
                                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                Save & Mark {remarkModal.status}
                            </button>
                            <button
                                onClick={() => { setRemarkModal(null); setRemarkText(''); }}
                                className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Attendance;
