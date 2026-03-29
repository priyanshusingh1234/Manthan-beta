"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    User,
    Shield,
    FileText,
    CircleHelp,
    LogOut,
    Settings as SettingsIcon,
    ChevronRight,
    Bell,
    Moon,
    Sun,
    Info
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from 'next-themes';
import { VERSION_NAME } from '@/lib/version';

export default function SettingsPage() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserEmail(user.email ?? null);
            }
            setLoading(false);
        });
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuGroups = [
        {
            title: "Account",
            items: [
                { icon: User, label: "My Profile", href: "/profile", description: "View and edit your profile" },
                { icon: Bell, label: "Notifications", href: "/settings/notifications", description: "Manage notification preferences" },
                { icon: Moon, label: "Appearance", href: "#", description: "Dark mode and theme settings" },
            ]
        },
        {
            title: "Support & About",
            items: [
                { icon: CircleHelp, label: "Help & Support", href: "/contact", description: "Get help with Dheeyudhha" },
                { icon: FileText, label: "Documentation", href: "/docs", description: "Read the user guides" },
                { icon: Shield, label: "Privacy Policy", href: "/privacy", description: "How we protect your data" },
                { icon: Info, label: "Terms of Service", href: "/about", description: "Rules and agreements" },
            ]
        }
    ];

    if (loading) {
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
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <SettingsIcon size={24} className="animate-[spin_4s_linear_infinite]" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                </div>

                {userEmail && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-lg shadow-inner">
                            {userEmail.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
                            <p className="text-slate-900 dark:text-white font-semibold truncate max-w-[200px]">{userEmail}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Menu Groups */}
            <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto">
                {menuGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-3">
                        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                            {group.title}
                        </h2>
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
                            {group.items.map((item, itemIdx) => {
                                const isAppearance = item.label === "Appearance";
                                const Icon = isAppearance && mounted && theme === "dark" ? Sun : item.icon;
                                
                                const content = (
                                    <>
                                        <div className={`p-2.5 rounded-xl transition-colors ${isAppearance ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover/item:text-indigo-600 group-hover/item:bg-indigo-50 dark:group-hover/item:text-indigo-400 dark:group-hover/item:bg-indigo-900/30'}`}>
                                            <Icon size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="ml-4 flex-1 text-left">
                                            <p className="text-slate-900 dark:text-slate-200 font-semibold text-[15px]">
                                                {isAppearance && mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : item.label}
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                                {item.description}
                                            </p>
                                        </div>
                                        {isAppearance ? (
                                            <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${mounted && theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute transition-transform ${mounted && theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </div>
                                        ) : (
                                            <ChevronRight size={20} className="text-slate-400 group-hover/item:translate-x-1 group-hover/item:text-indigo-500 transition-all" />
                                        )}
                                    </>
                                );

                                if (isAppearance) {
                                    return (
                                        <button
                                            key={itemIdx}
                                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                            className="w-full flex items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/item"
                                        >
                                            {content}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={itemIdx}
                                        href={item.href}
                                        className="flex items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/item"
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Action Group */}
                <div className="pt-4">
                    <button
                        onClick={handleSignOut}
                        className="w-full bg-white dark:bg-slate-900 flex items-center justify-between px-6 py-4 rounded-3xl shadow-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-white dark:group-hover:bg-red-900/50 transition-colors">
                                <LogOut size={20} strokeWidth={2.5} />
                            </div>
                            <span className="font-semibold text-[15px]">Sign Out</span>
                        </div>
                    </button>
                </div>

                <div className="text-center pb-8 pt-4">
                    <p className="text-xs font-semibold text-slate-400 tracking-wider">
                        Dheeyudhha {VERSION_NAME}
                    </p>
                </div>
            </div>
        </div>
    );
}
