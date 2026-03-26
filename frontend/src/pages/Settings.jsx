import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const Settings = () => {
    const { user, login } = useUser();
    const [activeTab, setActiveTab] = useState('tutors');
    const [tutors, setTutors] = useState([]);
    const [loadingTutors, setLoadingTutors] = useState(false);

    // Add Tutor form state
    const [tutorForm, setTutorForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
    });
    const [tutorLoading, setTutorLoading] = useState(false);
    const [tutorMsg, setTutorMsg] = useState(null);

    // Edit Centre form state
    const [centreForm, setCentreForm] = useState({
        centreName: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
    });
    const [centreLoading, setCentreLoading] = useState(false);
    const [centreMsg, setCentreMsg] = useState(null);

    // Load tutors and centre info on mount
    useEffect(() => {
        if (user?.coachingCentreId) {
            fetchTutors();
            fetchCentre();
        }
    }, [user]);

    const fetchTutors = async () => {
        setLoadingTutors(true);
        try {
            const res = await api.get(`/users/coaching-centre/${user.coachingCentreId}/tutors`);
            setTutors(res.data);
        } catch (e) {
            console.error('Failed to fetch tutors', e);
        }
        setLoadingTutors(false);
    };

    const fetchCentre = async () => {
        try {
            const res = await api.get(`/coaching-centres/${user.coachingCentreId}`);
            const data = res.data;
            setCentreForm({
                centreName: data.centreName || '',
                ownerName: data.ownerName || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
            });
        } catch (e) {
            console.error('Failed to fetch centre', e);
        }
    };

    const handleAddTutor = async (e) => {
        e.preventDefault();
        setTutorLoading(true);
        setTutorMsg(null);
        try {
            await api.post(`/users`, {
                ...tutorForm,
                role: 'TUTOR',
                coachingCentreId: user.coachingCentreId,
            });
            setTutorMsg({ type: 'success', text: 'Tutor added successfully!' });
            setTutorForm({ fullName: '', email: '', password: '', phoneNumber: '' });
            fetchTutors();
        } catch (e) {
            const errText = typeof e.response?.data === 'string' ? e.response.data : 'Network config error';
            setTutorMsg({ type: 'error', text: 'Failed to add tutor: ' + errText });
        }
        setTutorLoading(false);
    };

    const handleDeleteTutor = async (tutorId) => {
        if (!window.confirm('Are you sure you want to remove this tutor?')) return;
        try {
            await api.delete(`/users/${tutorId}`);
            fetchTutors();
        } catch (e) {
            console.error('Failed to delete tutor', e);
        }
    };

    const handleUpdateCentre = async (e) => {
        e.preventDefault();
        setCentreLoading(true);
        setCentreMsg(null);
        try {
            await api.put(`/coaching-centres/${user.coachingCentreId}`, centreForm);
            setCentreMsg({ type: 'success', text: 'Coaching centre updated successfully!' });
            login({ ...user, centreName: centreForm.centreName });
        } catch (e) {
            const errText = typeof e.response?.data === 'string' ? e.response.data : 'Network config error';
            setCentreMsg({ type: 'error', text: 'Update failed: ' + errText });
        }
        setCentreLoading(false);
    };

    const tabClass = (tab) =>
        `px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === tab
            ? 'bg-primary text-white shadow-md shadow-primary/30'
            : 'text-slate-600 hover:bg-slate-100'
        }`;

    return (
        <Layout>
            <div className="p-6 max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your coaching centre and tutors</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl w-fit">
                    <button id="tab-tutors" className={tabClass('tutors')} onClick={() => setActiveTab('tutors')}>
                        <span className="material-symbols-outlined text-[18px]">group_add</span>
                        Manage Tutors
                    </button>
                    <button id="tab-centre" className={tabClass('centre')} onClick={() => setActiveTab('centre')}>
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        Edit Centre
                    </button>
                </div>

                {/* ── TUTORS TAB ── */}
                {activeTab === 'tutors' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Add Tutor Card */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Add New Tutor</h2>
                            <p className="text-sm text-slate-500 mb-5">Create a tutor account for your coaching centre</p>
                            {tutorMsg && (
                                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${tutorMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    <span className="material-symbols-outlined text-[18px]">{tutorMsg.type === 'success' ? 'check_circle' : 'error'}</span>
                                    {tutorMsg.text}
                                </div>
                            )}
                            <form onSubmit={handleAddTutor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Full Name</label>
                                    <input
                                        id="tutor-fullName"
                                        type="text"
                                        required
                                        placeholder="e.g. Ravi Kumar"
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={tutorForm.fullName}
                                        onChange={e => setTutorForm({ ...tutorForm, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                                    <input
                                        id="tutor-email"
                                        type="email"
                                        required
                                        placeholder="tutor@example.com"
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={tutorForm.email}
                                        onChange={e => setTutorForm({ ...tutorForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone Number</label>
                                    <input
                                        id="tutor-phone"
                                        type="tel"
                                        required
                                        placeholder="9876543210"
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={tutorForm.phoneNumber}
                                        onChange={e => setTutorForm({ ...tutorForm, phoneNumber: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                                    <input
                                        id="tutor-password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={tutorForm.password}
                                        onChange={e => setTutorForm({ ...tutorForm, password: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end pt-2">
                                    <button
                                        id="add-tutor-btn"
                                        type="submit"
                                        disabled={tutorLoading}
                                        className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-primary/30 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                                        {tutorLoading ? 'Adding...' : 'Add Tutor'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Tutors List */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Your Tutors</h2>
                            {loadingTutors ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Loading tutors...</div>
                            ) : tutors.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <span className="material-symbols-outlined text-5xl mb-2 block">group</span>
                                    <p className="text-sm">No tutors added yet. Add your first tutor above.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tutors.map(tutor => (
                                        <div key={tutor.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {tutor.fullName?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{tutor.fullName}</p>
                                                    <p className="text-xs text-slate-500">{tutor.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTutor(tutor.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Remove Tutor"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── CENTRE TAB ── */}
                {activeTab === 'centre' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Edit Coaching Centre</h2>
                            <p className="text-sm text-slate-500 mb-5">Update your coaching centre's information</p>
                            {centreMsg && (
                                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${centreMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    <span className="material-symbols-outlined text-[18px]">{centreMsg.type === 'success' ? 'check_circle' : 'error'}</span>
                                    {centreMsg.text}
                                </div>
                            )}
                            <form onSubmit={handleUpdateCentre} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Centre Name</label>
                                    <input
                                        id="centre-name"
                                        type="text"
                                        required
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={centreForm.centreName}
                                        onChange={e => setCentreForm({ ...centreForm, centreName: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Owner Name</label>
                                    <input
                                        id="centre-owner"
                                        type="text"
                                        required
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={centreForm.ownerName}
                                        onChange={e => setCentreForm({ ...centreForm, ownerName: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                                    <input
                                        id="centre-email"
                                        type="email"
                                        required
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={centreForm.email}
                                        onChange={e => setCentreForm({ ...centreForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone</label>
                                    <input
                                        id="centre-phone"
                                        type="tel"
                                        required
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={centreForm.phone}
                                        onChange={e => setCentreForm({ ...centreForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Address</label>
                                    <textarea
                                        id="centre-address"
                                        rows="3"
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                        value={centreForm.address}
                                        onChange={e => setCentreForm({ ...centreForm, address: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end pt-2">
                                    <button
                                        id="save-centre-btn"
                                        type="submit"
                                        disabled={centreLoading}
                                        className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-primary/30 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        {centreLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Settings;
