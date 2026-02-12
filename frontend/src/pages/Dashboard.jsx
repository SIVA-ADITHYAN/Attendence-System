import React from 'react';

const Dashboard = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 antialiased font-display">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">fingerprint</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight">SK Tution Centre</span>
                        <span className="text-xs text-slate-500 font-medium">Management Portal</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold" href="#">
                        <span className="material-symbols-outlined text-[22px]">dashboard</span>
                        <span className="text-sm">Dashboard</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors" href="#">
                        <span className="material-symbols-outlined text-[22px]">group</span>
                        <span className="text-sm">Students</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors" href="#">
                        <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                        <span className="text-sm">Attendance</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors" href="#">
                        <span className="material-symbols-outlined text-[22px]">event_busy</span>
                        <span className="text-sm">Leaves</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors" href="#">
                        <span className="material-symbols-outlined text-[22px]">bar_chart</span>
                        <span className="text-sm">Reports</span>
                    </a>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-200 space-y-1">
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors" href="#">
                        <span className="material-symbols-outlined text-[22px]">settings</span>
                        <span className="text-sm">Settings</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-medium transition-colors" href="/">
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                        <span className="text-sm">Logout</span>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col bg-background-light">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm outline-none"
                                placeholder="Search employee records..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-semibold leading-none">Alex Rivera</span>
                                <span className="text-[10px] text-slate-500 font-medium mt-1">HR Manager</span>
                            </div>
                            <div className="size-10 rounded-full bg-slate-200 overflow-hidden">
                                <img
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6_E23HBVwYSFN9uPUvBS-07M4L5vBDOAUcfNBqh9QwmC6bJwU2lis8u7Y97hvy-4w5NuvxZYQNopxqIpxN_rTnkgHXK_ewvrEur2jdju56YtEoyOiS1TFj6fjopr4Ghmwvdh6-ADlKTJM2yP6nnFAEuLNHSQyQlpr5LoAOQtn5OasVueOJdfTr_elSdTCqV6VuRnar5qXRxYBIzppH-lmUEHAXNIrOKmZxKXHwwS1aSN5omGuUXfhs88RZKjAdQ64t1TZ7PY5e4c"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">badge</span>
                                </div>
                                <span className="text-xs font-bold text-success flex items-center gap-1">+12% <span className="material-symbols-outlined text-xs">trending_up</span></span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Total Users</h3>
                            <p className="text-2xl font-bold mt-1">1,250</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-success/10 flex items-center justify-center text-success">
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                </div>
                                <span className="text-xs font-bold text-success flex items-center gap-1">+5% <span className="material-symbols-outlined text-xs">trending_up</span></span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Today's Attendance</h3>
                            <p className="text-2xl font-bold mt-1">1,100</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                                    <span className="material-symbols-outlined">percent</span>
                                </div>
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1">-2% <span className="material-symbols-outlined text-xs">trending_down</span></span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Attendance Rate</h3>
                            <p className="text-2xl font-bold mt-1">88%</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                                    <span className="material-symbols-outlined">person_off</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">Stable</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Absent Today</h3>
                            <p className="text-2xl font-bold mt-1">150</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart */}


                        {/* Pie Chart Simulation */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-1">Attendance Status</h3>
                            <p className="text-sm text-slate-500 mb-8">Snapshot for today</p>
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative size-48 rounded-full border-[16px] border-slate-100 flex items-center justify-center">
                                    {/* Donut Segments Mockup using CSS gradients */}
                                    <div className="absolute inset-0 rounded-full border-[16px] border-t-success border-r-success border-b-primary border-l-red-500 rotate-45 pointer-events-none"></div>
                                    <div className="text-center">
                                        <span className="block text-2xl font-bold">1,250</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                                    </div>
                                </div>
                                <div className="mt-8 w-full space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full bg-success"></span>
                                            <span className="text-slate-600">Present</span>
                                        </div>
                                        <span className="font-bold">1,020</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full bg-primary"></span>
                                            <span className="text-slate-600">Late</span>
                                        </div>
                                        <span className="font-bold">80</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full bg-red-500"></span>
                                            <span className="text-slate-600">Absent</span>
                                        </div>
                                        <span className="font-bold">150</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Recent Check-ins</h3>
                            <button className="text-primary text-sm font-bold hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-in Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-out Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Device</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs overflow-hidden">
                                                    <img
                                                        alt="Avatar"
                                                        className="size-full object-cover"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUWKiNz2pqd6gtybC5OffiSM7i_nseHTaphjrPXW6P7h6kZL8zm1UR2ffO0IUgOKtIeBZkzZ5AN4C5ro0sw8SZlm5_lDlSImkiZOWlpyjBaZ5nXPRWMcdoHPgEhc4zloE1eSme3SfOe6fA9A_PQdtv41XOHCsypKZRqmdUb4vSupSRHNj7HTkAPVxDFenwQpxByNdrHljdXlJj1t9BXAfENFZD7oKY0yXLRKIc5Otpl3szrso8lAPb13OPX94F5vy-19pdzQm-kFg"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Sarah Johnson</p>
                                                    <p className="text-[10px] text-slate-500">#EMP-2041</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">Design</td>
                                        <td className="px-6 py-4 text-sm font-medium">08:45 AM</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success">
                                                PRESENT
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <span className="material-symbols-outlined text-lg">smartphone</span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs overflow-hidden">
                                                    <img
                                                        alt="Avatar"
                                                        className="size-full object-cover"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcrmjdJNj6GVg7nfms45rPkTnfh3dOD4nLpWmrIWw-nwmxi8CgT12Ea5FrhJCxbxVXr2IyonAzJyqYuyD5mZWsE03eNxv-r-ZraSftmzf9adiVHwdbXlwq4qzrheyApf0hMloRZqbe8e3pSqUXXNvSjGtQhFldjyx75Wf2GKy6SJwek4yYh999sWrTxiaf-pQXDJ6gu9UpvRw06ar_NkXrLK1lqAR54lv0MyeuQLO_e3tIwdR6e18AEnbZOJ0wwVdCCM1mTYgS21o"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Michael Chen</p>
                                                    <p className="text-[10px] text-slate-500">#EMP-2055</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">Engineering</td>
                                        <td className="px-6 py-4 text-sm font-medium">09:12 AM</td>
                                        <td className="px-6 py-4 text-sm font-medium">09:12 AM</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                                LATE
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <span className="material-symbols-outlined text-lg">laptop_mac</span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs overflow-hidden">
                                                    <img
                                                        alt="Avatar"
                                                        className="size-full object-cover"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0MhQheyTUDh1z5pg3jWlm6Twnu588K_Y8HbxI5IdvPlUgY06QWAGEJQ1aQt8tT8ZxnzTvZt4DFKtBQfUXb0E9IglvkhwnTmn43A1LeEN5VN1uZiEsBqAGUMnYiUeHbBGNF6fEGAWJt0hiMRTF2Cq_W9ddDXleysr51_1Qol4PgLrkrVS4bpsSk4_I5P7Pr6OV-V8kAxix0u9suXjmFSy4klNntweyDzF0_kw0HopxBvh82oLQMv_IpZYOIw4OvZdPpWdW8piB61M"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Elena Rodriguez</p>
                                                    <p className="text-[10px] text-slate-500">#EMP-1988</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">Marketing</td>
                                        <td className="px-6 py-4 text-sm font-medium">08:58 AM</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success">
                                                PRESENT
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <span className="material-symbols-outlined text-lg">sensors</span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs overflow-hidden">
                                                    <img
                                                        alt="Avatar"
                                                        className="size-full object-cover"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6j9-t17nRu7WhFhzyR-J5JLnsJRnXYjLPnB0cH96QEPIsUlEFaXmB9R3oRi1HlShBeEB_ZU-Vx_f6Npm6gyPiLfPSrUFOOSFm15JmOV_3k0_AV3bb9lmNsuI5PVHQlHj_2N2maFJYL8_A7nXKugMDpQhLeUGRIP4jlZBSj2Ub5EO3dxWW9kGNzUDIblFWMNLrGxoMUqrp8JldXsdREKblHYY3pfMou_WdX9ayJfF7v5AhOSuENOxqhPj1yRa7B2fOOvNmpKtiOac"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Marcus Smith</p>
                                                    <p className="text-[10px] text-slate-500">#EMP-2104</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">Operations</td>
                                        <td className="px-6 py-4 text-sm font-medium">09:30 AM</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                                LATE
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <span className="material-symbols-outlined text-lg">smartphone</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
