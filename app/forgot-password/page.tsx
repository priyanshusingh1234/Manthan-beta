"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';
import BrandingSection from '@/components/BrandingSection';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950/90 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.08)_0%,_transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,92,246,0.08)_0%,_transparent_50%)]"></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-5xl lg:h-[85vh] max-h-[95vh] bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100">
                <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-10 bg-white py-8 lg:py-0 relative">

                    <div className="absolute top-6 left-6 z-20 hidden lg:block">
                        <Link href="/login" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Link>
                    </div>

                    <div className="w-full max-w-sm space-y-6 animate-slideUp">
                        <div className="lg:hidden flex justify-center mb-6">
                            <Logo width={90} height={90} showTagline={false} />
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Reset Password
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Enter your email address to get a reset link.
                            </p>
                        </div>

                        {success ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Check your email</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    We sent a secure password reset link to <br />
                                    <span className="font-bold text-slate-800">{email}</span>
                                </p>
                                <Link href="/login" className="block w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors">
                                    Return to Sign In
                                </Link>
                            </div>
                        ) : (
                            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                                <div className="group">
                                    <label htmlFor="email" className="sr-only">Email address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-slate-400"
                                            placeholder="Email address"
                                        />
                                        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {loading ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Reset Link</>}
                                </button>

                                {error && <div className="text-sm text-red-600 text-center">{error}</div>}

                                <div className="text-center pt-4 lg:hidden">
                                    <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600 font-medium">
                                        Remember your password? Sign in
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <BrandingSection
                    title="Regain Access"
                    subtitle="Don't lose your hard-earned rank! Recover your account to keep battling."
                />
            </div>
        </div>
    );
}
