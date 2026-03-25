import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        // On mobile screens, default to closed regardless of saved state
        if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
        const savedState = localStorage.getItem('isSidebarOpen');
        return savedState !== null ? JSON.parse(savedState) : false;
    });

    useEffect(() => {
        localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const closeSidebarOnMobile = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 antialiased font-display">
            {/* Dark backdrop for mobile — shown when sidebar is open on small screens */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={closeSidebarOnMobile}
                />
            )}

            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                <Navbar setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

                <main className="flex-1 overflow-y-auto">
                    {children}
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default Layout;
