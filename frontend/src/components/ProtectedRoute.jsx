import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Wraps any route that requires authentication.
 * - While the auth state is being loaded from localStorage → shows a spinner.
 * - If the user is not logged in → redirects to "/" (login page) and remembers
 *   where they wanted to go (via `state.from`) so they can be sent back after login.
 * - If logged in → renders the child page as-is.
 */
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useUser();
    const location = useLocation();

    // Wait for UserContext to read localStorage before deciding
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
        // Redirect to login, preserving the intended destination
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
