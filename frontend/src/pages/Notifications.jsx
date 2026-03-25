import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useUser } from '../context/UserContext';
import { notificationAPI, attendanceAPI } from '../services/api';

const Notifications = () => {
    const { user } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.role === 'TUTOR') {
            fetchNotifications();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationAPI.getTutorNotifications(user.id);
            setNotifications(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (notif) => {
        setSelectedNotif(notif);
        setReason('');
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const handleSubmitReason = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Please enter a valid reason");
            return;
        }

        try {
            setSubmitting(true);
            
            // Fetch existing attendance to patch remarks securely
            const attRes = await attendanceAPI.getById(selectedNotif.attendanceId);
            const attendance = attRes.data;
            await attendanceAPI.update(attendance.id, {
                ...attendance,
                remarks: "Late Reason: " + reason
            });

            // Mark notification as read
            await notificationAPI.markAsRead(selectedNotif.id);

            toast.success("Reason recorded successfully!");
            setSelectedNotif(null);
            
            // Refresh list directly
            fetchNotifications();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit reason');
        } finally {
            setSubmitting(false);
        }
    };

    if (user?.role !== 'TUTOR') {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">lock</span>
                        <p className="text-slate-600 font-medium">Only Tutors can access this page.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 mb-1">
                            Notifications
                        </h1>
                        <p className="text-slate-500 text-sm">Stay alerted on student tracking and missing schedules.</p>
                    </div>
                    {notifications.length > 0 && (
                        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-primary/20">
                            <span className="material-symbols-outlined text-[18px]">inbox</span>
                            {notifications.filter(n => !n.read).length} Unread
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                        <p className="text-slate-500 font-medium animate-pulse">Loading alerts...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-24 flex flex-col items-center gap-3">
                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mb-2 shadow-inner border border-slate-100">
                            <span className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
                        </div>
                        <p className="text-slate-700 font-semibold text-lg">No Notifications</p>
                        <p className="text-slate-400 text-sm text-center max-w-sm">
                            You're all caught up! When a student checks in late, you will be notified here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`relative pl-4 pr-5 py-5 rounded-2xl border transition-all duration-300 ${!notif.read ? 'bg-white shadow-md border-primary/20 hover:border-primary/40' : 'bg-slate-50/50 border-slate-200/60 shadow-sm opacity-75'}`}
                            >
                                {!notif.read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl"></div>
                                )}
                                
                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-0.5 size-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${notif.type === 'LATE_ARRIVAL' ? 'bg-amber-100/80 text-amber-600 border border-amber-200' : 'bg-blue-100/80 text-blue-600 border border-blue-200'}`}>
                                            <span className="material-symbols-outlined text-xl">
                                                {notif.type === 'LATE_ARRIVAL' ? 'schedule' : 'notifications'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-base tracking-tight ${!notif.read ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>
                                                {notif.type === 'LATE_ARRIVAL' ? 'Student Late Arrival' : 'Alert'}
                                            </h3>
                                            <p className={`text-sm mt-1 mb-2 leading-relaxed ${!notif.read ? 'text-slate-600' : 'text-slate-500'}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                    {new Date(notif.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                                        {notif.type === 'LATE_ARRIVAL' && !notif.read && (
                                            <button 
                                                onClick={() => handleActionClick(notif)}
                                                className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-[0_2px_4px_rgba(245,158,11,0.2)] transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                                Fill Reason
                                            </button>
                                        )}
                                        {!notif.read && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-colors"
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                        {notif.read && (
                                            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                                <span className="material-symbols-outlined text-[16px]">done_all</span>
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submittal Modal */}
            {selectedNotif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slideUp">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                Late Reason Required
                            </h3>
                            <button onClick={() => setSelectedNotif(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReason} className="p-6">
                            <p className="text-slate-600 text-sm mb-4">
                                Please record the explanation given by <strong className="text-slate-800">{selectedNotif.studentName}</strong> ({selectedNotif.registerNumber}) for arriving late today.
                            </p>
                            
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Detailed Reason</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="E.g., Bus was delayed..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-28 mb-6"
                                required
                            />
                            
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedNotif(null)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !reason.trim()}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">save</span>
                                            Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Notifications;
