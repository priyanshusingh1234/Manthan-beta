"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Search, Sword, Target, Sparkles, User, Trophy, Zap, RefreshCw, ArrowRight, Lock, Mail } from "lucide-react";
import { DheeyudhaLogo } from "@/components/Logo";

export default function TrailerPage() {
    const cursorControls = useAnimation();

    // Steps for the 30-second sequence:
    // 0 = Initial Black
    // 1 = Intro Logo & Hook
    // 2 = Sign In Screen
    // 3 = App Dashboard (Scrolling glass)
    // 4 = Teacher Question / Repost Action
    // 5 = Challenge Friend / Modal
    // 6 = Epic Match Found
    // 7 = Outro
    const [step, setStep] = useState(0);
    const [typingEmail, setTypingEmail] = useState("");
    const [typingPassword, setTypingPassword] = useState("");
    const [typingOpponent, setTypingOpponent] = useState("");
    const [cursorClicked, setCursorClicked] = useState(false);
    const [showCursor, setShowCursor] = useState(false);
    const [scrollOffset, setScrollOffset] = useState(0);

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const loginBtnRef = useRef<HTMLButtonElement>(null);

    const repostBtnRef = useRef<HTMLButtonElement>(null);
    const challengeBtnRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const submitRef = useRef<HTMLButtonElement>(null);

    const clickCursor = async (duration = 150) => {
        setCursorClicked(true);
        await new Promise((r) => setTimeout(r, duration));
        setCursorClicked(false);
    };

    const typeText = async (text: string, setter: (val: string) => void, speed = 60) => {
        for (let i = 1; i <= text.length; i++) {
            setter(text.substring(0, i));
            await new Promise((r) => setTimeout(r, speed));
        }
    };

    const moveTo = async (ref: React.RefObject<HTMLElement | null>, duration = 1.2, offsetX = 0, offsetY = 0) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        await cursorControls.start({
            x: rect.left + rect.width / 2 + offsetX,
            y: rect.top + rect.height / 2 + offsetY,
            transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        });
    };

    useEffect(() => {
        let active = true;

        const playSequence = async () => {
            // -- STEP 0: Wait briefly --
            await new Promise((r) => setTimeout(r, 500));
            if (!active) return;

            // -- STEP 1: INTRO LOGO & HOOK (0s - 4.5s) --
            setStep(1);
            await new Promise((r) => setTimeout(r, 4000));
            if (!active) return;

            // -- STEP 2: SIGN IN SCREEN (4.5s - 10s) --
            setStep(2);
            setShowCursor(true);
            cursorControls.set({ x: window.innerWidth + 100, y: window.innerHeight, opacity: 1 });

            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;

            // Move to email
            await moveTo(emailRef, 1.2, -50);
            if (!active) return;
            await clickCursor();
            // Type email
            await typeText("prodigy@dheeyudha.com", setTypingEmail, 40);
            if (!active) return;

            // Move to password
            await moveTo(passwordRef, 0.6, -50);
            if (!active) return;
            await clickCursor();
            // Type password
            await typeText("********", setTypingPassword, 30);
            if (!active) return;

            // Move to login button
            await moveTo(loginBtnRef, 0.8);
            if (!active) return;
            await clickCursor();

            // Wait for transition to Dashboard
            await new Promise((r) => setTimeout(r, 600));
            if (!active) return;

            // -- STEP 3: APP DASHBOARD SCROLLING GLASS (10s - 16s) --
            setStep(3);

            // Move cursor to middle side out of the way for scroll
            cursorControls.start({ x: window.innerWidth - 100, y: window.innerHeight / 2, transition: { duration: 1 } });

            await new Promise((r) => setTimeout(r, 1500));
            if (!active) return;

            // Simulate scrolling
            for (let i = 0; i <= 20; i++) {
                if (!active) return;
                setScrollOffset((prev) => prev - 15);
                await new Promise((r) => setTimeout(r, 50));
            }
            // Stop scroll
            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;

            // -- STEP 4: REPOST ACTION (16s - 20s) --
            setStep(4);
            // Scroll back up slightly to focus on teacher card
            for (let i = 0; i <= 10; i++) {
                if (!active) return;
                setScrollOffset((prev) => prev + 10);
                await new Promise((r) => setTimeout(r, 50));
            }

            // Move to repost button
            await moveTo(repostBtnRef, 1.5);
            if (!active) return;

            // Hover effect on repost
            document.getElementById('repost-btn')?.classList.add('text-green-400', 'bg-white/10');
            await new Promise((r) => setTimeout(r, 400));
            if (!active) return;
            await clickCursor();

            // Wait to admire the green repost
            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;

            // -- STEP 5: CHALLENGE FRIEND (20s - 25s) --
            setStep(5);
            await moveTo(challengeBtnRef, 1.2);
            if (!active) return;
            await clickCursor();

            // Modal opens... move to search box
            await new Promise((r) => setTimeout(r, 600));
            if (!active) return;
            await moveTo(searchRef, 0.8, -60);
            if (!active) return;
            await clickCursor();

            await typeText("Rahul Kumar", setTypingOpponent, 50);
            if (!active) return;

            await moveTo(submitRef, 0.6);
            if (!active) return;
            await clickCursor();
            if (!active) return;

            // hide cursor
            cursorControls.start({ x: window.innerWidth + 100, y: window.innerHeight, transition: { duration: 1 } });

            // -- STEP 6: EPIC MATCH FOUND (25s - 28s) --
            await new Promise((r) => setTimeout(r, 500));
            if (!active) return;
            setStep(6);

            await new Promise((r) => setTimeout(r, 3500));
            if (!active) return;

            // -- STEP 7: OUTRO (28s - 32s) --
            setStep(7);

        };

        playSequence();
        return () => { active = false; };
    }, [cursorControls]);

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans">
            {/* Hide real mouse cursor */}
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
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1.5 }}
                        >
                            <DheeyudhaLogo variant="full" theme="dark" size={30} />
                        </motion.div>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1.5 }}
                            className="mt-12 text-5xl md:text-7xl font-bold tracking-tighter"
                        >
                            <span className="bg-gradient-to-br from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">
                                Redefining the <br /> Academic Arena.
                            </span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, letterSpacing: "1em" }}
                            animate={{ opacity: 1, letterSpacing: "0.5em" }}
                            transition={{ delay: 2.5, duration: 1.5 }}
                            className="mt-8 text-xl font-bold text-red-500/90 uppercase"
                        >
                            Prepare for the War of Wits
                        </motion.div>
                    </motion.div>
                )}

                {/* STEP 2: SIGN IN SCREEN */}
                {step === 2 && (
                    <motion.div
                        key="signin"
                        initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -50, filter: "blur(10px)", transition: { duration: 0.6 } }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full flex items-center justify-center relative overflow-hidden"
                    >
                        {/* Background glowing effects */}
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 blur-[120px] rounded-full" />

                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl z-10">
                            <div className="flex justify-center mb-8">
                                <DheeyudhaLogo variant="icon" theme="dark" size={60} />
                            </div>
                            <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">Welcome Back</h2>
                            <p className="text-gray-400 text-center mb-8 text-sm">Enter the arena to continue your journey.</p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        ref={emailRef}
                                        readOnly
                                        value={typingEmail}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder="Email Address"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        ref={passwordRef}
                                        readOnly
                                        value={typingPassword}
                                        type="password"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder="Password"
                                    />
                                </div>
                                <button
                                    ref={loginBtnRef}
                                    className="w-full mt-4 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Enter Arena <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* STEPS 3,4,5: APP DASHBOARD */}
                {(step >= 3 && step <= 5) && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-6xl h-[85vh] bg-[#050505] rounded-[2.5rem] border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden relative flex flex-col mx-4"
                    >
                        {/* Dashboard Header */}
                        <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/60 backdrop-blur-xl z-20 shrink-0">
                            <div className="flex items-center gap-4">
                                <DheeyudhaLogo variant="icon" theme="dark" size={36} />
                                <span className="text-white font-bold text-xl tracking-tight">Dheeyudha</span>
                            </div>
                            <div className="hidden md:flex items-center gap-8 px-6 py-2 bg-white/5 rounded-full border border-white/10">
                                <span className="text-white font-semibold flex items-center gap-2"><Trophy className="w-4 h-4" /> Leaderboard</span>
                                <span className="text-gray-400 font-medium hover:text-white transition-colors">Subjects</span>
                                <span className="text-gray-400 font-medium hover:text-white transition-colors">Feed</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center border-2 border-white/20">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        {/* Scrolling Body */}
                        <motion.div
                            className="flex-1 w-full relative z-10 flex flex-col overflow-hidden"
                            animate={{ y: scrollOffset }}
                            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                        >
                            {/* Giant Hook Header */}
                            <div className="px-12 py-16 flex flex-col md:flex-row gap-12 items-center">
                                <div className="flex-1">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                                    >
                                        <Sparkles className="w-4 h-4" /> The War of Wits is Live
                                    </motion.div>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                        className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tighter"
                                    >
                                        Earn glory. <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Master the syllabus.</span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                                        className="text-gray-400 max-w-lg text-xl mb-10 leading-relaxed"
                                    >
                                        Drop into intense intellectual battles, solve premium teacher questions, and climb the ranks of Grandmasters.
                                    </motion.p>

                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                                        <button
                                            ref={challengeBtnRef}
                                            className="group relative bg-white text-black px-10 py-5 rounded-2xl font-bold text-xl overflow-hidden flex items-center gap-4 transition-transform hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                        >
                                            <Sword className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                                            <span>Challenge a Friend</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Floating Glass Cards */}
                                <div className="flex-1 right-side-glass grid gap-6 relative p-8">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full -z-10" />

                                    <motion.div
                                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, type: "spring" }}
                                        className="bg-white/5 border border-white/10 backdrop-blur-2xl p-6 rounded-3xl w-full max-w-sm ml-auto shadow-2xl relative"
                                    >
                                        {/* Teacher Question mock inside Dashboard */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
                                                DR
                                            </div>
                                            <div>
                                                <div className="text-white font-bold tracking-tight text-lg flex items-center gap-2">
                                                    Dr. Sharma <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">Teacher</span>
                                                </div>
                                                <div className="text-gray-400 text-sm">Advanced Physics • Class 12</div>
                                            </div>
                                        </div>

                                        <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-5 hover:bg-black/60 transition-colors">
                                            <p className="text-white/90 font-medium leading-relaxed mb-4">Calculate the magnetic field at the center of a circular current-carrying coil with N turns.</p>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs font-bold text-red-400 uppercase tracking-widest">Hard</span>
                                                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-400 uppercase tracking-widest">+50 Points</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-5">
                                            <button className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl transition-all">
                                                Solve Now
                                            </button>
                                            <button
                                                id="repost-btn"
                                                ref={repostBtnRef}
                                                className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-all px-4 py-2.5 rounded-xl border border-transparent"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Repost
                                            </button>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, type: "spring" }}
                                        className="bg-black/40 border border-white/10 backdrop-blur-2xl p-6 rounded-3xl w-80 shadow-2xl relative mr-auto -mt-10"
                                    >
                                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                                            <span className="text-white font-bold opacity-80">Global Rank</span>
                                            <Target className="text-emerald-400 w-5 h-5" />
                                        </div>
                                        <div className="text-5xl font-black text-white mb-2 tracking-tighter">#432</div>
                                        <div className="text-emerald-400 font-bold text-sm">+12 positions today</div>
                                        <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-2/3 rounded-full" />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Extra space so scroll looks natural */}
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
                                        className="bg-[#111] border border-white/10 rounded-[2rem] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                                        <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Issue a Challenge</h3>
                                        <p className="text-gray-400 mb-8 text-lg leading-relaxed">Search for an opponent in the global arena to start a live battle.</p>

                                        <div className="relative mb-8 group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                                            <input
                                                ref={searchRef}
                                                readOnly
                                                value={typingOpponent}
                                                placeholder="Opponent Username"
                                                className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl py-4 pl-14 pr-4 text-xl text-white placeholder-gray-600 outline-none transition-all shadow-inner"
                                            />
                                        </div>

                                        <button
                                            ref={submitRef}
                                            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Intiate Battle <Sword className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* STEP 6: EPIC MATCH FOUND TRANSITION */}
                {step === 6 && (
                    <motion.div
                        key="epic-match"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 1 } }}
                        className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden z-[100]"
                    >
                        {/* Dramatic radial glow */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 2, opacity: 0.5 }}
                            transition={{ duration: 3, ease: "easeOut" }}
                            className="absolute bg-orange-600/30 w-[800px] h-[800px] rounded-full blur-[120px]"
                        />

                        <div className="relative z-10 flex flex-col items-center justify-center text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                className="w-40 h-40 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_120px_rgba(239,68,68,0.4)] mb-10 border border-white/20"
                            >
                                <Sword className="w-20 h-20 text-white" />
                            </motion.div>

                            <motion.div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-orange-400 font-bold tracking-[0.5em] text-xl mb-4"
                                >
                                    GET READY
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", delay: 0.4 }}
                                    className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter mix-blend-overlay drop-shadow-2xl"
                                >
                                    MATCH FOUND
                                </motion.h2>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, type: "spring" }}
                                className="mt-16 flex items-center gap-12 text-4xl font-bold text-white bg-black/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10"
                            >
                                <div className="flex flex-col items-center gap-4 w-32">
                                    <div className="w-24 h-24 rounded-full border-[3px] border-indigo-500 bg-indigo-900/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                        <User className="w-10 h-10 text-indigo-300" />
                                    </div>
                                    <span className="text-indigo-400 text-xl tracking-tight">You</span>
                                </div>
                                <span className="text-white/20 text-5xl font-black italic px-8">VS</span>
                                <div className="flex flex-col items-center gap-4 w-32">
                                    <div className="w-24 h-24 rounded-full border-[3px] border-red-500 bg-red-900/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                        <span className="text-red-300 font-bold text-4xl">R</span>
                                    </div>
                                    <span className="text-red-400 text-xl tracking-tight">Rahul</span>
                                </div>
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
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
                            className="relative z-10"
                        >
                            <DheeyudhaLogo variant="full" theme="dark" size={80} />
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, letterSpacing: "1em" }}
                            animate={{ opacity: 1, letterSpacing: "0.5em" }}
                            transition={{ delay: 1.5, duration: 2 }}
                            className="text-white/60 text-lg font-bold tracking-[0.5em] uppercase mt-12 relative z-10"
                        >
                            The Arena Awaits.
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAKE APPLE-LIKE CURSOR */}
            {showCursor && (
                <motion.div
                    animate={cursorControls}
                    initial={{ opacity: 0 }}
                    className="fixed top-0 left-0 z-[999999] pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                    style={{ transformOrigin: "top left" }}
                >
                    <motion.div
                        animate={{ scale: cursorClicked ? 0.8 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative"
                    >
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" fill="#000" />
                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>

                        {/* Ripple click effect */}
                        <AnimatePresence>
                            {cursorClicked && (
                                <motion.div
                                    initial={{ scale: 0.2, opacity: 0.8 }}
                                    animate={{ scale: 3.5, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="absolute top-1.5 left-2.5 w-5 h-5 rounded-full border-2 border-white/80 pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
