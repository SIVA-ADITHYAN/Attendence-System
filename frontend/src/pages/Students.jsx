import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { faceAPI } from '../services/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useUser } from '../context/UserContext';
import Webcam from 'react-webcam';

const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

/**
 * Mirrors the backend batch-code + register number format.
 * Morning → MG, Evening → EVE, else first 3 letters.
 */
const getPreviewRegisterNumber = (batchName, joinedDate) => {
    const yy = joinedDate
        ? String(new Date(joinedDate).getFullYear()).slice(-2)
        : String(new Date().getFullYear()).slice(-2);

    let code = 'STD';
    if (batchName) {
        const lower = batchName.toLowerCase();
        if (lower.includes('morning')) code = 'MG';
        else if (lower.includes('evening')) code = 'EV';
        else {
            const stripped = batchName.replace(/[^a-zA-Z]/g, '');
            code = stripped.substring(0, Math.min(3, stripped.length)).toUpperCase() || 'STD';
        }
    }
    return `${yy}${code}###`;  // ### = sequence assigned by backend
};

const emptyForm = {
    studentName: '',
    gender: '',
    dateOfBirth: '',
    schoolName: '',
    standard: '',
    parentName: '',
    parentPhone: '',
    parentAltPhone: '',
    batchName: '',
    batchStartTime: '',
    batchEndTime: '',
    address: '',
    joinedDate: new Date().toISOString().split('T')[0],
};

