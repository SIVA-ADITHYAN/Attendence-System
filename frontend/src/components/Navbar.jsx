import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';

const Navbar = ({ setIsSidebarOpen, isSidebarOpen }) => {
    const { user, login, logout } = useUser();
    const navigate = useNavigate();

    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editForm, setEditForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
    });

    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openEdit = () => {
        setEditForm({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
            password: '',
        });
        setShowDropdown(false);
        setShowProfileModal(false);
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Updating profile...');

            const payload = {
                ...user,
                fullName: editForm.fullName,
                email: editForm.email,
                phoneNumber: editForm.phoneNumber,
                ...(editForm.password ? { password: editForm.password } : {}),
            };

            const response = await api.put(
                `/users/${user.id}`,
                payload
            );

            login(response.data); // update context + localStorage
            toast.success('Profile updated successfully!', { id: loadingToast });
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setIsSubmitting(true);
            const loadingToast = toast.loading('Deleting account...');
            await api.delete(`/users/${user.id}`);
            toast.success('Account deleted.', { id: loadingToast });
            logout();
            navigate('/');
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsSubmitting(false);
            setShowDeleteModal(false);
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const roleColor = {
        ADMIN: 'bg-violet-100 text-violet-700',
        TUTOR: 'bg-emerald-100 text-emerald-700',
        USER: 'bg-slate-100 text-slate-600',
    };

    return (
        <>
            <header className="h-15 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 w-full">
                {/* Hamburger — mobile only */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    aria-label="Toggle menu"
                >
                    <span className="material-symbols-outlined text-slate-600">
                        {isSidebarOpen ? 'close' : 'menu'}
                    </span>
                </button>

                {/* Spacer so right items stay right on desktop */}
                <div className="hidden md:block" />
                <div className="flex items-center gap-4" ref={dropdownRef}>
                    {/* Name & Email */}
                    <div className="flex flex-col items-end justify-center">
                        <span className="text-[14px] font-semibold leading-tight">{user?.fullName || 'Guest'}</span>
                        <span className="text-[14px] text-slate-500 font-medium leading-tight">{user?.email || 'user@example.com'}</span>
                    </div>

                    {/* Avatar / Profile Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(prev => !prev)}
                            className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0 hover:bg-primary/90 transition-colors font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            title="Profile"
                        >
                            {getInitials(user?.fullName)}
                        </button>

                        {/* Dropdown */}
                        {showDropdown && (
                            <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                                {/* User info header */}
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleColor[user?.role] || roleColor.USER}`}>
                                        {user?.role}
                                    </span>
                                </div>

                                {/* Menu items */}
                                <button
                                    onClick={() => { setShowDropdown(false); setShowProfileModal(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                                    View Profile
                                </button>
                                <button
                                    onClick={openEdit}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">edit</span>
                                    Edit Profile
                                </button>
                                <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button
                                        onClick={() => { setShowDropdown(false); setShowDeleteModal(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── View Profile Modal ── */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn overflow-hidden">
                        {/* Header banner */}
                        <div className="bg-primary h-24 relative flex items-end px-6 pb-0">
                            <div className="absolute -bottom-10 left-6 size-20 rounded-2xl bg-primary border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {getInitials(user?.fullName)}
                            </div>
                        </div>

                        <div className="pt-14 px-6 pb-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{user?.fullName}</h2>
                                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${roleColor[user?.role] || roleColor.USER}`}>
                                        {user?.role}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-400">close</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Email</p>
                                        <p className="text-sm font-medium text-slate-700">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">phone</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Phone</p>
                                        <p className="text-sm font-medium text-slate-700">{user?.phoneNumber || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">verified_user</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Account Status</p>
                                        <p className="text-sm font-medium text-emerald-600">Active</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={openEdit}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Profile Modal ── */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Update your account information</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                                    <input
                                        type="text"
                                        value={editForm.fullName}
                                        onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">phone</span>
                                    <input
                                        type="tel"
                                        value={editForm.phoneNumber}
                                        onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
                                    <input
                                        type="password"
                                        value={editForm.password}
                                        onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="New password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Saving...' : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">save</span>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn text-center">
                        <div className="size-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Account?</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            This action is <span className="font-semibold text-red-500">permanent</span> and cannot be undone. Your account and all associated data will be removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
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

export default Navbar;
