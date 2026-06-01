import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Image } from 'react-native';
import { Bell, CheckCheck, Trash2, X, UserPlus, CheckCircle2, XCircle, Zap, BookOpen, Sparkles, Swords, MessageSquare, ArrowRight, Users, BarChart3, AtSign } from 'lucide-react-native';
// import { supabase } from '@/lib/supabaseClient'; // Stubbed for now
import { useRouter } from 'expo-router';

// Dummy implementation for now to prevent errors
export default function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('All');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const markAllRead = () => setUnreadCount(0);
    const clearAll = () => setNotifications([]);

    return (
        <View className="relative z-50">
            <TouchableOpacity
                onPress={() => {
                    if (isMobile) {
                        router.push('/notifications');
                        return;
                    }
                    setOpen(!open);
                }}
                className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800/80 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
            >
                <Bell size={20} className="text-slate-700 dark:text-slate-200" />
                {unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full items-center justify-center px-1 border-2 border-white">
                        <Text className="text-white text-[9px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade">
                <TouchableOpacity className="flex-1" onPress={() => setOpen(false)}>
                    <View className="absolute top-14 right-4 w-[350px] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        
                        <View className="bg-indigo-700 p-5 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <Bell size={20} color="white" />
                                <Text className="text-white font-black text-lg">Notifications</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={markAllRead} className="p-1.5 rounded-lg bg-white/10">
                                        <CheckCheck size={16} color="white" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setOpen(false)} className="p-1.5 rounded-lg bg-white/10">
                                    <X size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
                            {['All', 'Unread', 'Help Requests'].map(f => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-full border ${filter === f ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                                >
                                    <Text className={`text-[11px] font-black ${filter === f ? 'text-white' : 'text-slate-500'}`}>{f.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView className="max-h-[400px] bg-white dark:bg-slate-950">
                            <View className="items-center justify-center py-16 px-10 gap-4">
                                <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center border-2 border-slate-100">
                                    <Sparkles size={32} color="#cbd5e1" />
                                </View>
                                <View className="items-center">
                                    <Text className="text-slate-800 font-black text-sm uppercase">Status: Clear</Text>
                                    <Text className="text-slate-400 text-[10px] font-bold">No new notifications in this sector.</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 flex-row items-center justify-between">
                            <TouchableOpacity onPress={clearAll} className="flex-row items-center gap-1.5">
                                <Trash2 size={12} color="#94a3b8" />
                                <Text className="text-[10px] font-black text-slate-400 uppercase">Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setOpen(false); router.push('/notifications'); }} className="flex-row items-center gap-1.5">
                                <Text className="text-[10px] font-black text-indigo-600 uppercase">See All</Text>
                                <ArrowRight size={12} color="#4f46e5" />
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
