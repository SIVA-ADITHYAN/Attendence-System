import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { authAPI } from '../services/api';

// ─── Forgot Password Modal ────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
    // step: 'email' | 'otp' | 'reset' | 'success'
    const [step, setStep] = React.useState('email');
    const [email, setEmail] = React.useState('');
    const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showNewPwd, setShowNewPwd] = React.useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [resendCountdown, setResendCountdown] = React.useState(0);

    const otpRefs = React.useRef([]);

    // Countdown timer for resend
    React.useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    // Handle OTP input boxes
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pasteData.split('').forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        otpRefs.current[Math.min(pasteData.length, 5)]?.focus();
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('Please enter your email address'); return; }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: email.trim() });
            setSuccess('OTP sent! Check your inbox (and spam folder).');
            setStep('otp');
            setResendCountdown(60);
        } catch (err) {
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || 'Failed to send OTP. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP — calls backend to check before advancing
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length < 6) { setError('Please enter the complete 6-digit OTP'); return; }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
                email: email.trim(),
                otp: otpValue
            });
            // Only advance if backend says the OTP is valid
            setStep('reset');
            setSuccess('');
        } catch (err) {
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : 'Invalid or expired OTP. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
                email: email.trim(),
                otp: otp.join(''),
                newPassword
            });
            setStep('success');
        } catch (err) {
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : 'Failed to reset password. OTP may be invalid or expired.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (resendCountdown > 0) return;
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: email.trim() });
            setOtp(['', '', '', '', '', '']);
            setResendCountdown(60);
            setSuccess('A new OTP has been sent to your email.');
        } catch (err) {
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || 'Failed to resend OTP. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                style={{ animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                    className="px-8 py-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {step === 'email' && 'Forgot Password'}
                            {step === 'otp' && 'Verify OTP'}
                            {step === 'reset' && 'Set New Password'}
                            {step === 'success' && 'Password Reset!'}
                        </h2>
                        <p className="text-white/75 text-sm mt-0.5">
                            {step === 'email' && 'Enter your email to receive a verification code'}
                            {step === 'otp' && `Code sent to ${email}`}
                            {step === 'reset' && 'Choose a strong new password'}
                            {step === 'success' && 'You can now log in with your new password'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors ml-4 p-1 rounded-lg hover:bg-white/10">
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Step indicator */}
                {step !== 'success' && (
                    <div className="px-8 pt-5 flex gap-2">
                        {['email', 'otp', 'reset'].map((s, i) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                    ${(step === 'email' && i === 0) || (step === 'otp' && i <= 1) || (step === 'reset' && i <= 2)
                                        ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {i + 1}
                                </div>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded ${(step === 'otp' && i === 0) || (step === 'reset')
                                    ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-8 py-6">
                    {/* Error / Success alerts */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                            {error}
                        </div>
                    )}
                    {success && !error && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg flex-shrink-0">check_circle</span>
                            {success}
                        </div>
                    )}

                    {/* ── STEP 1: Email ── */}
                    {step === 'email' && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                    <input
                                        type="email"
                                        id="fp-email"
                                        required
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder="name@company.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg
                                                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none
                                                   transition-all placeholder:text-slate-400 text-slate-800"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-lg font-semibold text-white transition-all
                                           flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-xl">send</span>Send OTP</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* ── STEP 2: OTP ── */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                                    Enter the 6-digit code sent to your email
                                </label>
                                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => otpRefs.current[i] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl outline-none
                                                       transition-all bg-slate-50 text-slate-800"
                                            style={{
                                                height: '52px',
                                                borderColor: digit ? '#4f46e5' : '#e2e8f0',
                                                boxShadow: digit ? '0 0 0 3px rgba(79,70,229,0.12)' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.join('').length < 6}
                                className="w-full py-3 rounded-lg font-semibold text-white transition-all
                                           flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-xl">verified</span>Verify OTP</>
                                )}
                            </button>
                            <div className="text-center text-sm text-slate-500">
                                Didn't receive the code?{' '}
                                {resendCountdown > 0 ? (
                                    <span className="text-slate-400">Resend in {resendCountdown}s</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                            <button type="button" onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
                                className="w-full text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Change email address
                            </button>
                        </form>
                    )}

                    {/* ── STEP 3: New Password ── */}
                    {step === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                    <input
                                        type={showNewPwd ? 'text' : 'password'}
                                        id="fp-new-password"
                                        required
                                        value={newPassword}
                                        onChange={e => { setNewPassword(e.target.value); setError(''); }}
                                        placeholder="Min. 6 characters"
                                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-lg
                                                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none
                                                   transition-all placeholder:text-slate-400 text-slate-800"
                                    />
                                    <button type="button" onClick={() => setShowNewPwd(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <span className="material-symbols-outlined text-xl">
                                            {showNewPwd ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock_reset</span>
                                    <input
                                        type={showConfirmPwd ? 'text' : 'password'}
                                        id="fp-confirm-password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                        placeholder="Repeat your password"
                                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-lg
                                                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none
                                                   transition-all placeholder:text-slate-400 text-slate-800"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <span className="material-symbols-outlined text-xl">
                                            {showConfirmPwd ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">Passwords do not match</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-lg font-semibold text-white transition-all
                                           flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-xl">check_circle</span>Reset Password</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* ── STEP 4: Success ── */}
                    {step === 'success' && (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                                style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                                <span className="material-symbols-outlined text-5xl text-emerald-600">check_circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Password Updated!</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Your password has been successfully reset. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-lg font-semibold text-white transition-all
                                           flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                            >
                                <span className="material-symbols-outlined text-xl">login</span>
                                Back to Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useUser();
    const from = location.state?.from?.pathname || '/dashboard';

    const [formData, setFormData] = React.useState({ email: '', password: '' });
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showForgotModal, setShowForgotModal] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Send request directly to our secure Spring Boot Login API
            const response = await authAPI.login({
                email: formData.email,
                password: formData.password
            });
            
            // Backend now returns the token and the user object securely!
            const { token, user } = response.data;
            
            // Save the token so all future API requests succeed!
            localStorage.setItem("token", token);
            
            // If the backend didn't send the user object (due to not restarting the server),
            // safely decode the information directly out of the generated JWT string.
            let finalUser = user;
            if (!finalUser && token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    finalUser = {
                        email: payload.sub,
                        role: payload.role,
                        id: payload.userId,
                        coachingCentreId: payload.centreId
                    };
                } catch (e) {
                    console.error('Failed to parse JWT payload', e);
                }
            }
            
            if (finalUser) {
                let centreName = '';
                if (finalUser.coachingCentreId) {
                    try {
                        // Explicitly add the newly generated token since the interceptor might not catch the instant state update
                        const centreRes = await axios.get(`${API_BASE_URL}/api/coaching-centres/${finalUser.coachingCentreId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        centreName = centreRes.data?.centreName || '';
                    } catch (_) { }
                }
                login({ ...finalUser, centreName });
                navigate(from, { replace: true });
            }
        } catch (err) {
            console.error('Login error:', err);
            // Show the exact Error reason string generated by Spring Boot (e.g. 'Invalid credentials')
            const msg = typeof err.response?.data === 'string' 
                ? err.response.data 
                : typeof err.response?.data?.message === 'string'
                    ? err.response.data.message
                    : 'Invalid email or password';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}

            <div className="font-display bg-background-light text-slate-900 min-h-screen flex items-center justify-center p-4">
                <div className="max-w-[1000px] w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    {/* Left Side: Illustration / Branding */}
                    <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                        <div className="relative z-10 flex items-center gap-3 text-white">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <span className="material-symbols-outlined text-2xl leading-none">auto_awesome</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Smart Attendance</h2>
                        </div>
                        <div className="relative z-10 mt-auto">
                            <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-white/20">
                                <img
                                    alt="Analytics dashboard interface"
                                    className="w-full h-48 object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFcRlK3FP6BTnv2M_btEcxVQYVT_HswfTHad_eqg_pfqjVp9p-ukeuopUpLwjuAawus6UFsQ9kNjOW4YsVgZ02pqJngBgS1zf_sGHs0Bw0M0R1w4Z9tXpnZDKJThHKNIEbgnJiYFjRbZymKP2_sv0Sd5yR2wdvpvZpGswTrVhC09KyDN3T9VPcIvOYKDGMdek9I0yGjLGpwmzDH4vtl8UnYykTvEtdRMnNYtcz05kjNbU8RAaTnulB2uI3zqr5RJIBj1cran0EfdM"
                                />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4 leading-tight">Effortless workforce management.</h1>
                            <p className="text-primary/10 text-white/80 text-lg">The smartest way to track attendance, productivity, and team performance in real-time.</p>
                        </div>
                        <div className="relative z-10 mt-8 flex gap-2">
                            <div className="h-1 w-8 bg-white rounded-full"></div>
                            <div className="h-1 w-2 bg-white/40 rounded-full"></div>
                            <div className="h-1 w-2 bg-white/40 rounded-full"></div>
                        </div>
                    </div>

                    {/* Right Side: Login Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="mb-10">
                            <h3 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h3>
                            <p className="text-slate-500">Enter your details to access your dashboard.</p>
                        </div>
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}
                        <form className="space-y-6" onSubmit={handleLogin}>
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="email">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                        id="email"
                                        name="email"
                                        placeholder="name@company.com"
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                    <input
                                        className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                        id="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            {/* Login Button */}
                            <button
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span>Signing In...</span>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                        <div className="mt-10 text-center">
                            <p className="text-sm text-slate-600">
                                Don't have an account?
                                <Link to="/register" className="text-primary font-bold hover:underline ml-1">Create an account</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
