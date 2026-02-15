import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useUser();

    const [formData, setFormData] = React.useState({
        email: '',
        password: ''
    });
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Fetch all users from the backend
            // Note: This is a temporary solution as requested, to avoid backend changes.
            // In production, this should be a POST /api/auth/login endpoint.
            const response = await axios.get('/api/users');
            const users = response.data;

            const user = users.find(
                (u) => u.email === formData.email && u.password === formData.password
            );

            if (user) {
                // Successful login
                if (user.role === 'ADMIN' || user.role === 'HR') {
                    login(user);
                    navigate('/dashboard');
                } else {
                    setError('Access denied. Only Admin/HR can access the dashboard.');
                }
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Failed to connect to the server. Please ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="font-display bg-background-light text-slate-900 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-[1000px] w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Side: Illustration / Branding */}
                <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
                    {/* Background Decorative Elements */}
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
                                <a className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors" href="#">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                <input
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" type="button">
                                    <span className="material-symbols-outlined text-xl">visibility</span>
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
                            <a className="text-primary font-bold hover:underline ml-1" href="#">Create an account</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
