import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Wraps any route that requires ADMIN role.
 * - While loading → shows a spinner.
 * - Not logged in → redirects to /error with NOT_LOGGED_IN state.
 * - Logged in but not ADMIN → redirects to /error with UNAUTHORIZED state.
 * - ADMIN → renders the child page.
 */
const AdminRoute = ({ children }) => {
    const { user, loading } = useUser();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    <p className="text-slate-500 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/error"
                state={{ errorType: 'NOT_LOGGED_IN', from: location }}
                replace
            />
        );
    }

    if (user.role !== 'ADMIN') {
        return (
            <Navigate
                to="/error"
                state={{ errorType: 'UNAUTHORIZED', from: location }}
                replace
            />
        );
    }

    return children;
};

export default AdminRoute;
