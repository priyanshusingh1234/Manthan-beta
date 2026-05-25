"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdminNotifyPage() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [title, setTitle] = useState('Admin Announcement');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [sentCount, setSentCount] = useState(0);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (!currentSession) {
                router.push('/login');
            } else {
                setSession(currentSession);
            }
        });
    }, [router]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        setStatus('loading');
        setErrorMessage('');
        
        try {
            const res = await fetch('/api/admin/notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ title, message })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send notification');
            }
            
            setStatus('success');
            setSentCount(data.sent || 0);
            setMessage('');
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    if (!session) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Admin Broadcast</h1>
                            <p className="text-sm text-slate-500">Send push notifications to all users</p>
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-medium text-sm flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 font-medium text-sm flex items-start gap-3 border border-green-200 dark:border-green-500/30">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p>Successfully broadcasted notification to {sentCount} users!</p>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notification Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="E.g., Special Announcement!"
                                disabled={status === 'loading'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notification Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]"
                                placeholder="Type your message here..."
                                disabled={status === 'loading'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading' || !message.trim()}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
                                status === 'loading' || !message.trim()
                                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:-translate-y-0.5'
                            }`}
                        >
                            <Send className="w-5 h-5" />
                            {status === 'loading' ? 'Broadcasting...' : 'Send to All Users'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
