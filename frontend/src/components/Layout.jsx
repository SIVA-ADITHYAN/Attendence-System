import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 antialiased font-display">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Navbar />

                <main className="flex-1 overflow-y-auto">
                    {children}
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default Layout;
