import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ErrorPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();

    // Determine the error type from location state
    const errorType = location.state?.errorType || 'NOT_FOUND';

    const errors = {
        UNAUTHORIZED: {
            code: '401',
            icon: 'lock',
            title: 'Access Denied',
            subtitle: 'You are not authorized to view this page.',
            description: 'This page is restricted to administrators only. Please contact your admin if you believe this is a mistake.',
            color: '#ef4444',
            gradientFrom: '#fef2f2',
            gradientTo: '#fff1f2',
        },
        NOT_LOGGED_IN: {
            code: '403',
            icon: 'no_accounts',
            title: 'Login Required',
            subtitle: 'You must be logged in to access this page.',
            description: 'Please log in with your credentials to continue. Unauthorized access attempts are logged.',
            color: '#f59e0b',
            gradientFrom: '#fffbeb',
            gradientTo: '#fef3c7',
        },
        NOT_FOUND: {
            code: '404',
            icon: 'search_off',
            title: 'Page Not Found',
            subtitle: 'The page you are looking for does not exist.',
            description: 'The URL you entered may be incorrect or the page may have been moved or deleted.',
            color: '#6366f1',
            gradientFrom: '#eef2ff',
            gradientTo: '#e0e7ff',
        },
    };

    const err = errors[errorType] || errors.NOT_FOUND;

    const handleGoBack = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${err.gradientFrom} 0%, ${err.gradientTo} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                padding: '24px',
            }}
        >
            {/* Animated background blobs */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-10%',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${err.color}22 0%, transparent 70%)`,
                    animation: 'float 8s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-10%',
                    width: '400px', height: '400px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${err.color}18 0%, transparent 70%)`,
                    animation: 'float 10s ease-in-out infinite reverse',
                }} />
            </div>

            <div style={{
                position: 'relative', zIndex: 1,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
                padding: '56px 48px',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.8)',
                animation: 'slideUp 0.5s ease-out',
            }}>
                {/* Error Code Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: `${err.color}18`,
                    color: err.color,
                    borderRadius: '12px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    letterSpacing: '2px',
                    marginBottom: '24px',
                    border: `1px solid ${err.color}30`,
                }}>
                    ERROR {err.code}
                </div>

                {/* Icon */}
                <div style={{
                    width: '88px', height: '88px',
                    background: `linear-gradient(135deg, ${err.color}22, ${err.color}11)`,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    border: `2px solid ${err.color}30`,
                    animation: 'pulse 2s ease-in-out infinite',
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: '44px',
                        color: err.color,
                    }}>
                        {err.icon}
                    </span>
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#0f172a',
                    marginBottom: '10px',
                    letterSpacing: '-0.5px',
                }}>
                    {err.title}
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: err.color,
                    marginBottom: '14px',
                }}>
                    {err.subtitle}
                </p>

                {/* Description */}
                <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.7',
                    marginBottom: '36px',
                }}>
                    {err.description}
                </p>

                {/* Divider */}
                <div style={{
                    height: '1px',
                    background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)',
                    marginBottom: '28px',
                }} />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                        onClick={handleGoBack}
                        style={{
                            width: '100%',
                            padding: '14px 28px',
                            background: `linear-gradient(135deg, ${err.color}, ${err.color}cc)`,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 20px ${err.color}44`,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${err.color}55`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${err.color}44`; }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {user ? 'dashboard' : 'login'}
                        </span>
                        {user ? 'Go to Dashboard' : 'Go to Login'}
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            width: '100%',
                            padding: '13px 28px',
                            background: 'transparent',
                            color: '#475569',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                        Go Back
                    </button>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-30px) scale(1.05); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default ErrorPage;
