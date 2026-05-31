import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'expo-router';
import {
    BookOpen, Users, Trophy, GraduationCap, User, PlusCircle,
    LogIn, UserPlus, Search, Star, Zap, Shield, ChevronRight,
    MessageCircle, Target, Award, Sword, Bell, Link2, Sparkles,
    ArrowUp
} from 'lucide-react-native';

const sections = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'getting-started', label: 'Getting Started', icon: LogIn },
    { id: 'student-profile', label: 'Student Profile', icon: User },
    { id: 'teacher-profile', label: 'Teacher Profile', icon: GraduationCap },
    { id: 'follow-system', label: 'Follow System', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'dheeyudha', label: 'Peer vs Peer (Dheeyudha)', icon: Sword },
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'point-system', label: 'Points & Penalties', icon: Zap },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'ai-review', label: 'AI Submission Review', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'navigation', label: 'Navigation & Links', icon: Link2 },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
];

const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => {
    const colors: Record<string, string> = {
        green: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
        blue: 'bg-blue-100   text-blue-700   ring-1 ring-blue-200',
        purple: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
        amber: 'bg-amber-100  text-amber-700  ring-1 ring-amber-200',
        red: 'bg-red-100    text-red-700    ring-1 ring-red-200',
        slate: 'bg-slate-100  text-slate-700  ring-1 ring-slate-200',
    };
    return (
        <Text className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colors[color] || colors.slate}`}>
            {children}
        </Text>
    );
};

const FeatureCard = ({ icon: Icon, title, children, color = 'indigo' }: { icon: any; title: string; children: React.ReactNode; color?: string }) => {
    const gradients: Record<string, string> = {
        indigo: 'from-indigo-500/10 to-blue-500/10 border-indigo-100',
        purple: 'from-purple-500/10 to-pink-500/10 border-purple-100',
        emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-100',
        amber: 'from-amber-500/10 to-orange-500/10 border-amber-100',
    };
    const iconBg: Record<string, string> = {
        indigo: 'bg-indigo-100 text-indigo-600',
        purple: 'bg-purple-100 text-purple-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
    };
    return (
        <View className={`rounded-2xl bg-gradient-to-br border p-5 ${gradients[color] || gradients.indigo}`}>
            <View className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg[color] || iconBg.indigo}`}>
                <Icon className="w-5 h-5" />
            </View>
            <Text className="font-bold text-slate-800 mb-1">{title}</Text>
            <Text className="text-sm text-slate-600 leading-relaxed">{children}</Text>
        </View>
    );
};

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('overview');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);

            const sectionIds = sections.map(s => s.id);
            for (const id of [...sectionIds].reverse()) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 140) {
                    setActiveSection(id);
                    break;
                }
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <View className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

            {/* Main Layout */}
            <View className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <View className="flex gap-10 flex-row">

                    {/* Sticky Sidebar */}
                    <View className="hidden lg:block w-60 shrink-0">
                        <View className="sticky top-28 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm p-4 space-y-1">
                            <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-3">Contents</Text>
                            {sections.map(({ id, label, icon: Icon }) => (
                                <View
                                    key={id}
                                    onPress={() => scrollTo(id)}
                                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeSection === id
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <Text className="truncate">{label}</Text>
                                    {activeSection === id && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Content */}
                    <View ref={contentRef} className="flex-1 min-w-0 space-y-20 flex-row">

                        {/* ── Overview ── */}
                        <View id="overview" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-row">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Overview</Text>
                            </View>
                            <Text className="text-slate-600 leading-relaxed text-lg mb-8">
                                <Text>Dheeyudha</Text> is a real-time competitive quiz platform designed for Indian students and teachers. It blends social features (profiles, follows, leaderboards) with academic content (teacher-posted questions, subject-based quizzes) to make learning engaging and competitive.
                            </Text>
                            <View className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FeatureCard icon={Zap} title="Competitive Quizzes" color="amber">Challenge other students in real-time quiz battles, earn points, and climb the leaderboard.</FeatureCard>
                                <FeatureCard icon={GraduationCap} title="Teacher-Curated Content" color="purple">Verified teachers post questions across subjects and grades that students can attempt anytime.</FeatureCard>
                                <FeatureCard icon={Users} title="Social Learning" color="emerald">Follow students and teachers, see who you're following, and build your academic network.</FeatureCard>
                                <FeatureCard icon={Trophy} title="Global Leaderboard" color="amber">A live global ranking board that tracks every student's performance and rewards top scorers.</FeatureCard>
                                <FeatureCard icon={Target} title="Subject Mastery" color="indigo">Track how many subjects you've mastered and view your overall progress in a visual dashboard.</FeatureCard>
                                <FeatureCard icon={Shield} title="Secure & Private" color="emerald">Built on Supabase with Row-Level Security — your data is always protected.</FeatureCard>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Getting Started ── */}
                        <View id="getting-started" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 flex-row">
                                    <LogIn className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Getting Started</Text>
                            </View>

                            <View className="space-y-6">
                                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg flex-row">
                                        <UserPlus className="w-5 h-5 text-indigo-500" /> Creating an Account
                                    </Text>
                                    <View className="space-y-4 text-slate-600 text-sm leading-relaxed">
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs flex-row">1</Text>
                                            <Text>Go to <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">/signup</Link> and enter your full name, email, and password.</Text>
                                        </View>
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs flex-row">2</Text>
                                            <Text>Choose a unique <Text>username</Text> — lowercase, no spaces (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">rahul_sharma</code>). This becomes your public profile URL.</Text>
                                        </View>
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs flex-row">3</Text>
                                            <Text>Confirm your email through the verification link sent to your inbox.</Text>
                                        </View>
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs flex-row">4</Text>
                                            <Text>Sign in at <Link href="/login" className="text-indigo-600 font-semibold hover:underline">/login</Link> and you're in!</Text>
                                        </View>
                                    </View>
                                    <View className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 flex gap-2 flex-row">
                                        <Text>⚠️</Text>
                                        <Text>Usernames can be updated up to <Text>4 times per 30 days</Text> from your profile page — choose carefully!</Text>
                                    </View>
                                </View>

                                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg flex-row">
                                        <GraduationCap className="w-5 h-5 text-indigo-500" /> Teacher Accounts
                                    </Text>
                                    <Text className="text-slate-600 text-sm leading-relaxed mb-4">
                                        Teachers have a separate verification process to maintain content quality. To apply for a Teacher account:
                                    </Text>
                                    <View className="space-y-3 text-slate-600 text-sm leading-relaxed">
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs flex-row">1</Text>
                                            <Text>Create a regular student account first.</Text>
                                        </View>
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs flex-row">2</Text>
                                            <Text>Visit <Link href="/teacher/apply" className="text-indigo-600 font-semibold hover:underline">/teacher/apply</Link> and submit your application with subject details.</Text>
                                        </View>
                                        <View className="flex gap-3 flex-row">
                                            <Text className="flex-none w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs flex-row">3</Text>
                                            <Text>An admin reviews and approves your application. You'll receive a <Badge color="blue">✓ Verified Teacher</Badge> badge once approved.</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Student Profile ── */}
                        <View id="student-profile" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-row">
                                    <User className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Student Profile</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">Your public student profile is accessible at <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-base font-mono font-bold">/user/[username]</code>. It showcases your achievements, stats, and social metrics.</Text>

                            <View className="grid sm:grid-cols-2 gap-4 mb-6">
                                {[
                                    { icon: User, title: 'Avatar & Banner', desc: 'Upload a custom profile photo and banner image. Click the edit button on hover to change them. Images are cropped interactively before upload.' },
                                    { icon: Star, title: 'Name & Username', desc: 'Edit your display name or username directly on your profile. Username changes are rate-limited to 4 per month to prevent abuse.' },
                                    { icon: Trophy, title: 'Global Rank Badge', desc: 'Your current global ranking is always visible on your profile with a bold rank card (Gold / Silver / Bronze / etc.).' },
                                    { icon: Target, title: 'Stats Grid', desc: 'See your Battles Won, Win Rate, Current Streak, and total Points at a glance in a 4-card grid.' },
                                    { icon: Award, title: 'Achievements', desc: 'A visual list of badges you have earned (e.g. First Victory, Battle Master, Quiz Genius). Locked achievements are shown greyed out.' },
                                    { icon: Sword, title: 'Recent Battles', desc: 'The last three quiz battles you have participated in, showing your opponent, subject, score, and outcome.' },
                                ].map(f => (
                                    <View key={f.title} className="flex gap-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex-row">
                                        <View className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 flex-row">
                                            <f.icon className="w-4 h-4" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-slate-800 text-sm">{f.title}</Text>
                                            <Text className="text-xs text-slate-500 leading-relaxed mt-0.5">{f.desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800 flex gap-2 flex-row">
                                <Text>💡</Text>
                                <Text>Anyone can visit your public profile at <Text>/user/your-username</Text> — even without an account.</Text>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Teacher Profile ── */}
                        <View id="teacher-profile" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-200 flex-row">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Teacher Profile</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">Teacher profiles are at <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg text-base font-mono font-bold">/teacher/[username]</code>. They display the teacher's identity and all their created questions.</Text>

                            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                {[
                                    ['Verified Badge', 'A blue ✓ "Verified Instructor" badge appears next to the teacher\'s name, built for trust at a glance.'],
                                    ['Main Subject', 'The teacher\'s primary teaching subject is highlighted alongside the instructor badge.'],
                                    ['Posted Questions', 'All questions the teacher has published are listed in a responsive grid on their profile page for students to attempt.'],
                                    ['Follow Button', 'Students (and other teachers) can follow a teacher to stay updated. The teacher\'s follower and following counts are displayed.'],
                                ].map(([title, desc]) => (
                                    <View key={title} className="flex gap-4 items-start flex-row">
                                        <View className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                        <View>
                                            <Text className="font-bold text-slate-800">{title}: </Text>
                                            <Text className="text-slate-600 text-sm">{desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Follow System ── */}
                        <View id="follow-system" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200 flex-row">
                                    <Users className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Follow System</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">Dheeyudha has a full social follow system. You can follow both students and teachers, and see who follows you.</Text>

                            <View className="grid sm:grid-cols-3 gap-4 mb-6">
                                {[
                                    { icon: UserPlus, color: 'bg-pink-100 text-pink-600', title: 'Follow / Unfollow', desc: 'Click the Follow button on any profile. It toggles with a smooth animation — hover to see the Unfollow state.' },
                                    { icon: Users, color: 'bg-rose-100 text-rose-600', title: 'Followers & Following Counts', desc: 'Both counts are displayed prominently below the bio on every profile. The counts update in real-time.' },
                                    { icon: Search, color: 'bg-fuchsia-100 text-fuchsia-600', title: 'User List Modals', desc: 'Click on the Followers or Following count to open a modal showing the full list with profile links.' },
                                ].map(f => (
                                    <View key={f.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                        <View className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                                            <f.icon className="w-4 h-4" />
                                        </View>
                                        <Text className="font-bold text-slate-800 text-sm mb-1">{f.title}</Text>
                                        <Text className="text-xs text-slate-500 leading-relaxed">{f.desc}</Text>
                                    </View>
                                ))}
                            </View>

                            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <Text className="font-bold text-slate-800 mb-3">Rules & Notes</Text>
                                <View className="space-y-2 text-sm text-slate-600">
                                    <View className="flex gap-2 flex-row"><Text className="text-emerald-500">✓</Text> You can follow both students and teachers.</View>
                                    <View className="flex gap-2 flex-row"><Text className="text-emerald-500">✓</Text> Clicking a user in the followers/following modal navigates directly to their profile.</View>
                                    <View className="flex gap-2 flex-row"><Text className="text-slate-400">—</Text> You cannot follow yourself — the Follow button is hidden on your own profile.</View>
                                    <View className="flex gap-2 flex-row"><Text className="text-slate-400">—</Text> Following is not mutual: following someone does not automatically make them follow you back.</View>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Leaderboard ── */}
                        <View id="leaderboard" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200 flex-row">
                                    <Trophy className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Leaderboard</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">The <Link href="/leaderboard" className="text-indigo-600 font-semibold hover:underline">Global Leaderboard</Link> ranks all students by their total earned points.</Text>
                            <View className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { medal: '🥇', rank: '1st Place', desc: 'Gold rank. Displayed as #1 on the global board.', color: 'bg-amber-50 border-amber-200' },
                                    { medal: '🥈', rank: '2nd Place', desc: 'Silver rank. Close to the top!', color: 'bg-slate-50 border-slate-200' },
                                    { medal: '🥉', rank: '3rd Place', desc: 'Bronze rank.', color: 'bg-orange-50 border-orange-200' },
                                ].map(r => (
                                    <View key={r.rank} className={`rounded-2xl border p-5 text-center ${r.color}`}>
                                        <View className="text-4xl mb-2">{r.medal}</View>
                                        <View className="font-black text-slate-800">{r.rank}</View>
                                        <View className="text-xs text-slate-500 mt-1">{r.desc}</View>
                                    </View>
                                ))}
                            </View>
                            <View className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm text-slate-600">
                                Points are awarded by attempting and solving teacher-posted questions correctly. The more questions you solve — and the faster — the higher you rank.
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Peer vs Peer (Dheeyudha) ── */}
                        <View id="dheeyudha" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-200 flex-row">
                                    <Sword className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Peer vs Peer (Dheeyudha)</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">
                                "Dheeyudha" translates to "War of Wits". This is the core competitive feature of Dheeyudha, allowing you to challenge other students to a real-time quiz battle.
                            </Text>
                            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg flex-row">
                                    <Target className="w-5 h-5 text-indigo-500" /> Declaring a War
                                </Text>
                                <View className="space-y-4 text-slate-600 text-sm leading-relaxed">
                                    <View className="flex gap-3 flex-row">
                                        <Text className="flex-none w-6 h-6 rounded-full bg-red-100 text-red-700 font-black flex items-center justify-center text-xs flex-row">1</Text>
                                        <Text>From the homepage, use the "Challenge a Peer" feature to find an opponent. You can search by username or school.</Text>
                                    </View>
                                    <View className="flex gap-3 flex-row">
                                        <Text className="flex-none w-6 h-6 rounded-full bg-red-100 text-red-700 font-black flex items-center justify-center text-xs flex-row">2</Text>
                                        <Text>Once you've selected an opponent, you can "Declare War".</Text>
                                    </View>
                                    <View className="flex gap-3 flex-row">
                                        <Text className="flex-none w-6 h-6 rounded-full bg-red-100 text-red-700 font-black flex items-center justify-center text-xs flex-row">3</Text>
                                        <Text>The opponent will be notified of your challenge.</Text>
                                    </View>
                                </View>
                                <View className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 flex gap-2 flex-row">
                                    <Text>⚔️</Text>
                                    <Text>Winning battles is a key way to earn points and climb the leaderboard. Your win/loss record is displayed on your profile.</Text>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Questions ── */}
                        <View id="questions" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-row">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Questions</Text>
                            </View>

                            <View className="space-y-4">
                                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 flex-row">
                                        <PlusCircle className="w-5 h-5 text-indigo-500" /> Posting Questions (Teachers Only)
                                    </Text>
                                    <Text className="text-slate-600 text-sm leading-relaxed mb-4">Verified teachers can create questions at <Link href="/questions/create" className="text-indigo-600 font-semibold hover:underline">/questions/create</Link>.</Text>
                                    <View className="grid sm:grid-cols-2 gap-3">
                                        {[
                                            ['Title', 'A short descriptive title for the question.'],
                                            ['Body', 'The full question text (supports multi-line).'],
                                            ['Subject & Grade', 'Select the subject (Math, Science, etc.) and target class grade.'],
                                            ['Difficulty', 'Easy / Medium / Hard — shown as a coloured badge on the card.'],
                                            ['Options & Answer', 'Up to 4 MCQ options with one correct answer marked.'],
                                            ['Points', 'Points awarded to students who answer correctly.'],
                                            ['Time Limit', 'Optional time limit in minutes for the question.'],
                                            ['Image Attachment', 'Optionally attach a diagram or image to the question.'],
                                        ].map(([k, v]) => (
                                            <View key={k} className="flex gap-2 text-sm flex-row">
                                                <Text className="font-bold text-indigo-600 shrink-0">{k}:</Text>
                                                <Text className="text-slate-600">{v}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 flex-row">
                                        <Target className="w-5 h-5 text-indigo-500" /> Attempting Questions (Students)
                                    </Text>
                                    <View className="space-y-2 text-sm text-slate-600">
                                        <View className="flex gap-2 flex-row"><Text className="text-indigo-500">→</Text> Browse all available questions from the home dashboard or teacher profiles.</View>
                                        <View className="flex gap-2 flex-row"><Text className="text-indigo-500">→</Text> Click <Text>Attempt</Text> on a question card to start solving it.</View>
                                        <View className="flex gap-2 flex-row"><Text className="text-indigo-500">→</Text> Submit your answer within the time limit to earn points.</View>
                                        <View className="flex gap-2 flex-row"><Text className="text-indigo-500">→</Text> Points are automatically added to your total and reflected on the leaderboard.</View>
                                    </View>
                                </View>

                                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 flex-row">
                                        <Sword className="w-5 h-5 text-indigo-500" /> Deleting Questions
                                    </Text>
                                    <Text className="text-sm text-slate-600">Teachers can delete their own questions using the <Text>⋯ menu</Text> on each question card. This is only visible to the question's creator.</Text>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Point System & Penalties ── */}
                        <View id="point-system" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 flex-row">
                                    <Zap className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Points & Penalties</Text>
                            </View>

                            <Text className="text-slate-600 text-lg mb-6">Dheeyudha uses a completely transparent and fair point system. You are rewarded for correct answers, but to prevent random guessing, higher-value questions carry a risk of negative marking.</Text>

                            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                                <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 flex-row">
                                    <Award className="w-5 h-5 text-indigo-500" /> Earning Points
                                </Text>
                                <Text className="text-slate-600 text-sm leading-relaxed">
                                    Every question posted by a teacher is assigned a specific point value based on its difficulty. Answering the question correctly before the timer runs out awards you the full points, which directly boost your Global Rank.
                                </Text>
                            </View>

                            <View className="bg-red-50/50 rounded-2xl border border-red-100 shadow-sm p-6">
                                <Text className="font-bold text-red-800 flex items-center gap-2 mb-4 text-lg flex-row">
                                    <Shield className="w-5 h-5 text-red-500" /> Flat-Tiered Negative Marking
                                </Text>
                                <Text className="text-slate-600 text-sm leading-relaxed mb-6">
                                    To maintain leaderboard integrity, incorrect guesses on high-reward questions result in a penalty. Dheeyudha uses a <Text>Flat-Tiered Deduction Scale</Text> — meaning 1-point questions don't carry harsh penalties, but major questions do.
                                </Text>

                                <View className="grid sm:grid-cols-2 gap-3 mb-6">
                                    {[
                                        ['1 to 4 Points', '0 Penalty', 'Safe to guess!'],
                                        ['5 to 9 Points', '-1 Point', 'Low risk.'],
                                        ['10 to 14 Points', '-2 Points', 'Moderate risk.'],
                                        ['15 to 19 Points', '-3 Points', 'Consider your answer.'],
                                        ['20 to 24 Points', '-4 Points', 'High risk.'],
                                        ['25 Points', '-5 Points', 'Maximum risk.'],
                                    ].map(([range, pen, desc]) => (
                                        <View key={range} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100 shadow-sm flex-row">
                                            <View>
                                                <View className="font-bold text-slate-800 text-sm">{range}</View>
                                                <View className="text-xs text-slate-400">{desc}</View>
                                            </View>
                                            <Badge color="red">{pen}</Badge>
                                        </View>
                                    ))}
                                </View>
                                <View className="bg-white/80 backdrop-blur border border-red-100 rounded-xl p-4 text-sm text-red-800 flex gap-2 flex-row">
                                    <Text>💡</Text>
                                    <Text><Text>Complete Transparency:</Text> The exact penalty risk is always displayed to you on a red badge *before* you answer a question.</Text>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Achievements ── */}
                        <View id="achievements" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200 flex-row">
                                    <Award className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Achievements</Text>
                            </View>
                            <View className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { icon: '🎖️', name: 'First Victory', desc: 'Win your very first quiz battle.' },
                                    { icon: '⚔️', name: 'Battle Master', desc: 'Win a total of 100 battles.' },
                                    { icon: '🧠', name: 'Quiz Genius', desc: 'Get a perfect score in 10 quizzes.' },
                                    { icon: '🔥', name: 'Streak Warrior', desc: 'Maintain a 30-day winning streak.' },
                                    { icon: '🏅', name: 'Top 50', desc: 'Reach the top 50 on the global leaderboard.' },
                                    { icon: '🏫', name: 'School Champion', desc: 'Become the top scorer in your school.' },
                                ].map(a => (
                                    <View key={a.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3 flex-row">
                                        <Text className="text-2xl">{a.icon}</Text>
                                        <View>
                                            <View className="font-bold text-slate-800 text-sm">{a.name}</View>
                                            <View className="text-xs text-slate-500 mt-0.5">{a.desc}</View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800 flex gap-2 flex-row">
                                <Text>💡</Text>
                                <Text>Earned achievements are shown with a green ✓ badge on your profile. Locked ones appear greyed out as goals.</Text>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── AI Submission Review ── */}
                        <View id="ai-review" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-200 flex-row">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">AI Submission Review</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">
                                Get instant, detailed feedback on your written submissions with our advanced AI-powered review system. This feature helps you understand your mistakes and improve your knowledge without waiting for a human checker.
                            </Text>
                            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg flex-row">
                                    <Zap className="w-5 h-5 text-indigo-500" /> How It Works
                                </Text>
                                <View className="space-y-4 text-slate-600 text-sm leading-relaxed">
                                    <View className="flex gap-3 flex-row">
                                        <Text className="flex-none w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-black flex items-center justify-center text-xs flex-row">1</Text>
                                        <Text>After completing a written question, you can request an AI review for your submission.</Text>
                                    </View>
                                    <View className="flex gap-3 flex-row">
                                        <Text className="flex-none w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-black flex items-center justify-center text-xs flex-row">2</Text>
                                        <Text>Our AI analyzes your answer for correctness, completeness, and clarity based on the question's context.</Text>
                                    </View>
                                    <View className="flex gap-3 flex-row">
                                        <Text className="flex-none w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-black flex items-center justify-center text-xs flex-row">3</Text>
                                        <Text>You receive a detailed report with a score, feedback on what you did right, and suggestions for improvement.</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Notifications ── */}
                        <View id="notifications" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200 flex-row">
                                    <Bell className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Notifications</Text>
                            </View>
                            <Text className="text-slate-600 text-lg mb-6">
                                Stay up-to-date with everything happening on the platform. The notification system ensures you never miss important events.
                            </Text>
                            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <Text className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg flex-row">
                                    <MessageCircle className="w-5 h-5 text-indigo-500" /> Types of Notifications
                                </Text>
                                <Text className="text-slate-600 text-sm leading-relaxed mb-4">
                                    You will receive notifications for:
                                </Text>
                                <View className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                                    <View>When someone follows you.</View>
                                    <View>When a teacher you follow posts a new question.</View>
                                    <View>When your application to become a teacher is approved.</View>
                                    <View>When you receive a new challenge.</View>
                                    <View>When you earn a new achievement.</View>
                                </View>
                                <View className="mt-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800 flex gap-2 flex-row">
                                    <Text>💡</Text>
                                    <Text>You can view all your notifications on the <Link href="/notifications" className="font-semibold hover:underline">/notifications</Link> page.</Text>
                                </View>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Navigation ── */}
                        <View id="navigation" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-300 flex-row">
                                    <Link2 className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Navigation & Key Links</Text>
                            </View>
                            <View className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="text-left px-5 py-3 font-bold text-slate-700">Page</th>
                                            <th className="text-left px-5 py-3 font-bold text-slate-700">URL</th>
                                            <th className="text-left px-5 py-3 font-bold text-slate-700">Access</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-50">
                                        {[
                                            ['Home / Dashboard', '/', 'Public', 'blue'],
                                            ['Sign Up', '/signup', 'Public', 'blue'],
                                            ['Sign In', '/login', 'Public', 'blue'],
                                            ['Leaderboard', '/leaderboard', 'Public', 'blue'],
                                            ['About', '/about', 'Public', 'blue'],
                                            ['Contact', '/contact', 'Public', 'blue'],
                                            ['Docs', '/docs', 'Public', 'blue'],
                                            ['My Profile', '/profile', 'Auth', 'green'],
                                            ['Student Profile', '/user/[username]', 'Public', 'blue'],
                                            ['Teacher Profile', '/teacher/[username]', 'Public', 'blue'],
                                            ['Create Question', '/questions/create', 'Teacher', 'purple'],
                                            ['Apply as Teacher', '/teacher/apply', 'Auth', 'green'],
                                            ['Teacher Dashboard', '/teacher/dashboard', 'Teacher', 'purple'],
                                            ['Privacy Policy', '/privacy', 'Public', 'blue'],
                                        ].map(([page, url, access, color]) => (
                                            <tr key={url} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-slate-800">{page}</td>
                                                <td className="px-5 py-3 font-mono text-xs text-indigo-600">{url}</td>
                                                <td className="px-5 py-3"><Badge color={color as 'blue' | 'green' | 'purple'}>{access}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </View>
                        </View>

                        <hr className="border-slate-100" />

                        {/* ── Privacy ── */}
                        <View id="privacy" className="scroll-mt-28">
                            <View className="flex items-center gap-3 mb-6 flex-row">
                                <View className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200 flex-row">
                                    <Shield className="w-5 h-5 text-white" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900">Privacy & Security</Text>
                            </View>
                            <View className="grid sm:grid-cols-2 gap-4">
                                {[
                                    ['Row-Level Security (RLS)', 'All Supabase tables use RLS policies — users can only read and write their own data. No one can tamper with another user\'s  records.'],
                                    ['Supabase Auth', 'Authentication is handled by Supabase Auth with industry-standard JWT tokens. Passwords are never stored in plain text.'],
                                    ['Storage Buckets', 'Avatars and banners are stored in private Supabase Storage buckets. Only public URLs are exposed — raw bucket paths are never shared.'],
                                    ['Admin Operations', 'Operations like looking up user info server-side use a server-only `supabaseAdmin` client — never exposed to browsers.'],
                                ].map(([title, desc]) => (
                                    <View key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                        <View className="flex items-center gap-2 mb-2 flex-row">
                                            <Shield className="w-4 h-4 text-red-500" />
                                            <Text className="font-bold text-slate-800 text-sm">{title}</Text>
                                        </View>
                                        <Text className="text-xs text-slate-600 leading-relaxed">{desc}</Text>
                                    </View>
                                ))}
                            </View>
                            <View className="mt-4 text-center text-sm text-slate-400">
                                Read our full <Link href="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy →</Link>
                            </View>
                        </View>

                        {/* Footer CTA */}
                        <View className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-center text-white">
                            <Bell className="w-10 h-10 mx-auto mb-4 text-indigo-200" />
                            <Text className="text-2xl font-black mb-2">Ready to start learning?</Text>
                            <Text className="text-white/70 mb-6">Join thousands of students competing and learning on Dheeyudha.</Text>
                            <View className="flex gap-3 justify-center flex-wrap flex-row">
                                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg flex-row">
                                    <UserPlus className="w-4 h-4" /> Get Started
                                </Link>
                                <Link href="/leaderboard" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/20 transition-colors flex-row">
                                    <Trophy className="w-4 h-4" /> View Leaderboard
                                </Link>
                            </View>
                        </View>

                    </View>
                </View>
            </View>

            {/* Back to Top */}
            {showBackToTop && (
                <View
                    onPress={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-300 flex items-center justify-center transition-all hover:-translate-y-1 z-50 flex-row"
                >
                    <ArrowUp className="w-5 h-5" />
                </View>
            )}
        </View>
    );
}
