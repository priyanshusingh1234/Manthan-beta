import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useState } from "react";
import { 
    Trophy, Flame, Zap, Shield, Grid, Activity, Award, UserPlus, MessageCircle, Star, Target, CheckCircle2
} from 'lucide-react-native';
import TeacherBadge from "@/ticks/teacher";

export default function ProfileDemoPage() {
    const [isTeacher, setIsTeacher] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Dummy Data
    const profile = {
        name: isTeacher ? "Prof. Priyanshu" : "Priyanshu Singh",
        username: isTeacher ? "prof_priyanshu" : "priyanshu_dev",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Priyanshu",
        banner: "/banners/cyberpunk.png", // Using the banner we made earlier
        school: "Delhi Public School",
        classGrade: "Class 10",
        xp: 12450,
        level: 42,
        points: 850,
        streak: 15,
        duelsWon: 48,
        questionsSolved: 312,
        questionsCreated: isTeacher ? 145 : 0,
        followers: 1205,
        following: 34
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <View className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-white pb-24 overflow-x-hidden">
            {/* Top Configurator (Just for Demo Purposes) */}
            <View className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                <Text className="text-xs font-bold text-slate-500 uppercase">Demo Controls</Text>
                <View className="flex gap-2 flex-row">
                    <View 
                        onPress={() => setIsTeacher(false)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${!isTeacher ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                        Student View
                    </View>
                    <View 
                        onPress={() => setIsTeacher(true)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${isTeacher ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                        Teacher View
                    </View>
                </View>
            </View>

            {/* HEADER / BANNER SECTION */}
            <View className="relative h-64 sm:h-80 w-full group">
                <View className="absolute inset-0 bg-slate-900 overflow-hidden">
                    {/* fallback gradient */}
                    <View className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900 opacity-50" />
                    <Image 
                        src={profile.banner} 
                        alt="Profile Banner" 
                        className="w-full h-full object-cover opacity-80 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
                    />
                    {/* Bottom fade for smooth transition to background */}
                    <View className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-[#0a0f1c] to-transparent" />
                </View>

                {/* Navbar/Actions Overlay */}
                <View className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 flex-row">
                    <View className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition flex-row">
                        <Grid className="w-5 h-5" />
                    </View>
                    <View className="flex gap-2 flex-row">
                        <View className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 font-medium text-sm hover:bg-white/20 transition flex items-center gap-2 flex-row">
                            <MessageCircle className="w-4 h-4" /> Message
                        </View>
                        <View className="px-4 py-2 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30 flex items-center gap-2 flex-row">
                            <UserPlus className="w-4 h-4" /> Follow
                        </View>
                    </View>
                </View>
            </View>

            {/* MAIN PROFILE CONTENT */}
            <View className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 -mt-24 sm:-mt-32">
                <View 
                    initial="hidden"
                    animate="show"
                    variants={containerVariants}
                    className="flex flex-col gap-6"
                >
                    {/* Identity Card */}
                    <View variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
                        {/* Avatar */}
                        <View className="relative shrink-0">
                            <View className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/30">
                                <View className="w-full h-full bg-white dark:bg-slate-900 rounded-full p-1 overflow-hidden">
                                    <Image src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full bg-slate-100 dark:bg-slate-800" />
                                </View>
                            </View>
                            <View className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 rounded-full text-sm font-black border-4 border-white dark:border-slate-900 shadow-sm flex items-center gap-1.5 flex-row">
                                <Star className="w-3.5 h-3.5 fill-current" /> LVL {profile.level}
                            </View>
                        </View>

                        {/* Info */}
                        <View className="flex-1 text-center sm:text-left mt-2 sm:mt-0 flex-row">
                            <Text className="text-3xl sm:text-5xl font-black tracking-tight mb-2 flex items-center justify-center sm:justify-start gap-3 flex-row">
                                {profile.name}
                                {isTeacher && <TeacherBadge />}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-4 flex items-center justify-center sm:justify-start gap-2 flex-row">
                                @{profile.username} • {profile.school}
                            </Text>

                            <View className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-6 flex-row">
                                {isTeacher ? (
                                    <Text className="px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-bold border border-indigo-200 dark:border-indigo-500/20">
                                        Educator
                                    </Text>
                                ) : (
                                    <Text className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-500/20">
                                        Student • {profile.classGrade}
                                    </Text>
                                )}
                                <Text className="px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-bold border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5 flex-row">
                                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" /> {profile.streak} Day Streak
                                </Text>
                            </View>

                            <View className="flex items-center justify-center sm:justify-start gap-8 flex-row">
                                <View className="text-center sm:text-left">
                                    <View className="text-2xl font-black">{profile.followers}</View>
                                    <View className="text-xs font-bold text-slate-500 uppercase tracking-wider">Followers</View>
                                </View>
                                <View className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                                <View className="text-center sm:text-left">
                                    <View className="text-2xl font-black">{profile.following}</View>
                                    <View className="text-xs font-bold text-slate-500 uppercase tracking-wider">Following</View>
                                </View>
                                <View className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                                <View className="text-center sm:text-left">
                                    <View className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{profile.xp.toLocaleString()}</View>
                                    <View className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total XP</View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <View className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                            <View className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                            <Trophy className="w-8 h-8 text-amber-100 mb-4" />
                            <View className="text-3xl font-black mb-1">{profile.points}</View>
                            <View className="text-sm font-bold text-amber-100/90 uppercase tracking-wide">Arena Points</View>
                        </View>
                        
                        <View className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                            <View className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                            <Shield className="w-8 h-8 text-violet-200 mb-4" />
                            <View className="text-3xl font-black mb-1">{profile.duelsWon}</View>
                            <View className="text-sm font-bold text-violet-200/90 uppercase tracking-wide">Duels Won</View>
                        </View>

                        <View className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                            <View className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                            <CheckCircle2 className="w-8 h-8 text-blue-200 mb-4" />
                            <View className="text-3xl font-black mb-1">{profile.questionsSolved}</View>
                            <View className="text-sm font-bold text-blue-200/90 uppercase tracking-wide">Solved</View>
                        </View>

                        {isTeacher ? (
                            <View className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                                <View className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                                <Target className="w-8 h-8 text-emerald-200 mb-4" />
                                <View className="text-3xl font-black mb-1">{profile.questionsCreated}</View>
                                <View className="text-sm font-bold text-emerald-200/90 uppercase tracking-wide">Created</View>
                            </View>
                        ) : (
                            <View className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                                <View className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                                <Award className="w-8 h-8 text-rose-200 mb-4" />
                                <View className="text-3xl font-black mb-1">Top 5%</View>
                                <View className="text-sm font-bold text-rose-200/90 uppercase tracking-wide">School Rank</View>
                            </View>
                        )}
                    </View>

                    {/* Tabs Area */}
                    <View variants={itemVariants} className="mt-4">
                        <View className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-fit mb-6 flex-row">
                            <View 
                                onPress={() => setActiveTab('overview')}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Overview
                            </View>
                            <View 
                                onPress={() => setActiveTab('activity')}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'activity' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Activity
                            </View>
                            {isTeacher && (
                                <View 
                                    onPress={() => setActiveTab('content')}
                                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'content' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Content
                                </View>
                            )}
                        </View>

                        {/* Content Area */}
                        <View className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px] flex items-center justify-center text-center flex-row">
                            <View className="max-w-sm">
                                <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 flex-row">
                                    <Activity className="w-8 h-8 text-slate-400" />
                                </View>
                                <Text className="text-xl font-bold mb-2">{activeTab === 'overview' ? 'Recent Achievements' : activeTab === 'activity' ? 'Activity Timeline' : 'Uploaded Questions'}</Text>
                                <Text className="text-slate-500 dark:text-slate-400">
                                    This area will be populated with a rich list of {activeTab} pulled directly from the database. 
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
