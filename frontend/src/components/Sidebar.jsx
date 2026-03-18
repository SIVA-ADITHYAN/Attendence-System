import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useUser();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            {/* ── Mobile overlay sidebar ── */}
            <aside
                className={`
                    fixed top-0 left-0 h-full bg-white border-r border-slate-200 flex flex-col z-30
                    transition-transform duration-300 ease-in-out
                    w-64
                    md:hidden
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Header with close button */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined">fingerprint</span>
                        </div>
                        <div className="flex flex-col whitespace-nowrap">
                            <marquee behavior="" direction=""><span className="font-bold text-base leading-tight">{user?.centreName?.toUpperCase() || 'Tuition Centre'}</span></marquee>
                            <span className="text-xs text-slate-500 font-medium">Management Portal</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500 text-[20px]">close</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 pt-3" onClick={() => setIsSidebarOpen(false)}>
                    <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/dashboard') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">dashboard</span>
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Link to="/students" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/students') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">group</span>
                        <span className="text-sm">Students</span>
                    </Link>
                    <Link to="/attendance" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/attendance') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">calendar_today</span>
                        <span className="text-sm">Attendance</span>
                    </Link>
                    <Link to="/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/reports') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">bar_chart</span>
                        <span className="text-sm">Reports</span>
                    </Link>
                </nav>

                <div className="p-4 mt-auto border-t border-slate-200 space-y-1">
                    {user?.role === 'ADMIN' && (
                        <Link to="/settings" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/settings') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <span className="material-symbols-outlined text-[22px] shrink-0">settings</span>
                            <span className="text-sm">Settings</span>
                        </Link>
                    )}
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-medium transition-colors w-full text-left" onClick={handleLogout}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">logout</span>
                        <span className="text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Desktop sidebar (push layout, hidden on mobile) ── */}
            <aside className={`hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex-col transition-all duration-300 ease-in-out overflow-hidden shrink-0`}>
                <div className={`p-6 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center pt-6 px-0'}`}>
                    <div
                        className="size-10 bg-primary rounded-lg flex items-center justify-center text-white cursor-pointer shrink-0 hover:bg-primary/90 transition-colors"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <span className="material-symbols-outlined">fingerprint</span>
                    </div>
                    {isSidebarOpen && (
                        <div className="flex flex-col whitespace-nowrap animate-fadeIn">
                            <marquee behavior="" direction=""> <span className="font-bold text-lg leading-tight">{user?.centreName?.toUpperCase() || 'Tuition Centre'}</span></marquee>
                            <span className="text-sm text-slate-500 font-medium">Management Portal</span>
                        </div>
                    )}
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    <Link to="/dashboard" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg font-medium transition-colors ${isActive('/dashboard') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">dashboard</span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Dashboard</span>}
                    </Link>
                    <Link to="/students" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg font-medium transition-colors ${isActive('/students') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">group</span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Students</span>}
                    </Link>
                    <Link to="/attendance" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg font-medium transition-colors ${isActive('/attendance') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">calendar_today</span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Attendance</span>}
                    </Link>
                    <Link to="/reports" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg font-medium transition-colors ${isActive('/reports') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">bar_chart</span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Reports</span>}
                    </Link>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-200 space-y-1">
                    {user?.role === 'ADMIN' && (
                        <Link to="/settings" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg font-medium transition-colors ${isActive('/settings') ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <span className="material-symbols-outlined text-[22px] shrink-0">settings</span>
                            {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Settings</span>}
                        </Link>
                    )}
                    <button className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3 text-left' : 'justify-center px-0 text-center'} py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-medium transition-colors w-full`} onClick={handleLogout}>
                        <span className="material-symbols-outlined text-[22px] shrink-0">logout</span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap animate-fadeIn">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
