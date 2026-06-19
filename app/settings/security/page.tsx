"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ChevronLeft, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SecuritySettingsPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccessMsg('Your password has been successfully updated.');
            setPassword('');
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
                <Link href="/settings" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={24} className="text-slate-600 dark:text-slate-300" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Shield size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Password & Security</h1>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <KeyRound size={20} className="text-indigo-500" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Set or Change Password</h2>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        If you haven't set a password yet, you can create one now. Otherwise, enter a new password below to change your existing one.
                    </p>

                    {errorMsg && (
                        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30">
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-100 dark:border-emerald-900/30">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || password.length < 6}
                            className={`w-full py-4 rounded-xl flex items-center justify-center font-bold transition-all shadow-sm ${password.length >= 6 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
