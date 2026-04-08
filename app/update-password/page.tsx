"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lock, EyeOff, Eye, ShieldCheck, Loader2 } from 'lucide-react';
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
        <div className="min-h-[100dvh] bg-white flex flex-col lg:flex-row relative overflow-hidden">
            {/* Mobile Back Button - Native Android feel */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pointer-events-none">
                <button 
                    onClick={() => router.back()}
                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-200 text-slate-800 active:scale-90 transition-transform"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
            </div>

            {/* Branding Section - Full Screen Left */}
            <BrandingSection
                title="Secure Your Account"
                subtitle="A strong password is your best defense in the war of wits."
            />

            {/* Form Section - Full Screen Right */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 bg-white relative z-10 transition-all">
                <div className="w-full max-w-sm space-y-8 animate-slideUp">
                    <div className="lg:hidden flex justify-center mb-4">
                        <Logo width={100} height={100} showTagline={false} />
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                            New Password
                        </h2>
                        <p className="mt-3 text-base text-slate-500 font-medium">
                            Type your new secure password below to regain access to your sanctum.
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center animate-in zoom-in-95 shadow-sm">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Password Updated!</h3>
                            <p className="text-slate-600 font-medium mb-0">
                                Redirecting you safely...
                            </p>
                        </div>
                    ) : (
                        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                            <div className="group">
                                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2 ml-1">Secure Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-12 pr-12 py-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all hover:bg-slate-50"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 active:scale-95 transition-all"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-white bg-slate-900 hover:bg-black shadow-lg shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Updating...
                                    </>
                                ) : 'Save New Password'}
                            </button>

                            {error && <div className="text-sm font-bold text-red-600 text-center bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">{error}</div>}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
