"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/lib/next-navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Lock, Globe, Shield } from 'lucide-react-native';
import { Link } from 'expo-router';

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
            <View className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 pb-20 flex-row">
                <View className="animate-pulse flex flex-col items-center gap-4">
                    <View className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></View>
                </View>
            </View>
        );
    }

    return (
        <View className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 sticky top-0 z-10 shadow-sm flex items-center gap-4 flex-row">
                <Link href="/settings" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={24} className="text-slate-700 dark:text-slate-300" />
                </Link>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</Text>
            </View>

            <View className="px-4 py-6 max-w-2xl mx-auto space-y-6">
                <View className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <View className="flex items-center justify-between flex-row">
                        <View className="flex items-start gap-4 flex-row">
                            <View className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                {isPrivate ? <Lock size={24} /> : <Globe size={24} />}
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                    Private Account
                                </Text>
                                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                    When your account is private, only people you approve can see your posts and followers. Your ranks and badges will still be visible.
                                </Text>
                            </View>
                        </View>
                        <View
                            onPress={handleToggleClick}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isPrivate ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <Text className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Full Screen Confirmation Modal */}
            {showConfirmModal && pendingToggle !== null && (
                <View className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-950 p-6 animate-in fade-in duration-300 flex-row">
                    <View className="max-w-md w-full space-y-8 text-center">
                        <View className="mx-auto w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 flex-row">
                            {pendingToggle ? <Lock size={48} /> : <Globe size={48} />}
                        </View>
                        
                        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                            {pendingToggle ? "Switch to Private?" : "Switch to Public?"}
                        </Text>
                        
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-left border border-slate-200 dark:border-slate-800 space-y-4">
                            <View className="flex gap-4 flex-row">
                                <Shield className="text-indigo-500 flex-shrink-0 mt-1 flex-row" size={20} />
                                <View>
                                    <Text className="font-semibold text-slate-900 dark:text-white">
                                        {pendingToggle ? "Follow Requests" : "Anyone can follow"}
                                    </Text>
                                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                                        {pendingToggle 
                                            ? "New followers must send a request and be approved by you." 
                                            : "Anyone will be able to follow you immediately."}
                                    </Text>
                                </View>
                            </View>
                            
                            <View className="flex gap-4 flex-row">
                                <Lock className="text-indigo-500 flex-shrink-0 mt-1 flex-row" size={20} />
                                <View>
                                    <Text className="font-semibold text-slate-900 dark:text-white">
                                        {pendingToggle ? "Hidden Posts & Followers" : "Public Profile"}
                                    </Text>
                                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                                        {pendingToggle 
                                            ? "Only approved followers can see your posts and followers." 
                                            : "Anyone can see your posts and who follows you."}
                                    </Text>
                                </View>
                            </View>
                            
                            <View className="flex gap-4 flex-row">
                                <Globe className="text-indigo-500 flex-shrink-0 mt-1 flex-row" size={20} />
                                <View>
                                    <Text className="font-semibold text-slate-900 dark:text-white">
                                        Ranks & Badges remain public
                                    </Text>
                                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                                        Your achievements, ranks, and solved questions are always visible.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="pt-6 space-y-3">
                            <View
                                onPress={confirmToggle}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                Confirm Switch
                            </View>
                            <View
                                onPress={() => setShowConfirmModal(false)}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-lg transition-colors"
                            >
                                Cancel
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
