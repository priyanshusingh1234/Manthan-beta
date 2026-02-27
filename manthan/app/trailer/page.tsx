"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Search, Sword, Target, Sparkles, User, Trophy, RefreshCw, ArrowRight, Lock, Mail, BadgeCheck, Zap } from "lucide-react";
import { DheeyudhaLogo } from "@/components/Logo";

export default function TrailerPage() {
    const cursorControls = useAnimation();
    const screenControls = useAnimation(); // For screen shake effect

    const [step, setStep] = useState(0);
    const [typingEmail, setTypingEmail] = useState("");
    const [typingPassword, setTypingPassword] = useState("");
    const [typingOpponent, setTypingOpponent] = useState("");
    const [activeInput, setActiveInput] = useState<"email" | "password" | "search" | null>(null);
    const [cursorClicked, setCursorClicked] = useState(false);
    const [showCursor, setShowCursor] = useState(false);
    const [scrollOffset, setScrollOffset] = useState(0);

    const emailRef = useRef<HTMLDivElement>(null);
    const passwordRef = useRef<HTMLDivElement>(null);
    const loginBtnRef = useRef<HTMLButtonElement>(null);

    const repostBtnRef = useRef<HTMLButtonElement>(null);
    const challengeBtnRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const submitRef = useRef<HTMLButtonElement>(null);

    const clickCursor = async (duration = 150) => {
        setCursorClicked(true);
        await new Promise((r) => setTimeout(r, duration));
        setCursorClicked(false);
    };

    const typeText = async (text: string, setter: (val: string) => void, inputName: "email" | "password" | "search", speed = 50) => {
        setActiveInput(inputName);
        for (let i = 1; i <= text.length; i++) {
            setter(text.substring(0, i));
            // Slight randomization for human-like typing
            await new Promise((r) => setTimeout(r, speed + (Math.random() * 30 - 15)));
        }
        await new Promise((r) => setTimeout(r, 200));
        setActiveInput(null);
    };

    const moveTo = async (ref: React.RefObject<HTMLElement | null>, duration = 1.0, offsetX = 0, offsetY = 0) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        await cursorControls.start({
            x: rect.left + rect.width / 2 + offsetX,
            y: rect.top + rect.height / 2 + offsetY,
            transition: { duration, ease: [0.16, 1, 0.3, 1] } // Apple-like fluid easing
        });
    };

    useEffect(() => {
        let active = true;

        const playSequence = async () => {
            await new Promise((r) => setTimeout(r, 500));
            if (!active) return;

            // -- STEP 1: INTRO (0s - 4.5s) --
            setStep(1);
            await new Promise((r) => setTimeout(r, 4000));
            if (!active) return;

            // -- STEP 2: SIGN IN SCREEN (4.5s - 10s) --
            setStep(2);
            setShowCursor(true);
            cursorControls.set({ x: window.innerWidth + 100, y: window.innerHeight, opacity: 1 });

            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;

            await moveTo(emailRef, 1.2, -80);
            if (!active) return;
            await clickCursor();
            await typeText("prodigy@dheeyudha.com", setTypingEmail, "email", 40);
            if (!active) return;

            await moveTo(passwordRef, 0.6, -80);
            if (!active) return;
            await clickCursor();
            await typeText("••••••••", setTypingPassword, "password", 30);
            if (!active) return;

            await moveTo(loginBtnRef, 0.8);
            if (!active) return;
            await clickCursor();

            await new Promise((r) => setTimeout(r, 600));
            if (!active) return;

            // -- STEP 3: APP DASHBOARD SCROLLING (10s - 16s) --
            setStep(3);
            cursorControls.start({ x: window.innerWidth - 80, y: window.innerHeight / 2, transition: { duration: 1 } });
            await new Promise((r) => setTimeout(r, 1500));
            if (!active) return;

            // Smooth scroll via Framer Motion
            setScrollOffset(-250);
            await new Promise((r) => setTimeout(r, 2000));
            if (!active) return;

            // -- STEP 4: REPOST ACTION (16s - 20s) --
            setStep(4);
            setScrollOffset(-180); // scroll slightly back up to frame the button perfectly
            await new Promise((r) => setTimeout(r, 800));

            await moveTo(repostBtnRef, 1.2);
            if (!active) return;
            document.getElementById('repost-btn')?.classList.add('text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/20');
            await new Promise((r) => setTimeout(r, 300));
            if (!active) return;
            await clickCursor();
            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;

            // -- STEP 5: CHALLENGE FRIEND (20s - 25s) --
            setStep(5);
            await moveTo(challengeBtnRef, 1.0);
            if (!active) return;
            await clickCursor();

            await new Promise((r) => setTimeout(r, 600));
            if (!active) return;
            await moveTo(searchRef, 0.8, -100);
            if (!active) return;
            await clickCursor();

            await typeText("Rahul Kumar", setTypingOpponent, "search", 50);
            if (!active) return;

            await moveTo(submitRef, 0.6);
            if (!active) return;
            await clickCursor();
            if (!active) return;

            cursorControls.start({ x: window.innerWidth + 100, y: window.innerHeight, transition: { duration: 0.8 } });

            // -- STEP 6: EPIC MATCH FOUND (25s - 28s) --
            await new Promise((r) => setTimeout(r, 300));
            if (!active) return;
            setStep(6);

            // Camera Shake Effect
            screenControls.start({
                x: [0, -10, 10, -10, 10, 0],
                y: [0, 10, -10, 10, -10, 0],
                transition: { duration: 0.4, ease: "easeInOut" }
            });

            await new Promise((r) => setTimeout(r, 3500));
            if (!active) return;

            // -- STEP 7: OUTRO (28s - 32s) --
            setStep(7);
        };

        playSequence();
        return () => { active = false; };
    }, [cursorControls, screenControls]);

    return (
        <motion.div animate={screenControls} className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans">
            <style dangerouslySetInnerHTML={{ __html: `body { cursor: none !important; }` }} />

            <AnimatePresence mode="wait">
                {/* STEP 1: INTRO SEQUENCE */}
                {step === 1 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1.5 }}>
                            <DheeyudhaLogo variant="full" theme="dark" size={30} />
                        </motion.div>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2, duration: 1.5 }}
                            className="mt-12 text-5xl md:text-7xl font-bold tracking-tighter"
                        >
                            <span className="bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                                Redefining the <br /> Academic Arena.
                            </span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: 1, letterSpacing: "0.5em" }} transition={{ delay: 2.2, duration: 1.5 }}
                            className="mt-8 text-lg font-bold text-red-500/90 uppercase"
                        >
                            Prepare for the War of Wits
                        </motion.div>
                    </motion.div>
                )}

                {/* STEP 2: SIGN IN */}
                {step === 2 && (
                    <motion.div
                        key="signin"
                        initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -50, filter: "blur(10px)", transition: { duration: 0.6 } }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full flex items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 blur-[120px] rounded-full" />

                        <div className="bg-[#0A0A0A]/80 border border-white/10 backdrop-blur-3xl p-10 rounded-[2.5rem] w-full max-w-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.5)] z-10">
                            <div className="flex justify-center mb-8">
                                <DheeyudhaLogo variant="icon" theme="dark" size={50} />
                            </div>
                            <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">Welcome Back</h2>
                            <p className="text-gray-400 text-center mb-8 text-sm font-medium">Enter the arena to continue your journey.</p>

                            <div className="space-y-4">
                                <div ref={emailRef} className={`relative rounded-2xl transition-all duration-300 ${activeInput === 'email' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-white/10' : 'bg-white/5 border border-white/10'}`}>
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <div className="w-full py-4 pl-12 pr-4 text-white flex items-center h-[56px]">
                                        {typingEmail}
                                        {activeInput === "email" && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-5 bg-indigo-500 ml-0.5" />}
                                        {!typingEmail && activeInput !== "email" && <span className="text-gray-600">Email Address</span>}
                                    </div>
                                </div>
                                <div ref={passwordRef} className={`relative rounded-2xl transition-all duration-300 ${activeInput === 'password' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-white/10' : 'bg-white/5 border border-white/10'}`}>
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <div className="w-full py-4 pl-12 pr-4 text-white flex items-center h-[56px]">
                                        {typingPassword}
                                        {activeInput === "password" && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-5 bg-indigo-500 ml-0.5" />}
                                        {!typingPassword && activeInput !== "password" && <span className="text-gray-600">Password</span>}
                                    </div>
                                </div>
                                <button ref={loginBtnRef} className="w-full mt-4 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    Enter Arena <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* STEPS 3,4,5: DASHBOARD */}
                {(step >= 3 && step <= 5) && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-6xl h-[85vh] bg-[#050505] rounded-[2.5rem] border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col mx-4"
                    >
                        {/* Header */}
                        <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/60 backdrop-blur-xl z-20 shrink-0">
                            <div className="flex items-center gap-4">
                                <DheeyudhaLogo variant="icon" theme="dark" size={32} />
                                <span className="text-white font-bold text-xl tracking-tight">Dheeyudha</span>
                            </div>
                            <div className="hidden md:flex items-center gap-8 px-6 py-2.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
                                <span className="text-white font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Leaderboard</span>
                                <span className="text-gray-400 font-medium hover:text-white transition-colors">Subjects</span>
                                <span className="text-gray-400 font-medium hover:text-white transition-colors">Feed</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        {/* Scrolling Content */}
                        <motion.div
                            className="flex-1 w-full relative z-10 flex flex-col"
                            animate={{ y: scrollOffset }}
                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} // Native smooth scroll
                        >
                            <div className="px-12 py-20 flex flex-col md:flex-row gap-12 items-center">
                                <div className="flex-1">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                                        <Sparkles className="w-4 h-4" /> The War of Wits is Live
                                    </motion.div>
                                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tighter">
                                        Earn glory. <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Master the syllabus.</span>
                                    </motion.h1>
                                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-gray-400 max-w-lg text-xl mb-10 leading-relaxed font-medium">
                                        Drop into intense intellectual battles, solve premium teacher questions, and climb the ranks.
                                    </motion.p>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                                        <button ref={challengeBtnRef} className="group relative bg-white text-black px-10 py-5 rounded-2xl font-bold text-xl overflow-hidden flex items-center gap-4 transition-transform hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                                            <Sword className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300 text-indigo-600" />
                                            <span>Challenge a Friend</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Floating Elements */}
                                {/* Premium Apple-style Right Side Dashboard Visuals */}
                                <div className="flex-1 right-side-glass grid grid-cols-2 gap-8 relative px-4 py-8 mt-12">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-indigo-500/30 to-purple-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

                                    {/* Left Column of Floating UI */}
                                    <div className="flex flex-col gap-8">
                                        {/* Player Profile & Settings */}
                                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, type: "spring", stiffness: 100 }} className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 rounded-full" />
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-400 to-fuchsia-500 p-[2px] relative z-10">
                                                        <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center">
                                                            <User className="w-7 h-7 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Settings Button directly placed */}
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors shadow-sm cursor-pointer hover:rotate-45 duration-300">
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-3xl font-semibold text-white tracking-tight leading-none mb-2">Priyanshu</h3>
                                            <p className="text-gray-400 font-medium text-lg">Grandmaster Rank</p>
                                        </motion.div>

                                        {/* Beautiful Clean Question Widget */}
                                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, type: "spring" }} className="bg-[#111]/90 backdrop-blur-[60px] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                            <div className="flex gap-3 mb-6 relative z-10">
                                                <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold text-white tracking-widest uppercase">Physics</span>
                                                <span className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 tracking-widest uppercase">Premium</span>
                                            </div>
                                            <h4 className="text-xl font-semibold text-white/90 leading-relaxed mb-10 relative z-10">
                                                Calculate the magnetic field at the center of a circular coil with N turns and radius R.
                                            </h4>

                                            <div className="flex items-center justify-between relative z-10">
                                                <button id="repost-btn" ref={repostBtnRef} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2 px-1">
                                                    <RefreshCw className="w-6 h-6" />
                                                    <span className="font-semibold text-lg">Repost</span>
                                                </button>
                                                <button className="bg-white text-black px-8 py-3.5 rounded-full font-bold shadow-[0_8px_20px_rgba(255,255,255,0.25)] hover:bg-gray-100 transition-colors">
                                                    Solve Now
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="flex flex-col gap-8 mt-16">
                                        {/* Beautiful Performance Chart / Ranking Style Card */}
                                        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, type: "spring" }} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-[40px] border border-white/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/30 blur-[60px] rounded-full pointer-events-none" />
                                            <div className="flex items-center gap-3 mb-4 opacity-70">
                                                <Trophy className="w-5 h-5 text-fuchsia-300" />
                                                <span className="text-white font-semibold uppercase tracking-widest text-sm">Global Leaderboard</span>
                                            </div>
                                            <div className="flex items-end gap-3 mb-6">
                                                <div className="text-7xl font-bold text-white tracking-tighter leading-none">#12</div>
                                                <div className="text-emerald-400 font-bold text-sm bg-emerald-500/10 border border-emerald-500/20 inline-flex px-4 py-1.5 rounded-full mb-2">
                                                    ▲ Up 4 places
                                                </div>
                                            </div>

                                            <p className="text-gray-400 font-medium mb-10">Your performance is climbing the ranks. Keep solving premium bounds.</p>

                                            {/* Beautiful Minimalist Mock Progress Graph */}
                                            <div className="flex items-end gap-3 h-32 mb-4 relative z-10 w-full justify-between">
                                                {[30, 45, 20, 60, 40, 80, 100].map((h, i) => (
                                                    <div key={i} className="w-6 bg-white/10 rounded overflow-hidden relative group">
                                                        {/* Native tool doesn't support complex mapping cleanly if broken, but this is a pure block. */}
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${h}%` }}
                                                            transition={{ delay: 1.5 + (i * 0.1), duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                                            className={`absolute bottom-0 w-full rounded ${i === 6 ? 'bg-gradient-to-t from-fuchsia-600 to-indigo-400' : 'bg-white/40 group-hover:bg-white/60 transition-colors'}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-500 font-medium mt-4">
                                                <span>Mon</span>
                                                <span>Sun</span>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[400px]" />
                        </motion.div>

                        {/* FAKE MODAL OVERLAY */}
                        <AnimatePresence>
                            {step === 5 && (
                                <motion.div
                                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                                        animate={{ scale: 1, y: 0, opacity: 1 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-10 w-full max-w-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                                        <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Issue a Challenge</h3>
                                        <p className="text-gray-400 mb-8 text-lg font-medium">Search for an opponent in the global arena.</p>

                                        <div ref={searchRef} className={`relative mb-8 rounded-2xl transition-all duration-300 ${activeInput === 'search' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-white/10' : 'bg-white/5 border border-white/10'}`}>
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                                            <div className="w-full py-4 pl-14 pr-4 text-xl text-white flex items-center h-[60px]">
                                                {typingOpponent}
                                                {activeInput === "search" && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-6 bg-indigo-500 ml-1" />}
                                                {!typingOpponent && activeInput !== "search" && <span className="text-gray-600">Opponent Username</span>}
                                            </div>
                                        </div>
                                        <button ref={submitRef} className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                            Initiate Battle <Sword className="w-5 h-5 text-indigo-600" />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* STEP 6: EPIC MATCH FOUND */}
                {step === 6 && (
                    <motion.div
                        key="epic-match"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 1 } }}
                        className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden z-[100]"
                    >
                        {/* White flash effect on load */}
                        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute inset-0 bg-white z-[101] pointer-events-none" />

                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 2, opacity: 0.4 }} transition={{ duration: 3, ease: "easeOut" }} className="absolute bg-orange-600/30 w-[800px] h-[800px] rounded-full blur-[120px]" />

                        <div className="relative z-10 flex flex-col items-center justify-center text-center">
                            <motion.div initial={{ scale: 0, rotate: -180, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", damping: 15, delay: 0.1 }} className="w-40 h-40 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_120px_rgba(239,68,68,0.5)] mb-10 border border-white/20">
                                <Sword className="w-20 h-20 text-white" />
                            </motion.div>

                            <motion.div className="flex flex-col items-center">
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-orange-400 font-bold tracking-[0.5em] text-xl mb-4">
                                    GET READY
                                </motion.div>
                                <motion.h2 initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", delay: 0.3 }} className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter mix-blend-overlay drop-shadow-2xl">
                                    MATCH FOUND
                                </motion.h2>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="mt-16 flex items-center gap-12 text-4xl font-bold text-white bg-black/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1, type: "spring" }} className="flex flex-col items-center gap-4 w-32">
                                    <div className="w-24 h-24 rounded-full border-[3px] border-indigo-500 bg-indigo-900/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                        <User className="w-10 h-10 text-indigo-300" />
                                    </div>
                                    <span className="text-indigo-400 text-xl tracking-tight">You</span>
                                </motion.div>
                                <span className="text-white/20 text-5xl font-black italic px-8">VS</span>
                                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.2, type: "spring" }} className="flex flex-col items-center gap-4 w-32">
                                    <div className="w-24 h-24 rounded-full border-[3px] border-red-500 bg-red-900/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                        <span className="text-red-300 font-bold text-4xl">R</span>
                                    </div>
                                    <span className="text-red-400 text-xl tracking-tight">Rahul</span>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* STEP 7: OUTRO */}
                {step === 7 && (
                    <motion.div
                        key="outro"
                        initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center text-center h-full w-full bg-black relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent" />
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 2, ease: "easeOut" }} className="relative z-10">
                            <DheeyudhaLogo variant="full" theme="dark" size={80} />
                        </motion.div>
                        <motion.p initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: 1, letterSpacing: "0.5em" }} transition={{ delay: 1.5, duration: 2 }} className="text-white/60 text-lg font-bold tracking-[0.5em] uppercase mt-12 relative z-10">
                            The Arena Awaits.
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* APPLE-STYLE CURSOR */}
            {showCursor && (
                <motion.div animate={cursorControls} className="fixed top-0 left-0 z-[999999] pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" style={{ transformOrigin: "top left" }}>
                    <motion.div animate={{ scale: cursorClicked ? 0.8 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="relative">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" fill="#000" />
                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <AnimatePresence>
                            {cursorClicked && (
                                <motion.div initial={{ scale: 0.2, opacity: 0.8 }} animate={{ scale: 3.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute top-1.5 left-2.5 w-5 h-5 rounded-full border-2 border-white/80 pointer-events-none" />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}