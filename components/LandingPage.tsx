"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Trophy, Users, Shield, Zap, ArrowRight, BrainCircuit, Globe, BookOpen, Menu, X, ChevronDown, FileText, Heart, Swords, PenTool, TrendingDown, BadgeCheck, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden selection:bg-indigo-500/30">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-500/10 dark:bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3" />

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 sm:px-12 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">
                        Dheeyudha
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Desktop Resources Dropdown */}
                    <div className="relative hidden md:block group">
                        <button className="flex items-center gap-1 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-2">
                            Explore <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 min-w-[200px]">
                                <Link href="/about" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <Globe className="w-4 h-4 text-indigo-500" /> About
                                </Link>
                                <Link href="/docs" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <BookOpen className="w-4 h-4 text-purple-500" /> Documentation
                                </Link>
                                <Link href="/privacy" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <Shield className="w-4 h-4 text-emerald-500" /> Privacy Policy
                                </Link>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                                <Link href="/contact" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <FileText className="w-4 h-4 text-amber-500" /> Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Link href="/login" className="hidden md:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Sign In
                    </Link>
                    <Link href="/signup" className="text-xs md:text-sm font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-white/10 hover:-translate-y-0.5 transition-transform">
                        Join For Free
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-[60] flex flex-col md:hidden"
                        >
                            <Link href="/about" className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                                <Globe className="w-5 h-5 text-indigo-500" /> About Platform
                            </Link>
                            <Link href="/docs" className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                                <BookOpen className="w-5 h-5 text-purple-500" /> Help & Docs
                            </Link>
                            <Link href="/privacy" className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                                <Shield className="w-5 h-5 text-emerald-500" /> Privacy Policy
                            </Link>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                            <Link href="/login" className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors text-sm font-black text-slate-900 dark:text-white mt-1">
                                Sign In to Account
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-16 sm:pt-24 pb-32">
                {/* Hero Section */}
                <motion.div
                    className="text-center max-w-4xl mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-8 shadow-sm">
                        <Trophy className="w-4 h-4" />
                        <span>The Premier Academic Proving Ground</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                        Elite preparation.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500">
                            Verified Excellence.
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-base sm:text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join India's top 1% of students solving high-stakes, peer-reviewed mathematical proofs and complex theorems for national ranking.
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl shadow-indigo-600/30 hover:-translate-y-1 transition-all w-full sm:w-auto justify-center">
                            Start Your Journey <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/about" className="flex items-center gap-2 bg-white dark:bg-slate-900/50 hover:bg-slate-50 border-2 border-slate-200 dark:border-slate-800 px-8 py-4 rounded-full font-bold text-lg transition-all w-full sm:w-auto justify-center dark:hover:bg-slate-800">
                            Learn How It Works
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Core Mechanics Explanations */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mt-24 grid lg:grid-cols-3 gap-6"
                >
                    <div className="flex flex-col bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 group-hover:-rotate-3 group-hover:opacity-10 dark:group-hover:opacity-20 transition-all duration-500 z-0">
                            <PenTool className="w-40 h-40 text-indigo-500" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 relative z-10 shadow-sm border border-indigo-200/50 dark:border-indigo-800/50">
                            <PenTool className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 relative z-10 tracking-tight">Written Battles</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base relative z-10 flex-1">
                            Move beyond simple multiple choice. True mastery requires showing your work. Upload your written solutions, step-by-step logic, and let AI or your peers judge the perfection of your method.
                        </p>

                        {/* Chart Component */}
                        <div className="mt-8 bg-white/60 dark:bg-slate-950/60 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/50 backdrop-blur-sm relative z-10 pb-8">
                            <div className="flex justify-between items-end h-24 gap-4 px-2 mt-6">
                                <div className="w-full flex justify-center items-end relative group/bar">
                                    <div className="w-16 h-10 bg-slate-300 dark:bg-slate-700 rounded-t-lg transition-all" />
                                    <span className="absolute -top-7 text-sm font-bold text-slate-500">50 <span className="text-[10px]">pts</span></span>
                                    <span className="absolute -bottom-6 text-xs font-bold text-slate-500 text-center w-full">MCQ</span>
                                </div>
                                <div className="w-full flex justify-center items-end relative group/bar">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-t-lg" />
                                    <div className="w-16 h-24 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg relative z-10 shadow-lg shadow-indigo-500/30" />
                                    <span className="absolute -top-7 text-sm font-black text-indigo-600 dark:text-indigo-400">+150 <span className="text-[10px]">pts</span></span>
                                    <span className="absolute -bottom-6 text-xs font-bold text-indigo-600 dark:text-indigo-400 text-center w-full">WRITTEN</span>
                                </div>
                            </div>
                            <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>

                    <div className="flex flex-col bg-gradient-to-br from-rose-500/5 to-orange-500/5 dark:from-rose-500/10 dark:to-orange-500/10 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/50 relative overflow-hidden group hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 group-hover:-rotate-3 group-hover:opacity-10 dark:group-hover:opacity-20 transition-all duration-500 z-0">
                            <TrendingDown className="w-40 h-40 text-rose-500" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 relative z-10 shadow-sm border border-rose-200/50 dark:border-rose-800/50">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 relative z-10 tracking-tight">High Stakes Penalty</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base relative z-10 flex-1">
                            Every guess counts. Incorrect answers carry heavy point penalties that drop your global rank instantly. This forces critical thinking, reducing blind guessing and rewarding absolute certainty.
                        </p>

                        {/* Penalty Chart */}
                        <div className="mt-8 bg-white/60 dark:bg-slate-950/60 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/50 backdrop-blur-sm relative z-10">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold w-12 text-slate-500">Correct</span>
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                        <div className="w-full bg-emerald-500 rounded-full shadow-sm" />
                                    </div>
                                    <span className="text-sm font-black text-emerald-600 w-12 text-right">+50<span className="text-[10px] opacity-70">pt</span></span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold w-12 text-slate-500">Pass</span>
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex justify-center">
                                        <div className="w-3 bg-slate-400 rounded-full" />
                                    </div>
                                    <span className="text-sm font-black text-slate-500 w-12 text-right">0<span className="text-[10px] opacity-70">pt</span></span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold w-12 text-slate-500">Wrong</span>
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex justify-start">
                                        <div className="w-1/2 bg-rose-500 rounded-full shadow-sm" />
                                    </div>
                                    <span className="text-sm font-black text-rose-600 w-12 text-right">-25<span className="text-[10px] opacity-70">pt</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 group-hover:-rotate-3 group-hover:opacity-10 dark:group-hover:opacity-20 transition-all duration-500 z-0">
                            <BadgeCheck className="w-40 h-40 text-emerald-500" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 relative z-10 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
                            <BadgeCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 relative z-10 tracking-tight">Verified Teachers</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base relative z-10 flex-1">
                            No junk content. Questions are crafted and curated strictly by platform-verified educators. Learn exclusively from top-tier, incredibly accurate, and challenging academic material.
                        </p>

                        {/* Verified Chart */}
                        <div className="mt-8 bg-white/60 dark:bg-slate-950/60 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/50 backdrop-blur-sm relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
                            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-emerald-500/20 dark:text-emerald-900/50"
                                        strokeDasharray="100, 100"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        stroke="currentColor" strokeWidth="3" fill="none"
                                    />
                                    <path
                                        className="text-emerald-500 drop-shadow-md"
                                        strokeDasharray="100, 100"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">100<span className="text-xs opacity-70">%</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shrink-0" />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Verified Quality</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-50">
                                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                    <span className="text-xs font-bold text-slate-500 line-through">User Generated</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Core Features Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="mt-32 grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
                            <Zap className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">National Ranking</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Solve complex problems to earn verified reputation points. Establish your intellectual dominance on the global leaderboard.</p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Peer & AI Reviewed</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Written answers are honestly verified by fellow students or an impartial AI agent.</p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                            <Users className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Collaborative Defense</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Consult with trusted academic peers on highly difficult bounties to split points and avoid severe individual ranking penalties.</p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                            <BrainCircuit className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">AI-Powered Validation</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Our proprietary AI grading engine reads multi-step mathematical proofs with the same rigor as an elite university examiner.</p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-bl-2xl">Upcoming</div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                            <Swords className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">1v1 Battle Room</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Soon, you'll enter the Battle Room and challenge others to high-stakes, time-based knowledge wars!</p>
                    </motion.div>
                </motion.div>

            </main>
        </div>
    );
}
