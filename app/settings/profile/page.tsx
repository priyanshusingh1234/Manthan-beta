"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Lock, Globe, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [isPrivate, setIsPrivate] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('is_private')
                    .eq('id', user.id)
                    .single();
                
                if (data) {
                    setIsPrivate(!!data.is_private);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleToggleClick = () => {
        const newValue = !isPrivate;
        setPendingToggle(newValue);
        setShowConfirmModal(true);
    };

    const confirmToggle = async () => {
        if (pendingToggle === null) return;
        
        setShowConfirmModal(false);
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Update auth metadata
            await supabase.auth.updateUser({
                data: { isPrivate: pendingToggle }
            });
            
            // Update profile
            await supabase
                .from('profiles')
                .update({ is_private: pendingToggle })
                .eq('id', user.id);
                
            setIsPrivate(pendingToggle);
        }
        setLoading(false);
    };

    if (loading && !showConfirmModal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 pb-20">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 sticky top-0 z-10 shadow-sm flex items-center gap-4">
                <Link href="/settings" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={24} className="text-slate-700 dark:text-slate-300" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
            </div>

            <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                {isPrivate ? <Lock size={24} /> : <Globe size={24} />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Private Account
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                    When your account is private, only people you approve can see your posts and followers. Your ranks and badges will still be visible.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleClick}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isPrivate ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Screen Confirmation Modal */}
            {showConfirmModal && pendingToggle !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-950 p-6 animate-in fade-in duration-300">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div className="mx-auto w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8">
                            {pendingToggle ? <Lock size={48} /> : <Globe size={48} />}
                        </div>
                        
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {pendingToggle ? "Switch to Private?" : "Switch to Public?"}
                        </h2>
                        
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-left border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex gap-4">
                                <Shield className="text-indigo-500 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {pendingToggle ? "Follow Requests" : "Anyone can follow"}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {pendingToggle 
                                            ? "New followers must send a request and be approved by you." 
                                            : "Anyone will be able to follow you immediately."}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <Lock className="text-indigo-500 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {pendingToggle ? "Hidden Posts & Followers" : "Public Profile"}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {pendingToggle 
                                            ? "Only approved followers can see your posts and followers." 
                                            : "Anyone can see your posts and who follows you."}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <Globe className="text-indigo-500 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Ranks & Badges remain public
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Your achievements, ranks, and solved questions are always visible.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <button
                                onClick={confirmToggle}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                Confirm Switch
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
