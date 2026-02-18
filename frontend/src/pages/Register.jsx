
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    // Form states
    const [formData, setFormData] = useState({
        // Step 1: Account
        fullName: '',
        accountEmail: '',
        password: '',
        confirmPassword: '',

        // Step 2: Centre
        centreName: '',
        ownerName: '',
        contactEmail: '',
        phoneNumber: '',
        address: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleNext = (e) => {
        e.preventDefault();
        // Add validation for Step 1 here if needed
        setStep(2);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Submit logic here
        console.log('Submitting Registration:', formData);

        // Simulate API call
        setTimeout(() => {
            alert('Registration Successful! Redirecting to login...');
            navigate('/');
        }, 1000);
    };

    return (
        <div className="bg-background-light min-h-screen text-slate-900 font-sans">
            {/* Top Navigation Bar */}
            {/* <header className="w-full border-b border-primary/10 bg-white backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg flex items-center justify-center bg-primary">
                            <span className="material-symbols-outlined text-white text-2xl">school</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">Attendly<span className="">Pro</span></h2>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <span className="text-sm font-medium text-slate-500">Step {step} of 2</span>
                    </div>
                </div>
            </header> */}

            <main className="max-w-3xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Register Your Coaching Centre</h1>
                    <p className="text-slate-600 text-lg">Complete your registration by providing your centre details</p>
                </div>

                {/* Progress Stepper */}
                <div className="mb-12">
                    <div className="relative flex items-center justify-between max-w-md mx-auto">
                        {/* Line background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200"></div>

                        {/* Progress Line */}
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        ></div>

                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-4 ring-white ${step > 1 ? 'bg-primary' : 'bg-primary'}`}>
                                {step > 1 ? (
                                    <span className="material-symbols-outlined text-xl">check</span>
                                ) : (
                                    <span className="text-sm font-bold">1</span>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-slate-900">1. Account</span>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white transition-colors duration-300 ${step === 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <span className="text-sm font-bold">2</span>
                            </div>
                            <span className={`text-sm font-semibold transition-colors duration-300 ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}>2. Centre</span>
                        </div>
                    </div>
                </div>

                {/* Registration Form Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xl shadow-primary/5 p-6 md:p-10">
                    <form className="space-y-6" onSubmit={step === 1 ? handleNext : handleSubmit}>

                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Account Details (Step 1) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="fullName">Full Name</label>
                                        <input
                                            className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                            id="fullName"
                                            placeholder="e.g. Jane Doe"
                                            type="text"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="accountEmail">Email Address</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                            <input
                                                className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                                id="accountEmail"
                                                placeholder="yourname@example.com"
                                                type="email"
                                                value={formData.accountEmail}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                            <input
                                                className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                                id="password"
                                                placeholder="••••••••"
                                                type="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock_reset</span>
                                            <input
                                                className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                                id="confirmPassword"
                                                placeholder="••••••••"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        className="w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group bg-primary hover:bg-indigo-700 shadow-indigo-200 cursor-pointer"
                                        type="submit"
                                    >
                                        Next Step
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fadeIn">
                                {/* Centre Details (Step 2) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Centre Name */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="centreName">Centre Name</label>
                                        <input
                                            className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                            id="centreName"
                                            placeholder="e.g. Elite Academy"
                                            type="text"
                                            value={formData.centreName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    {/* Owner Name */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="ownerName">Owner Name</label>
                                        <input
                                            className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                            id="ownerName"
                                            placeholder="e.g. John Doe"
                                            type="text"
                                            value={formData.ownerName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    {/* Email Address */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="contactEmail">Email Address</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                            <input
                                                className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                                id="contactEmail"
                                                placeholder="contact@academy.com"
                                                type="email"
                                                value={formData.contactEmail}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    {/* Phone Number */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700" htmlFor="phoneNumber">Phone Number</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">call</span>
                                            <input
                                                className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none focus:border-primary"
                                                id="phoneNumber"
                                                placeholder="+1 (555) 000-0000"
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Address Textarea */}
                                <div className="flex flex-col gap-2 mt-6">
                                    <label className="text-sm font-semibold text-slate-700" htmlFor="address">Office Address</label>
                                    <textarea
                                        className="form-input block w-full rounded-lg border-slate-300 bg-white text-slate-900 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none outline-none focus:border-primary"
                                        id="address"
                                        placeholder="Enter the full physical address of your centre"
                                        rows="3"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        className="w-1/3 text-primary font-bold py-4 rounded-xl border-2 border-primary/20 hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                        type="button"
                                        onClick={() => setStep(1)}
                                    >
                                        <span className="material-symbols-outlined rotate-180">arrow_forward</span>
                                        Back
                                    </button>
                                    <button
                                        className="w-2/3 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group bg-primary hover:bg-indigo-700 shadow-indigo-200 cursor-pointer"
                                        type="submit"
                                    >
                                        Finish Registration
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-center mt-6 text-sm text-slate-500">
                            Already have an account?
                            <Link to="/" className="hover:underline font-medium text-primary ml-1">Login here</Link>
                        </p>
                    </form>
                </div>

                {/* Help Section */}
                {/* <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-600 bg-white px-6 py-3 rounded-full border border-slate-200">
                        <span className="material-symbols-outlined">help</span>
                        <span className="text-sm font-medium">Need help? <a className="font-bold hover:underline" href="#">Contact Support</a></span>
                    </div>
                </div> */}
            </main>

            {/* Decorative Elements */}
            <div className="fixed top-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-indigo-500/5"></div>
            <div className="fixed bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none bg-indigo-500/10"></div>
        </div>
    );
};

export default Register;
