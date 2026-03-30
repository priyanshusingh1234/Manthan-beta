"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import { CURRENT_VERSION } from '@/lib/version';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface VersionConfig {
    version: string;
    min_version?: string;
    name: string;
    description: string;
    url: string;
    downloadUrl?: string;
    force_update?: boolean;
}

function isVersionGreater(latestVersion: string, currentVersion: string): boolean {
    const latestParts = latestVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
        const latest = latestParts[i] || 0;
        const current = currentParts[i] || 0;
        if (latest > current) return true;
        if (latest < current) return false;
    }

    return false;
}

export default function UpdateChecker() {
    const [updateInfo, setUpdateInfo] = useState<VersionConfig | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isForceUpdate, setIsForceUpdate] = useState(false);

    useEffect(() => {
        const checkUpdate = async () => {
            const isNative = Capacitor.isNativePlatform();

            // Native update prompt should appear only inside the installed native app.
            if (!isNative && process.env.NODE_ENV !== 'development') return;

            try {
                let currentVersion = CURRENT_VERSION;

                // Prefer installed binary version for native apps to avoid comparing against server JS version.
                if (isNative) {
                    try {
                        const info = await App.getInfo();
                        if (info?.version) {
                            currentVersion = info.version;
                        }
                    } catch {
                        // Fall back to CURRENT_VERSION when native app info is unavailable.
                    }
                }

                // Fetch the remote version config
                // Using a cache breaker to ensure we get the latest
                const response = await fetch(`/app-version.json?t=${Date.now()}`);
                if (!response.ok) return;

                const data: VersionConfig = await response.json();
                const downloadUrl = data.url || data.downloadUrl;
                if (!downloadUrl) return;

                // Compare remote latest version against installed/current version.
                const hasNewer = isVersionGreater(data.version, currentVersion);

                if (hasNewer) {
                    setUpdateInfo({ ...data, url: downloadUrl });
                    setIsVisible(true);

                    // Check for force update
                    if (data.force_update) {
                        setIsForceUpdate(true);
                    } else if (data.min_version && isVersionGreater(data.min_version, currentVersion)) {
                        // If current version is below min_version, force update.
                        setIsForceUpdate(true);
                    }
                }
            } catch (error) {
                console.error('Update check failed:', error);
            }
        };

        checkUpdate();
    }, []);

    const handleUpdate = () => {
        if (updateInfo?.url) {
            window.open(updateInfo.url, '_blank');
        }
    };

    const handleClose = () => {
        if (!isForceUpdate) {
            setIsVisible(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && updateInfo && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header Banner */}
                        <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                            </div>
                            
                            <motion.div 
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl"
                            >
                                <Download className="text-white w-10 h-10" />
                            </motion.div>

                            {!isForceUpdate && (
                                <button 
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                    New Version Available
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                                    {updateInfo.name}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                {isForceUpdate ? 'Important Update Required' : 'A Fresh Update is Ready!'}
                            </h2>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                                    "{updateInfo.description || 'Improve your experience with our latest performance enhancements and bug fixes.'}"
                                </p>
                            </div>

                            {isForceUpdate && (
                                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30 mb-6 text-xs leading-tight">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <p>This version includes critical security or compatibility updates. You must update to continue using the app.</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleUpdate}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <Sparkles size={18} />
                                    <span>Update Now</span>
                                    <ChevronRight size={18} />
                                </button>
                                
                                {!isForceUpdate && (
                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    >
                                        Maybe Later
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Footer info */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center whitespace-nowrap overflow-hidden">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Current: {CURRENT_VERSION}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Latest: {updateInfo.version}
                            </span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
