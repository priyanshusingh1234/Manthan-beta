"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lock, EyeOff, Eye, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';
import BrandingSection from '@/components/BrandingSection';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // We are relying on Supabase automatically parsing the URL #access_token fragment 
    // into the current session when the page loads.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                router.push('/profile');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950/90 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.08)_0%,_transparent_50%)]"></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-5xl lg:h-[85vh] max-h-[95vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100">
                <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-10 bg-white py-8 lg:py-0 relative">

                    <div className="w-full max-w-sm space-y-6 animate-slideUp">
                        <div className="lg:hidden flex justify-center mb-6">
                            <Logo width={90} height={90} showTagline={false} />
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Update Password
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Type your new secure password below to regain access.
                            </p>
                        </div>

                        {success ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Password Updated!</h3>
                                <p className="text-slate-600 text-sm mb-0">
                                    Redirecting you safely back to your profile...
                                </p>
                            </div>
                        ) : (
                            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                                <div className="group">
                                    <label htmlFor="password" className="sr-only">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:border-slate-400"
                                            placeholder="New Password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                            )}
                                        </button>
                                        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {loading ? 'Updating...' : 'Save New Password'}
                                </button>

                                {error && <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
                            </form>
                        )}
                    </div>
                </div>

                <BrandingSection
                    title="Secure Your Account"
                    subtitle="A strong password is your best defense in the war of wits."
                />
            </div>
        </div>
    );
}