const Students = () => {
    const { user } = useUser();
    const coachingCentreId = user?.coachingCentreId;

    // --- Modal states ---
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showSingleStudentForm, setShowSingleStudentForm] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showWebcamModal, setShowWebcamModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const webcamRef = React.useRef(null);
    const [registeringFace, setRegisteringFace] = useState(false);
    const [captureCount, setCaptureCount] = useState(0);  // burst progress 0–5

    // --- Data states ---
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // --- Filter states ---
    const [filters, setFilters] = useState({ standard: '', gender: '', sortBy: '' });

    // --- Form state ---
    const [formData, setFormData] = useState(emptyForm);

    // --- Excel upload state ---
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // ─── Fetch scoped to coaching centre ────────────────────────────────────
    useEffect(() => {
        if (coachingCentreId) {
            fetchStudents(currentPage);
        }
    }, [currentPage, coachingCentreId]);

    const fetchStudents = async (page) => {
        if (!coachingCentreId) return;
        try {
            setLoading(true);
            const response = await api.get(
                `/students/coaching-centre/${coachingCentreId}?page=${page}&size=${pageSize}`
            );
            setStudents(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Single student submit ───────────────────────────────────────────────
    const handleSingleStudentSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Adding student...');
            await api.post('/students', {
                ...formData,
                coachingCentreId,
            });
            toast.success('Student added successfully!', { id: loadingToast });
            setShowSingleStudentForm(false);
            setFormData(emptyForm);
            setCurrentPage(0);
            fetchStudents(0);
        } catch (error) {
            console.error('Error adding student:', error);
            toast.error(error.response?.data?.message || 'Failed to add student');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Download sample Excel template ─────────────────────────────────────────
    const downloadTemplate = () => {
        const headers = [
            'studentName', 'gender', 'dateOfBirth', 'schoolName', 'standard',
            'parentName', 'parentPhone', 'parentAltPhone', 'batchName',
            'batchStartTime', 'batchEndTime', 'tutorId', 'address', 'joinedDate'
        ];

        const rows = [
            ['Arun Kumar', 'Male', '2010-05-14', 'Sri Vidya Matric School', '8th', 'Rajan Kumar', '9876543210', '9123456780', 'Morning Batch', '09:00', '11:00', '', '12 Anna Nagar, Chennai', '2024-06-01'],
            ['Priya Lakshmi', 'Female', '2011-08-22', 'KV School', '7th', 'Sundar Raj', '9845001234', '', 'Afternoon Batch', '14:00', '16:00', '', '45 Gandhi St, Coimbatore', '2024-06-01'],
            ['Mohammed Farhan', 'Male', '2009-12-01', 'Pioneer School', '9th', 'Abdul Kareem', '9887766554', '9887766553', 'Morning Batch', '09:00', '11:00', '', '8 Civil Lines, Madurai', '2024-07-15'],
            ['Deepika S', 'Female', '2012-03-19', 'Lotus School', '6th', 'Suresh S', '9765432101', '', 'Evening Batch', '17:00', '19:00', '', '77 LB Road, Trichy', '2024-08-01'],
            ['Karthi Velan', 'Male', '2008-11-05', 'Govt Higher Secondary', '10th', 'Velan P', '9654321098', '9654321099', 'Morning Batch', '09:00', '11:00', '', '3 Nehru Nagar, Salem', '2024-09-10'],
        ];

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample_students.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Template downloaded! Open in Excel.');
    };

    // ─── Bulk upload ─────────────────────────────────────────────────────────
    const handleBulkUploadSubmit = async (file) => {
        if (!file) { toast.error('Please select a file first'); return; }
        if (!coachingCentreId) { toast.error('No coaching centre linked to your account'); return; }
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Uploading students...');
            const data = new FormData();
            data.append('file', file);
            await api.post(`/students/upload?coachingCentreId=${coachingCentreId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Students uploaded successfully!', { id: loadingToast });
            setShowBulkUpload(false);
            setSelectedFile(null);
            fetchStudents(0);
        } catch (error) {
            console.error('Error uploading students:', error);
            toast.error(error.response?.data?.message || 'Failed to upload students');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Edit student ────────────────────────────────────────────────────────
    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setFormData({
            studentName: student.studentName || '',
            gender: student.gender || '',
            dateOfBirth: student.dateOfBirth || '',
            schoolName: student.schoolName || '',
            standard: student.standard || '',
            parentName: student.parentName || '',
            parentPhone: student.parentPhone || '',
            parentAltPhone: student.parentAltPhone || '',
            batchName: student.batchName || '',
            batchStartTime: student.batchStartTime || '',
            batchEndTime: student.batchEndTime || '',
            address: student.address || '',
            joinedDate: student.joinedDate || new Date().toISOString().split('T')[0],
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Updating student...');
            await api.put(`/students/${selectedStudent.id}`, {
                ...formData,
                coachingCentreId,
            });
            toast.success('Student updated!', { id: loadingToast });
            setShowEditModal(false);
            setSelectedStudent(null);
            fetchStudents(currentPage);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update student');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Delete student ──────────────────────────────────────────────────────
    const confirmDeleteStudent = async () => {
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Deleting student...');
            await api.delete(`/students/${selectedStudent.id}`);
            toast.success('Student deleted!', { id: loadingToast });
            setShowDeleteModal(false);
            setSelectedStudent(null);
            fetchStudents(currentPage);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete student');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Register Face (5-frame Multi-Frame Fusion) ───────────────────────────
    const handleRegisterFace = async () => {
        if (!webcamRef.current || !selectedStudent) return;

        const BURST_COUNT = 5;   // number of frames to capture
        const BURST_DELAY = 400; // ms between captures

        try {
            setRegisteringFace(true);
            setCaptureCount(0);
            const loadingToast = toast.loading('Capturing 5 frames...');

            // Capture BURST_COUNT frames with a small delay between each
            const images = [];
            for (let i = 0; i < BURST_COUNT; i++) {
                const shot = webcamRef.current.getScreenshot();
                if (shot) images.push(shot);
                setCaptureCount(i + 1);
                await new Promise(r => setTimeout(r, BURST_DELAY));
            }

            if (images.length === 0) {
                toast.error('Failed to capture any image. Please try again.', { id: loadingToast });
                return;
            }

            toast.loading(`Registering face (${images.length} frames)...`, { id: loadingToast });

            await faceAPI.registerFused(selectedStudent.id, images);

            toast.success(`Face registered successfully! (${images.length} frames averaged)`, { id: loadingToast });
            setShowWebcamModal(false);
            setSelectedStudent(null);
            fetchStudents(currentPage);
        } catch (error) {
            console.error('Error registering face:', error);
            const msg = error.response?.data?.error || 'Failed to register face';
            toast.error(msg);
        } finally {
            setRegisteringFace(false);
            setCaptureCount(0);
        }
    };

    // ─── Filtering & sorting ─────────────────────────────────────────────────
    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    let filteredStudents = (students || []).filter(student => {
        const matchesSearch =
            student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.batchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStandard = !filters.standard || student.standard === filters.standard;
        const matchesGender = !filters.gender || student.gender === filters.gender;
        return matchesSearch && matchesStandard && matchesGender;
    });

    if (filters.sortBy === 'name-asc') {
        filteredStudents = [...filteredStudents].sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    } else if (filters.sortBy === 'name-desc') {
        filteredStudents = [...filteredStudents].sort((a, b) => (b.studentName || '').localeCompare(a.studentName || ''));
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ─── Guard: no coachingCentreId ──────────────────────────────────────────
    if (!coachingCentreId) {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-64">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">school</span>
                        <p className="text-slate-600 font-medium">No coaching centre linked to your account.</p>
                        <p className="text-slate-400 text-sm mt-1">Please contact your administrator.</p>
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
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 mb-6">
                        Student Information
                    </h1>

                    {/* Controls Bar */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200/60">
                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className="relative flex items-center justify-center p-2.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                            <span className="material-symbols-outlined">filter_list</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Search Bar */}
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Search by name, reg. number, standard or batch..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Add Student Button */}
                        <button
                            onClick={() => setShowChoiceModal(true)}
                            className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xl">add</span>
                            Add Student
                        </button>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">#</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Reg. No.</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Standard</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Gender</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Batch</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                <span className="text-slate-500">Loading students...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-5xl text-slate-300">group</span>
                                                <p className="text-slate-500 font-medium">
                                                    {searchTerm || activeFilterCount > 0
                                                        ? 'No students match your search/filter.'
                                                        : 'No students yet. Add your first student!'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-400 text-center font-medium">
                                                {currentPage * pageSize + index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                                                        {(student.studentName || '?').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{student.studentName}</p>
                                                        <p className="text-xs text-slate-400">{student.schoolName || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-mono font-semibold text-slate-700">
                                                    {student.registerNumber || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 text-center">
                                                {student.standard ? `Grade ${student.standard}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                    student.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {student.gender || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 text-center">
                                                {student.batchName || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => { setSelectedStudent(student); setShowViewModal(true); }}
                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditStudent(student)}
                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Edit Student"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Student"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStudent(student); setShowWebcamModal(true); }}
                                                        className={`p-1.5 rounded-lg transition-colors ${student.faceRegistered ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}
                                                        title={student.faceRegistered ? "Update Registered Face" : "Register Face"}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {student.faceRegistered ? 'how_to_reg' : 'add_a_photo'}
                                                        </span>
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

                {/* ── Pagination ── */}
                {totalPages > 0 && (
                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-500">
                            Showing page <span className="font-semibold">{currentPage + 1}</span> of <span className="font-semibold">{totalPages}</span> &nbsp;·&nbsp; {totalElements} total students
                        </p>
                        <nav className="inline-flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${currentPage === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span> Prev
                            </button>
                            <span className="px-4 py-2 text-sm text-slate-600">Page {currentPage + 1} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${currentPage >= totalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Next <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </nav>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* MODALS */}
                {/* ══════════════════════════════════════════════════════════ */}

                {/* ── Choice Modal ── */}
                {showChoiceModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Add Student</h2>
                            <p className="text-slate-500 text-sm mb-6">Choose how you'd like to add students.</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => { setShowChoiceModal(false); setShowSingleStudentForm(true); setFormData(emptyForm); }}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800">Single Student</h3>
                                        <p className="text-sm text-slate-500">Add one student manually via form</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setShowChoiceModal(false); setShowBulkUpload(true); setSelectedFile(null); }}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800">Bulk Upload</h3>
                                        <p className="text-sm text-slate-500">Upload an Excel file with multiple students</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowChoiceModal(false)}
                                className="mt-5 w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Webcam Face Registration Modal ── */}
                {showWebcamModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn flex flex-col items-center">
                            <div className="flex items-center justify-between w-full mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Register Face</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Capturing face for <span className="font-semibold">{selectedStudent.studentName}</span></p>
                                </div>
                                <button onClick={() => { setShowWebcamModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>

                            <div className="relative rounded-xl overflow-hidden shadow-inner border border-slate-200 bg-slate-100 w-full aspect-video mb-6">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                                    className="w-full h-full object-cover"
                                    mirrored={true}
                                />
                            </div>

                            <div className="text-center bg-blue-50 text-blue-800 p-3 rounded-xl mb-6 text-sm w-full">
                                <p className="font-medium flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                                    Ensure good lighting and only one visible face.
                                </p>
                            </div>

                                       {/* Burst capture progress */}
                            {registeringFace && (
                                <div className="w-full mb-3">
                                    <div className="flex justify-between text-xs text-slate-500 font-medium mb-1">
                                        <span>Capturing frames...</span>
                                        <span>{captureCount} / 5</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(captureCount / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => { setShowWebcamModal(false); setSelectedStudent(null); }}
                                    disabled={registeringFace}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRegisterFace}
                                    disabled={registeringFace}
                                    className="flex-[2] py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {registeringFace ? 'Processing...' : <><span className="material-symbols-outlined text-[20px]">camera</span> Capture & Register</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Single Student Form ── */}
                {showSingleStudentForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fadeIn">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Add New Student</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Fill in the student details below</p>
                                </div>
                                <button onClick={() => setShowSingleStudentForm(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-6">
                                <form onSubmit={handleSingleStudentSubmit} className="space-y-8">

                                    {/* Student Info */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                                            Student Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student Name *</label>
                                                <input type="text" name="studentName" value={formData.studentName} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter student name" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender *</label>
                                                <select name="gender" value={formData.gender} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required>
                                                    <option value="">Select gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth *</label>
                                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Standard *</label>
                                                <select name="standard" value={formData.standard} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required>
                                                    <option value="">Select Standard</option>
                                                    {[...Array(12)].map((_, i) => (
                                                        <option key={i + 1} value={`${i + 1}${getOrdinal(i + 1)}`}>
                                                            {i + 1}{getOrdinal(i + 1)} Standard
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Name</label>
                                                <input type="text" name="schoolName" value={formData.schoolName} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter school name" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent Info */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[20px]">family_restroom</span>
                                            Parent / Guardian Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Name *</label>
                                                <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter parent name" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Phone *</label>
                                                <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter phone number" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alternative Phone</label>
                                                <input type="tel" name="parentAltPhone" value={formData.parentAltPhone} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter alternative number" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Batch Info */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                                            Batch Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch Name</label>
                                                <input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="e.g. Morning Batch" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
                                                <input type="time" name="batchStartTime" value={formData.batchStartTime} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                                <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wide">AM / PM Format</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Time</label>
                                                <input type="time" name="batchEndTime" value={formData.batchEndTime} onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                                <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wide">AM / PM Format</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Register Number Preview */}
                                    {formData.batchName && (
                                        <div className="flex items-center justify-between py-2">
                                            <p className="text-sm text-slate-500 font-semibold">Register No. Preview</p>
                                            <p className="font-mono font-semibold text-slate-700 text-sm">
                                                {getPreviewRegisterNumber(formData.batchName, formData.joinedDate)}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Joined Date</label>
                                            <input type="date" name="joinedDate" value={formData.joinedDate} onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3"
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                                placeholder="Enter student's address" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                        <button type="button" onClick={() => setShowSingleStudentForm(false)}
                                            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={isSubmitting}
                                            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2">
                                            {isSubmitting ? 'Saving...' : <><span className="material-symbols-outlined text-[18px]">save</span> Save Student</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Bulk Upload Modal ── */}
                {showBulkUpload && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Bulk Upload Students</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Upload an Excel file to add multiple students at once</p>
                                </div>
                                <button onClick={() => setShowBulkUpload(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>

                            {/* Info box + Download Template */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                                <div className="flex gap-3 items-start">
                                    <span className="material-symbols-outlined text-blue-500 shrink-0">info</span>
                                    <div className="text-sm text-blue-800 flex-1">
                                        <p className="font-semibold mb-1">Excel / CSV Format Required</p>
                                        <p className="font-mono bg-blue-100 px-1 rounded text-xs break-all">
                                            studentName, gender, dateOfBirth, schoolName, standard, parentName, parentPhone, parentAltPhone, batchName, batchStartTime, batchEndTime, tutorId, address, joinedDate
                                        </p>
                                        <p className="mt-2 text-xs font-medium text-blue-700">
                                            ⚠️ <strong>Note on Time Fields:</strong> Use 24-hour format for times in Excel (e.g., type <span className="font-semibold bg-white/50 px-1 rounded">17:00</span> for 5:00 PM).
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                    Download Sample Template
                                </button>
                            </div>

                            {/* Drop Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    const file = e.dataTransfer.files[0];
                                    if (file) setSelectedFile(file);
                                }}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}`}
                            >
                                <input type="file" accept=".xlsx,.xls,.csv" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={(e) => { const f = e.target.files[0]; if (f) setSelectedFile(f); }}
                                    disabled={isSubmitting} />
                                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">upload_file</span>
                                {selectedFile ? (
                                    <div>
                                        <p className="font-semibold text-slate-700">{selectedFile.name}</p>
                                        <p className="text-sm text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-semibold text-slate-600">Click to upload or drag & drop</p>
                                        <p className="text-sm text-slate-400 mt-1">Excel & CSV files (.xlsx, .xls, .csv)</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => handleBulkUploadSubmit(selectedFile)}
                                    disabled={isSubmitting || !selectedFile}
                                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Uploading...' : <><span className="material-symbols-outlined text-[18px]">upload</span> Upload Students</>}
                                </button>
                                <button onClick={() => setShowBulkUpload(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Filter Modal ── */}
                {showFilterModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Filter Students</h2>
                                <button onClick={() => setShowFilterModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Standard</label>
                                    <select value={filters.standard} onChange={(e) => setFilters(p => ({ ...p, standard: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                        <option value="">All Standards</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={`${i + 1}${getOrdinal(i + 1)}`}>{i + 1}{getOrdinal(i + 1)} Standard</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Gender</label>
                                    <select value={filters.gender} onChange={(e) => setFilters(p => ({ ...p, gender: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                        <option value="">All Genders</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sort by Name</label>
                                    <select value={filters.sortBy} onChange={(e) => setFilters(p => ({ ...p, sortBy: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                        <option value="">No Sorting</option>
                                        <option value="name-asc">Name (A → Z)</option>
                                        <option value="name-desc">Name (Z → A)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => { setFilters({ standard: '', gender: '', sortBy: '' }); setShowFilterModal(false); }}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                    Clear All
                                </button>
                                <button onClick={() => setShowFilterModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-colors">
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── View Student Modal ── */}
                {showViewModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                            {/* Banner */}
                            <div className="bg-primary h-20 relative rounded-t-2xl flex items-end px-6">
                                <div className="absolute -bottom-8 left-6 size-16 rounded-2xl bg-primary border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {(selectedStudent.studentName || '?').substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <div className="pt-12 px-6 pb-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">{selectedStudent.studentName}</h2>
                                        <p className="text-sm text-slate-500">{selectedStudent.schoolName || 'School not set'}</p>
                                    </div>
                                    <button onClick={() => { setShowViewModal(false); setSelectedStudent(null); }}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-slate-400">close</span>
                                    </button>
                                </div>

                                {/* Register Number */}
                                {selectedStudent.registerNumber && (
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Register No.</span>
                                        <span className="font-mono font-semibold text-slate-700 text-sm">
                                            {selectedStudent.registerNumber}
                                        </span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Gender', value: selectedStudent.gender },
                                        { label: 'Date of Birth', value: selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null },
                                        { label: 'Standard', value: selectedStudent.standard ? `Grade ${selectedStudent.standard}` : null },
                                        { label: 'Batch', value: selectedStudent.batchName },
                                        { label: 'Batch Timing', value: selectedStudent.batchStartTime && selectedStudent.batchEndTime ? `${selectedStudent.batchStartTime} – ${selectedStudent.batchEndTime}` : null },
                                        { label: 'Joined Date', value: selectedStudent.joinedDate },
                                        { label: 'Parent Name', value: selectedStudent.parentName },
                                        { label: 'Primary Phone', value: selectedStudent.parentPhone },
                                        { label: 'Alt Phone', value: selectedStudent.parentAltPhone },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                                            <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
                                        </div>
                                    ))}
                                    {selectedStudent.address && (
                                        <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Address</p>
                                            <p className="text-sm font-semibold text-slate-700">{selectedStudent.address}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => { setShowViewModal(false); handleEditStudent(selectedStudent); }}
                                        className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                    </button>
                                    <button onClick={() => { setShowViewModal(false); setSelectedStudent(null); }}
                                        className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Edit Student Modal ── */}
                {showEditModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fadeIn">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Edit Student</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Editing: {selectedStudent.studentName}</p>
                                </div>
                                <button onClick={() => { setShowEditModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 p-6">
                                <form onSubmit={handleUpdateStudent} className="space-y-6">
                                    {/* Register Number — read-only */}
                                    {selectedStudent.registerNumber && (
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <p className="text-sm text-slate-500 font-semibold">Register No.</p>
                                            <p className="font-mono font-semibold text-slate-700 text-sm">{selectedStudent.registerNumber}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Student Name *', name: 'studentName', type: 'text', required: true },
                                            { label: 'Date of Birth *', name: 'dateOfBirth', type: 'date', required: true },
                                            { label: 'School Name', name: 'schoolName', type: 'text' },
                                            { label: 'Parent Name *', name: 'parentName', type: 'text', required: true },
                                            { label: 'Primary Phone *', name: 'parentPhone', type: 'tel', required: true },
                                            { label: 'Alt Phone', name: 'parentAltPhone', type: 'tel' },
                                            { label: 'Batch Name', name: 'batchName', type: 'text' },
                                            { label: 'Start Time', name: 'batchStartTime', type: 'time' },
                                            { label: 'End Time', name: 'batchEndTime', type: 'time' },
                                            { label: 'Joined Date', name: 'joinedDate', type: 'date' },
                                        ].map(({ label, name, type, required }) => (
                                            <div key={name}>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                                                <input type={type} name={name} value={formData[name]} onChange={handleInputChange} required={required}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender *</label>
                                            <select name="gender" value={formData.gender} onChange={handleInputChange} required
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Standard *</label>
                                            <select name="standard" value={formData.standard} onChange={handleInputChange} required
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                                <option value="">Select Standard</option>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={`${i + 1}${getOrdinal(i + 1)}`}>{i + 1}{getOrdinal(i + 1)} Standard</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3"
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                        <button type="button" onClick={() => { setShowEditModal(false); setSelectedStudent(null); }}
                                            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={isSubmitting}
                                            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all">
                                            {isSubmitting ? 'Updating...' : <><span className="material-symbols-outlined text-[18px]">save</span> Update Student</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Delete Confirm Modal ── */}
                {showDeleteModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn text-center">
                            <div className="size-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Student?</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Are you sure you want to delete <span className="font-bold text-slate-700">{selectedStudent.studentName}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={confirmDeleteStudent} disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default Students;
