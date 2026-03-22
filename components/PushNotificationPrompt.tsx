'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPushNotifications } from '@/lib/pushUtils';
import { Capacitor } from '@capacitor/core';

export default function PushNotificationPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const checkPermission = async () => {
            const isNative = Capacitor.isNativePlatform();
            
            if (isNative) {
                const { PushNotifications } = await import('@capacitor/push-notifications');
                const status = await PushNotifications.checkPermissions();
                if (status.receive !== 'prompt' && status.receive !== 'default') return;
            } else {
                if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
                if (Notification.permission !== 'default') return;
            }

            // Check if we already asked them and they dismissed it
            const dismissed = localStorage.getItem('push_prompt_dismissed');
            if (dismissed === 'true') return;

            // Delay popup slightly so it's not aggressive on first load
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);

            return timer;
        };

        const timerPromise = checkPermission();

        return () => {
            timerPromise.then(timer => timer && clearTimeout(timer));
        };
    }, []);

    const handleAllow = async () => {
        setIsSubscribing(true);
        try {
            const isNative = Capacitor.isNativePlatform();
            let permission = 'denied';

            if (isNative) {
                const { PushNotifications } = await import('@capacitor/push-notifications');
                const res = await PushNotifications.requestPermissions();
                permission = res.receive;
            } else {
                permission = await Notification.requestPermission();
            }

            if (permission === 'granted') {
                await subscribeToPushNotifications();
                
                if (!isNative) {
                    new Notification('Welcome to Dheeyudha!', {
                        body: 'You are now subscribed to real-time updates.',
                        icon: '/favicon.ico'
                    });
                }
                
                setIsVisible(false);
            } else {
                dismiss();
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('push_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-slideUp">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 md:p-5 w-[calc(100vw-2rem)] md:w-80 flex flex-col gap-3 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                
                <button 
                    onClick={dismiss}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                    </div>
                    
                    <div className="pr-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            Enable Notifications
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Never miss a challenge or message! Get real-time alerts instantly.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={dismiss}
                        className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={handleAllow}
                        disabled={isSubscribing}
                        className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        {isSubscribing ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Allow'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
