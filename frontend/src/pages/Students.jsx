import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const Students = () => {
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showSingleStudentForm, setShowSingleStudentForm] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const pageSize = 10;

    // Filter states
    const [filters, setFilters] = useState({
        standard: '',
        gender: '',
        sortBy: '' // 'name-asc', 'name-desc'
    });

    const [formData, setFormData] = useState({
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
        joinedDate: new Date().toISOString().split('T')[0]
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Fetch students from backend
    useEffect(() => {
        fetchStudents(currentPage);
    }, [currentPage]);

    const fetchStudents = async (page) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8080/api/students?page=${page}&size=${pageSize}`);
            setStudents(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudentClick = () => {
        setShowChoiceModal(true);
    };

    const handleSingleStudent = () => {
        setShowChoiceModal(false);
        setShowSingleStudentForm(true);
    };

    const handleBulkUpload = () => {
        setShowChoiceModal(false);
        setShowBulkUpload(true);
    };

    const handleSingleStudentSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Adding student...');
            await axios.post('http://localhost:8080/api/students', formData);
            toast.success('Student added successfully!', { id: loadingToast });
            setShowSingleStudentForm(false);
            setFormData({
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
                joinedDate: new Date().toISOString().split('T')[0]
            });
            setCurrentPage(0);
            fetchStudents(0);
        } catch (error) {
            console.error('Error adding student:', error);
            toast.error(error.response?.data?.message || 'Failed to add student');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkUploadSubmit = async (file) => {
        if (!file) return;

        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Uploading students...');
            const uploadData = new FormData();
            uploadData.append('file', file);

            await axios.post('http://localhost:8080/api/students/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Students uploaded successfully!', { id: loadingToast });
            setShowBulkUpload(false);
            setCurrentPage(0);
            fetchStudents(0);
        } catch (error) {
            console.error('Error uploading students:', error);
            toast.error(error.response?.data?.message || 'Failed to upload students');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleApplyFilters = () => {
        setShowFilterModal(false);
        toast.success('Filters applied');
    };

    const handleClearFilters = () => {
        setFilters({
            standard: '',
            gender: '',
            sortBy: ''
        });
        toast.success('Filters cleared');
    };

    // View student handler
    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setShowViewModal(true);
    };

    // Edit student handlers
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
            joinedDate: student.joinedDate || new Date().toISOString().split('T')[0]
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Updating student...');
            await axios.put(`http://localhost:8080/api/students/${selectedStudent.id}`, formData);
            toast.success('Student updated successfully!', { id: loadingToast });
            setShowEditModal(false);
            setSelectedStudent(null);
            fetchStudents(currentPage);
        } catch (error) {
            console.error('Error updating student:', error);
            toast.error(error.response?.data?.message || 'Failed to update student');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete student handlers
    const handleDeleteStudent = (student) => {
        setSelectedStudent(student);
        setShowDeleteModal(true);
    };

    const confirmDeleteStudent = async () => {
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Deleting student...');
            await axios.delete(`http://localhost:8080/api/students/${selectedStudent.id}`);
            toast.success('Student deleted successfully!', { id: loadingToast });
            setShowDeleteModal(false);
            setSelectedStudent(null);
            fetchStudents(currentPage);
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error(error.response?.data?.message || 'Failed to delete student');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get active filter count
    const activeFilterCount = Object.values(filters).filter(val => val !== '').length;

    // Filter and sort students based on search term and filters
    let filteredStudents = students.filter(student => {
        // Search filter
        const matchesSearch =
            student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.batchName?.toLowerCase().includes(searchTerm.toLowerCase());

        // Standard filter
        const matchesStandard = !filters.standard || student.standard === filters.standard;

        // Gender filter
        const matchesGender = !filters.gender || student.gender === filters.gender;

        return matchesSearch && matchesStandard && matchesGender;
    });

    // Apply sorting
    if (filters.sortBy === 'name-asc') {
        filteredStudents = [...filteredStudents].sort((a, b) =>
            (a.studentName || '').localeCompare(b.studentName || '')
        );
    } else if (filters.sortBy === 'name-desc') {
        filteredStudents = [...filteredStudents].sort((a, b) =>
            (b.studentName || '').localeCompare(a.studentName || '')
        );
    }
    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto w-full">
                {/* Page Header */}
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
                                placeholder="Search student records..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Add Student Button */}
                        <button
                            onClick={handleAddStudentClick}
                            className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xl">add</span>
                            Add Student
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Name</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Standard</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Gender</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Batch</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                <span>Loading students...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            {searchTerm ? 'No students found matching your search.' : 'No students available. Add your first student!'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{student.studentName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{student.standard}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{student.gender || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{student.batchName || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleViewStudent(student)}
                                                        className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                        title="View Details"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditStudent(student)}
                                                        className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                        title="Edit Student"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStudent(student)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Delete Student"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
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

                {/* Pagination */}
                <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                        Showing page {currentPage + 1} of {totalPages} ({totalElements} total students)
                    </p>
                    <nav className="inline-flex items-center gap-1">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 0}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${currentPage === 0
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span> Prev
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages - 1}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${currentPage >= totalPages - 1
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Next <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </nav>
                </div>

                {/* Choice Modal */}
                {showChoiceModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Add Student</h2>
                            <p className="text-slate-600 mb-6">How would you like to add students?</p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleSingleStudent}
                                    className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-slate-800">Single Student</h3>
                                        <p className="text-sm text-slate-500">Add one student manually</p>
                                    </div>
                                </button>

                                <button
                                    onClick={handleBulkUpload}
                                    className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-slate-800">Bulk Upload</h3>
                                        <p className="text-sm text-slate-500">Upload Excel file with multiple students</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowChoiceModal(false)}
                                className="mt-6 w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Single Student Form Modal */}
                {showSingleStudentForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fadeIn">
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
                                <h2 className="text-xl font-bold text-slate-800">Add New Student</h2>
                                <button
                                    onClick={() => setShowSingleStudentForm(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-600">close</span>
                                </button>
                            </div>


                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1 p-6">
                                <form className="space-y-6" onSubmit={handleSingleStudentSubmit}>
                                    {/* Student Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Student Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Student Name *</label>
                                                <input
                                                    type="text"
                                                    name="studentName"
                                                    value={formData.studentName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    placeholder="Enter student name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    required
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Standard</label>
                                                <select
                                                    name="standard"
                                                    value={formData.standard}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                >
                                                    <option value="">Select Standard</option>
                                                    {[...Array(12)].map((_, i) => (
                                                        <option key={i + 1} value={`${i + 1}${getOrdinal(i + 1)}`}>{i + 1}{getOrdinal(i + 1)} Standard</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                                                <input
                                                    type="text"
                                                    name="schoolName"
                                                    value={formData.schoolName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter school name"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Parent Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Name</label>
                                                <input
                                                    type="text"
                                                    name="parentName"
                                                    value={formData.parentName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter parent name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="parentPhone"
                                                    value={formData.parentPhone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter phone number"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Alternative Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="parentAltPhone"
                                                    value={formData.parentAltPhone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="Enter alternative number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Batch Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Batch Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name</label>
                                                <input
                                                    type="text"
                                                    name="batchName"
                                                    value={formData.batchName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="e.g. Morning Batch"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        name="batchStartTime"
                                                        value={formData.batchStartTime}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        name="batchEndTime"
                                                        value={formData.batchEndTime}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                            placeholder="Enter student's full address"
                                        ></textarea>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                                        <button
                                            type="button"
                                            onClick={() => setShowSingleStudentForm(false)}
                                            className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Adding...' : 'Save Student'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Upload Modal */}
                {showBulkUpload && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Bulk Upload Students</h2>
                                <button
                                    onClick={() => setShowBulkUpload(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-600">close</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-blue-600">info</span>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold mb-1">Excel Format Required</p>
                                            <p>Please ensure your Excel file contains columns: Name, Standard, DOB, Batch</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        id="excel-upload"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) handleBulkUploadSubmit(file);
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <label htmlFor="excel-upload" className="cursor-pointer">
                                        <span className="material-symbols-outlined text-5xl text-slate-400 mb-3 block">upload_file</span>
                                        <p className="text-slate-600 font-medium mb-1">
                                            {isSubmitting ? 'Uploading...' : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-sm text-slate-500">Excel files only (.xlsx, .xls)</p>
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('excel-upload');
                                        if (input.files.length > 0) {
                                            handleBulkUploadSubmit(input.files[0]);
                                        } else {
                                            toast.error('Please select a file first');
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Uploading...' : 'Upload Students'}
                                </button>

                                <button
                                    onClick={() => setShowBulkUpload(false)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Modal */}
                {showFilterModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Filter Students</h2>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-600">close</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Standard Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Filter by Standard
                                    </label>
                                    <select
                                        value={filters.standard}
                                        onChange={(e) => setFilters(prev => ({ ...prev, standard: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    >
                                        <option value="">All Standards</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={`${i + 1}${getOrdinal(i + 1)}`}>
                                                {i + 1}{getOrdinal(i + 1)} Standard
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Gender Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Filter by Gender
                                    </label>
                                    <select
                                        value={filters.gender}
                                        onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    >
                                        <option value="">All Genders</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Sort by Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Sort by Name
                                    </label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    >
                                        <option value="">No Sorting</option>
                                        <option value="name-asc">Name (A to Z)</option>
                                        <option value="name-desc">Name (Z to A)</option>
                                    </select>
                                </div>

                                {/* Active Filters Display */}
                                {activeFilterCount > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-blue-800">
                                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                                            </span>
                                            <button
                                                onClick={handleClearFilters}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Student Modal */}
                {showViewModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Student Details</h2>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-600">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Student Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b">Student Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Student Name</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.studentName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Gender</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.gender || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Standard</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.standard || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">School Name</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.schoolName || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Parent Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b">Parent Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Parent Name</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.parentName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Primary Phone</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.parentPhone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Alternative Phone</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.parentAltPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Batch Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b">Batch Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Batch Name</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedStudent.batchName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Batch Timing</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedStudent.batchStartTime && selectedStudent.batchEndTime
                                                    ? `${selectedStudent.batchStartTime} - ${selectedStudent.batchEndTime}`
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b">Address</h3>
                                    <p className="text-sm text-slate-700">{selectedStudent.address || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Student Modal */}
                {showEditModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fadeIn">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
                                <h2 className="text-xl font-bold text-slate-800">Edit Student</h2>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-600">close</span>
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-6">
                                <form className="space-y-6" onSubmit={handleUpdateStudent}>
                                    {/* Student Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Student Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Student Name *</label>
                                                <input
                                                    type="text"
                                                    name="studentName"
                                                    value={formData.studentName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    required
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Standard</label>
                                                <select
                                                    name="standard"
                                                    value={formData.standard}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                >
                                                    <option value="">Select Standard</option>
                                                    {[...Array(12)].map((_, i) => (
                                                        <option key={i + 1} value={`${i + 1}${getOrdinal(i + 1)}`}>{i + 1}{getOrdinal(i + 1)} Standard</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                                                <input
                                                    type="text"
                                                    name="schoolName"
                                                    value={formData.schoolName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Parent Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Name</label>
                                                <input
                                                    type="text"
                                                    name="parentName"
                                                    value={formData.parentName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="parentPhone"
                                                    value={formData.parentPhone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Alternative Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="parentAltPhone"
                                                    value={formData.parentAltPhone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Batch Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Batch Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name</label>
                                                <input
                                                    type="text"
                                                    name="batchName"
                                                    value={formData.batchName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        name="batchStartTime"
                                                        value={formData.batchStartTime}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        name="batchEndTime"
                                                        value={formData.batchEndTime}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setSelectedStudent(null);
                                            }}
                                            className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Updating...' : 'Update Student'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                            <div className="flex items-center justify-center mb-4">
                                <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-600 text-4xl">warning</span>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Student</h2>
                            <p className="text-slate-600 text-center mb-6">
                                Are you sure you want to delete <span className="font-bold">{selectedStudent.studentName}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteStudent}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout >
    );
};

const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

export default Students;
