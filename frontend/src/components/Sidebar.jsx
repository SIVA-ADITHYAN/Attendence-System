import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useUser();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
            <div className="p-6 flex items-center gap-3">
                <div
                    className="size-10 bg-primary rounded-lg flex items-center justify-center text-white cursor-pointer shrink-0 hover:bg-primary/90 transition-colors"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <span className="material-symbols-outlined">fingerprint</span>
                </div>
                {isSidebarOpen && (
                    <div className="flex flex-col whitespace-nowrap animate-fadeIn">
                        <span className="font-bold text-lg leading-tight">SK Tution Centre</span>
                        <span className="text-xs text-slate-500 font-medium">Management Portal</span>
                    </div>
                )}
            </div>
            <nav className="flex-1 px-4 space-y-1">
                <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/dashboard') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">dashboard</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Dashboard</span>}
                </Link>
                <Link
                    to="/students"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/students') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">group</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Students</span>}
                </Link>
                <Link
                    to="/attendance"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/attendance') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">calendar_today</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Attendance</span>}
                </Link>
                <Link
                    to="/leaves"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/leaves') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">event_busy</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Leaves</span>}
                </Link>
                <Link
                    to="/reports"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/reports') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">bar_chart</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Reports</span>}
                </Link>
            </nav>
            <div className="p-4 mt-auto border-t border-slate-200 space-y-1">
                <Link
                    to="/settings"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/settings') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">settings</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Settings</span>}
                </Link>
                <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-medium transition-colors w-full text-left"
                    onClick={handleLogout}
                >
                    <span className="material-symbols-outlined text-[22px] shrink-0">logout</span>
                    {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
