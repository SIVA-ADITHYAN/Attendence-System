import React from 'react';
import { useUser } from '../context/UserContext';

const Navbar = () => {
    const { user } = useUser();

    return (
        <header className="h-15 bg-white border-b border-slate-200 px-8 flex items-center justify-end sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end justify-center">
                    <span className="text-[14px] font-semibold leading-tight">{user?.fullName || 'Guest'}</span>
                    <span className="text-[14px] text-slate-500 font-medium leading-tight">{user?.email || 'user@example.com'}</span>
                </div>
                <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">person</span>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
