import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/lib/next-navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lock, EyeOff, Eye, ShieldCheck, Loader2 } from 'lucide-react-native';
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
        <View className="min-h-[100dvh] bg-white flex flex-col lg:flex-row relative overflow-hidden">
            {/* Mobile Back Button - Native Android feel */}
            <View className="lg:hidden fixed top-0 left-0 right-0 z-[60] px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pointer-events-none">
                <View 
                    onPress={() => router.back()}
                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-200 text-slate-800 active:scale-90 transition-transform flex-row"
                >
                    <Check className="w-5 h-5 text-gray-500" />
                </View>
            </View>

            {/* Branding Section - Full Screen Left */}
            <BrandingSection
                title="Secure Your Account"
                subtitle="A strong password is your best defense in the war of wits."
            />

            {/* Form Section - Full Screen Right */}
            <View className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 bg-white relative z-10 transition-all">
                <View className="w-full max-w-sm space-y-8 animate-slideUp">
                    <View className="lg:hidden flex justify-center mb-4 flex-row">
                        <Logo width={100} height={100} showTagline={false} />
                    </View>

                    <View className="text-center lg:text-left">
                        <Text className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                            New Password
                        </Text>
                        <Text className="mt-3 text-base text-slate-500 font-medium">
                            Type your new secure password below to regain access to your sanctum.
                        </Text>
                    </View>

                    {success ? (
                        <View className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center animate-in zoom-in-95 shadow-sm">
                            <View className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 flex-row">
                                <ShieldCheck className="w-10 h-10 text-emerald-600" />
                            </View>
                            <Text className="text-xl font-bold text-slate-900 mb-2">Password Updated!</Text>
                            <Text className="text-slate-600 font-medium mb-0">
                                Redirecting you safely...
                            </Text>
                        </View>
                    ) : (
                        <View className="mt-8 space-y-5" onPress={handleSubmit}>
                            <View className="group">
                                <Text id="password" className="block text-sm font-bold text-slate-700 mb-2 ml-1">Secure Password</Text>
                                <View className="relative">
                                    <View className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none flex-row">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </View>
                                    <TextInput
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-12 pr-12 py-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all hover:bg-slate-50"
                                        placeholder="Min 6 characters"
                                    />
                                    <View
                                        type="button"
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 active:scale-95 transition-all flex-row"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-white bg-slate-900 hover:bg-black shadow-lg shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-60 flex-row"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Updating...
                                    </>
                                ) : 'Save New Password'}
                            </View>

                            {error && <View className="text-sm font-bold text-red-600 text-center bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">{error}</View>}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
