'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    BookOpen, Users, Trophy, GraduationCap, User, PlusCircle,
    LogIn, UserPlus, Search, Star, Zap, Shield, ChevronRight,
    MessageCircle, Target, Award, Sword, Bell, Link2, Sparkles,
    ArrowUp, ThumbsUp
} from 'lucide-react';

const sections = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'getting-started', label: 'Getting Started', icon: LogIn },
    { id: 'student-profile', label: 'Student Profile', icon: User },
    { id: 'teacher-profile', label: 'Teacher Profile', icon: GraduationCap },
    { id: 'follow-system', label: 'Follow System', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'verification', label: 'Verification Loop', icon: Shield },
    { id: 'point-system', label: 'Points & Penalties', icon: Zap },
    { id: 'achievements', label: 'Achievements', icon: Award },
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colors[color] || colors.slate}`}>
            {children}
        </span>
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
        <div className={`rounded-2xl bg-gradient-to-br border p-5 ${gradients[color] || gradients.indigo}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg[color] || iconBg.indigo}`}>
                <Icon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
        </div>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

            {/* Main Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex gap-10">

                    {/* Sticky Sidebar */}
                    <aside className="hidden lg:block w-60 shrink-0">
                        <div className="sticky top-28 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm p-4 space-y-1">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-3">Contents</p>
                            {sections.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => scrollTo(id)}
                                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeSection === id
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{label}</span>
                                    {activeSection === id && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Content */}
                    <main ref={contentRef} className="flex-1 min-w-0 space-y-20">

                        {/* ── Overview ── */}
                        <section id="overview" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Overview</h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-lg mb-8">
                                <strong>Manthan</strong> is a real-time competitive quiz platform designed for Indian students and teachers. It blends social features (profiles, follows, leaderboards) with academic content (teacher-posted questions, subject-based quizzes) to make learning engaging and competitive.
                            </p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FeatureCard icon={BookOpen} title="Written Answers" color="purple">Upload photos of your handwritten work. AI and peers verify your logic, not just the answer.</FeatureCard>
                                <FeatureCard icon={Zap} title="Verification Loop" color="amber">A unique 3-step system: Self-mark → Peer Review → AI Audit to ensure 100% fairness.</FeatureCard>
                                <FeatureCard icon={Trophy} title="Real-time Leaderboard" color="emerald">Points update instantly across the app. See yourself climb the Top Brains list in real-time.</FeatureCard>
                                <FeatureCard icon={Shield} title="Anti-Cheat System" color="indigo">Handwritten requirements + AI pattern matching makes cheating with ChatGPT nearly impossible.</FeatureCard>
                                <FeatureCard icon={Target} title="Subject Mastery" color="indigo">Track how many subjects you&apos;ve mastered and view your overall progress in a visual dashboard.</FeatureCard>
                                <FeatureCard icon={GraduationCap} title="Teacher Control" color="purple">Verified teachers create verified content, ensuring high-quality, exam-relevant questions.</FeatureCard>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Getting Started ── */}
                        <section id="getting-started" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <LogIn className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Getting Started</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg">
                                        <UserPlus className="w-5 h-5 text-indigo-500" /> Creating an Account
                                    </h3>
                                    <ol className="space-y-4 text-slate-600 text-sm leading-relaxed">
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">1</span>
                                            <span>Go to <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">/signup</Link> and enter your full name, email, and password.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">2</span>
                                            <span>Choose a unique <strong>username</strong> — lowercase, no spaces (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">rahul_sharma</code>). This becomes your public profile URL.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">3</span>
                                            <span>Confirm your email through the verification link sent to your inbox.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">4</span>
                                            <span>Sign in at <Link href="/login" className="text-indigo-600 font-semibold hover:underline">/login</Link> and you're in!</span>
                                        </li>
                                    </ol>
                                    <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 flex gap-2">
                                        <span>⚠️</span>
                                        <span>Usernames can be updated up to <strong>4 times per 30 days</strong> from your profile page — choose carefully!</span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg">
                                        <GraduationCap className="w-5 h-5 text-indigo-500" /> Teacher Accounts
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                        Teachers have a separate verification process to maintain content quality. To apply for a Teacher account:
                                    </p>
                                    <ol className="space-y-3 text-slate-600 text-sm leading-relaxed">
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">1</span>
                                            <span>Create a regular student account first.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">2</span>
                                            <span>Visit <Link href="/teacher/apply" className="text-indigo-600 font-semibold hover:underline">/teacher/apply</Link> and submit your application with subject details.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-none w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">3</span>
                                            <span>An admin reviews and approves your application. You'll receive a <Badge color="blue">✓ Verified Teacher</Badge> badge once approved.</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Student Profile ── */}
                        <section id="student-profile" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Student Profile</h2>
                            </div>
                            <p className="text-slate-600 text-lg mb-6">Your public student profile is accessible at <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-base font-mono font-bold">/user/[username]</code>. It showcases your achievements, stats, and social metrics.</p>

                            <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                {[
                                    { icon: User, title: 'Avatar & Banner', desc: 'Upload a custom profile photo and banner image. Click the edit button on hover to change them. Images are cropped interactively before upload.' },
                                    { icon: Star, title: 'Name & Username', desc: 'Edit your display name or username directly on your profile. Username changes are rate-limited to 4 per month to prevent abuse.' },
                                    { icon: Trophy, title: 'Global Rank Badge', desc: 'Your current global ranking is always visible on your profile with a bold rank card (Gold / Silver / Bronze / etc.).' },
                                    { icon: Target, title: 'Stats Grid', desc: 'See your Battles Won, Win Rate, Current Streak, and total Points at a glance in a 4-card grid.' },
                                    { icon: Award, title: 'Achievements', desc: 'A visual list of badges you have earned (e.g. First Victory, Battle Master, Quiz Genius). Locked achievements are shown greyed out.' },
                                    { icon: Sword, title: 'Recent Battles', desc: 'The last three quiz battles you have participated in, showing your opponent, subject, score, and outcome.' },
                                ].map(f => (
                                    <div key={f.title} className="flex gap-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <f.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{f.title}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800 flex gap-2">
                                <span>💡</span>
                                <span>Anyone can visit your public profile at <strong>/user/your-username</strong> — even without an account.</span>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Teacher Profile ── */}
                        <section id="teacher-profile" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Teacher Profile</h2>
                            </div>
                            <p className="text-slate-600 text-lg mb-6">Teacher profiles are at <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg text-base font-mono font-bold">/teacher/[username]</code>. They display the teacher's identity and all their created questions.</p>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                {[
                                    ['Verified Badge', 'A blue ✓ "Verified Instructor" badge appears next to the teacher\'s name, built for trust at a glance.'],
                                    ['Main Subject', 'The teacher\'s primary teaching subject is highlighted alongside the instructor badge.'],
                                    ['Posted Questions', 'All questions the teacher has published are listed in a responsive grid on their profile page for students to attempt.'],
                                    ['Follow Button', 'Students (and other teachers) can follow a teacher to stay updated. The teacher\'s follower and following counts are displayed.'],
                                ].map(([title, desc]) => (
                                    <div key={title} className="flex gap-4 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                        <div>
                                            <span className="font-bold text-slate-800">{title}: </span>
                                            <span className="text-slate-600 text-sm">{desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Follow System ── */}
                        <section id="follow-system" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Follow System</h2>
                            </div>
                            <p className="text-slate-600 text-lg mb-6">Manthan has a full social follow system. You can follow both students and teachers, and see who follows you.</p>

                            <div className="grid sm:grid-cols-3 gap-4 mb-6">
                                {[
                                    { icon: UserPlus, color: 'bg-pink-100 text-pink-600', title: 'Follow / Unfollow', desc: 'Click the Follow button on any profile. It toggles with a smooth animation — hover to see the Unfollow state.' },
                                    { icon: Users, color: 'bg-rose-100 text-rose-600', title: 'Followers & Following Counts', desc: 'Both counts are displayed prominently below the bio on every profile. The counts update in real-time.' },
                                    { icon: Search, color: 'bg-fuchsia-100 text-fuchsia-600', title: 'User List Modals', desc: 'Click on the Followers or Following count to open a modal showing the full list with profile links.' },
                                ].map(f => (
                                    <div key={f.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                                            <f.icon className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold text-slate-800 mb-3">Rules & Notes</h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex gap-2"><span className="text-emerald-500">✓</span> You can follow both students and teachers.</li>
                                    <li className="flex gap-2"><span className="text-emerald-500">✓</span> Clicking a user in the followers/following modal navigates directly to their profile.</li>
                                    <li className="flex gap-2"><span className="text-slate-400">—</span> You cannot follow yourself — the Follow button is hidden on your own profile.</li>
                                    <li className="flex gap-2"><span className="text-slate-400">—</span> Following is not mutual: following someone does not automatically make them follow you back.</li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Leaderboard ── */}
                        <section id="leaderboard" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Leaderboard</h2>
                            </div>
                            <p className="text-slate-600 text-lg mb-6">The <Link href="/leaderboard" className="text-indigo-600 font-semibold hover:underline">Global Leaderboard</Link> ranks all students by their total earned points. It uses <strong>Real-time Sync</strong> to reflect updates across the entire community instantly.</p>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { medal: '🥇', rank: 'Top 10', desc: 'The "Top Brains" elite tier. Featured on the home dashboard.', color: 'bg-amber-50 border-amber-200' },
                                    { medal: '📊', rank: 'Live Updates', desc: 'Points from MCQ, Written, and AI reviews sync in < 1s.', color: 'bg-slate-50 border-slate-200' },
                                    { medal: '👑', rank: 'Status Levels', desc: 'Gold, Silver, and Bronze badges based on your global percentile.', color: 'bg-orange-50 border-orange-200' },
                                ].map(r => (
                                    <div key={r.rank} className={`rounded-2xl border p-5 text-center ${r.color}`}>
                                        <div className="text-4xl mb-2">{r.medal}</div>
                                        <div className="font-black text-slate-800">{r.rank}</div>
                                        <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm text-slate-600">
                                Points are awarded by attempting and solving teacher-posted questions correctly. The more questions you solve — and the faster — the higher you rank.
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        <hr className="border-slate-100" />

                        {/* ── Verification Loop ── */}
                        <section id="verification" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">The Verification Loop</h2>
                            </div>
                            <p className="text-slate-600 text-lg mb-8">
                                For written answers, Manthan uses a decentralized trust model to ensure students do the work themselves and don&apos;t just cheat with AI.
                            </p>

                            <div className="relative space-y-12">
                                {/* Step 1 */}
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="md:w-1/3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</span>
                                            <h3 className="text-xl font-bold text-slate-800">Self-Marking</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            After uploading your photo, you see the teacher&apos;s model answer. You honestly decide if yours matches. If you say yes, you get provisional points instantly.
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <ThumbsUp className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">"I Got It Right"</p>
                                                <p className="text-xs text-slate-400">Claims the points and moves to Peer Review.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="md:w-1/3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">2</span>
                                            <h3 className="text-xl font-bold text-slate-800">Peer Review</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            Your answer appears in the "Checker Feed" for other students. Two random peers must approve it to permanentize your points. If they flag it, the AI intervenes.
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">2 Agree = Approved</p>
                                                <p className="text-xs text-slate-400">Points are secured. No further checks needed.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="md:w-1/3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">3</span>
                                            <h3 className="text-xl font-bold text-slate-800">AI Verification</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            If peers flag you, Gemini 1.5 Pro performs a deep logic audit. It reads your handwriting, compares it to the model answer, and issues a final, non-negotiable verdict.
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">AI Breakdown Provided</p>
                                                <p className="text-xs text-slate-400">If you lose, the AI explains exactly why your logic failed.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Point System & Penalties ── */}
                        <section id="point-system" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Points & Penalties</h2>
                            </div>

                            <p className="text-slate-600 text-lg mb-6">Manthan uses a completely transparent and fair point system. You are rewarded for correct answers, but to prevent random guessing, higher-value questions carry a risk of negative marking.</p>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <Award className="w-5 h-5 text-indigo-500" /> Earning Points
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Every question posted by a teacher is assigned a specific point value based on its difficulty. Answering the question correctly before the timer runs out awards you the full points, which directly boost your Global Rank.
                                </p>
                            </div>

                            <div className="bg-red-50/50 rounded-2xl border border-red-100 shadow-sm p-6">
                                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4 text-lg">
                                    <Shield className="w-5 h-5 text-red-500" /> Flat-Tiered Negative Marking
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                    To maintain leaderboard integrity, incorrect guesses on high-reward questions result in a penalty. Manthan uses a <strong>Flat-Tiered Deduction Scale</strong> — meaning 1-point questions don't carry harsh penalties, but major questions do.
                                </p>

                                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                    {[
                                        ['1 to 4 Points', '0 Penalty', 'Safe to guess!'],
                                        ['5 to 9 Points', '-1 Point', 'Low risk.'],
                                        ['10 to 14 Points', '-2 Points', 'Moderate risk.'],
                                        ['15 to 19 Points', '-3 Points', 'Consider your answer.'],
                                        ['20 to 24 Points', '-4 Points', 'High risk.'],
                                        ['25 Points', '-5 Points', 'Maximum risk.'],
                                    ].map(([range, pen, desc]) => (
                                        <div key={range} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{range}</div>
                                                <div className="text-xs text-slate-400">{desc}</div>
                                            </div>
                                            <Badge color="red">{pen}</Badge>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/80 backdrop-blur border border-red-100 rounded-xl p-4 text-sm text-red-800 flex gap-2">
                                    <span>💡</span>
                                    <span><strong>Complete Transparency:</strong> The exact penalty risk is always displayed to you on a red badge *before* you answer. For written work, AI confirmed failures result in a fixed <strong>3-point extra penalty</strong> plus the question value.</span>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Achievements ── */}
                        <section id="achievements" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Achievements</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { icon: '🎖️', name: 'First Victory', desc: 'Win your very first quiz battle.' },
                                    { icon: '⚔️', name: 'Battle Master', desc: 'Win a total of 100 battles.' },
                                    { icon: '🧠', name: 'Quiz Genius', desc: 'Get a perfect score in 10 quizzes.' },
                                    { icon: '🔥', name: 'Streak Warrior', desc: 'Maintain a 30-day winning streak.' },
                                    { icon: '🏅', name: 'Top 50', desc: 'Reach the top 50 on the global leaderboard.' },
                                    { icon: '🏫', name: 'School Champion', desc: 'Become the top scorer in your school.' },
                                ].map(a => (
                                    <div key={a.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
                                        <span className="text-2xl">{a.icon}</span>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{a.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800 flex gap-2">
                                <span>💡</span>
                                <span>Earned achievements are shown with a green ✓ badge on your profile. Locked ones appear greyed out as goals.</span>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Navigation ── */}
                        <section id="navigation" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-300">
                                    <Link2 className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Navigation & Key Links</h2>
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
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
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* ── Privacy ── */}
                        <section id="privacy" className="scroll-mt-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Privacy & Security</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    ['Row-Level Security (RLS)', 'All Supabase tables use RLS policies — users can only read and write their own data. No one can tamper with another user\'s  records.'],
                                    ['Supabase Auth', 'Authentication is handled by Supabase Auth with industry-standard JWT tokens. Passwords are never stored in plain text.'],
                                    ['Storage Buckets', 'Avatars and banners are stored in private Supabase Storage buckets. Only public URLs are exposed — raw bucket paths are never shared.'],
                                    ['Admin Operations', 'Operations like looking up user info server-side use a server-only `supabaseAdmin` client — never exposed to browsers.'],
                                ].map(([title, desc]) => (
                                    <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4 text-red-500" />
                                            <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-center text-sm text-slate-400">
                                Read our full <Link href="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy →</Link>
                            </div>
                        </section>

                        {/* Footer CTA */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-center text-white">
                            <Bell className="w-10 h-10 mx-auto mb-4 text-indigo-200" />
                            <h3 className="text-2xl font-black mb-2">Ready to start learning?</h3>
                            <p className="text-white/70 mb-6">Join thousands of students competing and learning on Manthan.</p>
                            <div className="flex gap-3 justify-center flex-wrap">
                                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg">
                                    <UserPlus className="w-4 h-4" /> Get Started
                                </Link>
                                <Link href="/leaderboard" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/20 transition-colors">
                                    <Trophy className="w-4 h-4" /> View Leaderboard
                                </Link>
                            </div>
                        </div>

                    </main>
                </div>
            </div>

            {/* Back to Top */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-300 flex items-center justify-center transition-all hover:-translate-y-1 z-50"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
