"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Bell, BellOff, Smartphone, Mail, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { subscribeToPushNotifications } from '@/lib/pushUtils';

export default function NotificationSettings() {
    const [mounted, setMounted] = useState(false);
    
    // States
    const [muteAll, setMuteAll] = useState(false);
    const [inAppNotifications, setInAppNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);

    useEffect(() => {
        setMounted(true);
        // Check current push notification permission status natively
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPushNotifications(Notification.permission === 'granted');
        }
    }, []);

    const handlePushToggle = async (checked: boolean) => {
        if (!checked) {
            setPushNotifications(false);
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('This browser does not support desktop/push notifications.');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            try {
                await subscribeToPushNotifications();

                setPushNotifications(true);
                new Notification('Push Notifications Enabled!', {
                    body: 'You will now receive real-time updates from Dheeyudha.',
                    icon: '/favicon.ico'
                });

            } catch (err: any) {
                console.error('[WebPush] Error during subscription:', err);
                alert('Could not enable push: ' + err.message);
                setPushNotifications(false);
            }
        } else {
            setPushNotifications(false);
            alert('You need to allow notifications in your browser settings to use this feature.');
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
                <Link 
                    href="/settings" 
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft size={24} />
                </Link>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Bell size={20} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
                {/* Master Mute Toggle */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl transition-colors ${muteAll ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                <VolumeX size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Mute All Notifications</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Temporarily silence all alerts and emails.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setMuteAll(!muteAll)}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${muteAll ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${muteAll ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* Individual Preferences Container */}
                <div className={`transition-opacity duration-300 ${muteAll ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-3">
                        Delivery Methods
                    </h2>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        
                        {/* In-App Notifications */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">In-App Alerts</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">See alerts when you open the app.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setInAppNotifications(!inAppNotifications)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inAppNotifications ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${inAppNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Push Notifications */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl">
                                    <Smartphone size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Push Notifications</h3>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 border border-green-200 dark:bg-green-900/50 dark:border-green-800 px-1.5 py-0.5 rounded-md">Real-time</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] sm:max-w-none">Send instant alerts directly to your phone or desktop browser.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handlePushToggle(!pushNotifications)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pushNotifications ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pushNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Email Notifications */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Email Digests</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Receive summary emails of your activity.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailNotifications ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                        <BellOff size={14} /> Only critical account alerts will bypass mute.
                    </p>
                </div>
            </div>
        </div>
    );
}
