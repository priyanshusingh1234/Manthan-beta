"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Search, Sword, Target, Crosshair, Sparkles, Shield, User, Trophy, Zap, RefreshCw } from "lucide-react";

export default function TrailerPage() {
    const cursorControls = useAnimation();

    // Steps: 
    // 0 = Initial Black
    // 1 = Intro Text
    // 2 = App UI (Dashboard)
    // 3 = Modal Open
    // 4 = Match Found
    // 5 = Outro
    const [step, setStep] = useState(0);
    const [typingText, setTypingText] = useState("");
    const [cursorClicked, setCursorClicked] = useState(false);
    const [showCursor, setShowCursor] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const submitRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        let active = true;

        const playSequence = async () => {
            // STEP 0 -> 1: INTRO TEXT
            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;
            setStep(1);

            // STEP 1 -> 2: APP DASHBOARD
            await new Promise((r) => setTimeout(r, 3000));
            if (!active) return;
            setStep(2);

            // Prepare Cursor
            setShowCursor(true);
            cursorControls.set({ x: window.innerWidth + 100, y: window.innerHeight + 100, opacity: 0 });

            // Wait for Dashboard to render
            await new Promise((r) => setTimeout(r, 1500));
            if (!active) return;

            // Move to "Challenge Friend" button
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                cursorControls.set({ opacity: 1 });
                await cursorControls.start({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    transition: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }
                });

                if (!active) return;
                setCursorClicked(true);
                await new Promise((r) => setTimeout(r, 150));
                setCursorClicked(false);
                setStep(3); // OPEN MODAL
            }

            // Move to Input Box
            await new Promise((r) => setTimeout(r, 1000));
            if (!active) return;

            if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                await cursorControls.start({
                    x: rect.left + 50,
                    y: rect.top + rect.height / 2,
                    transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }
                });

                if (!active) return;
                setCursorClicked(true);
                await new Promise((r) => setTimeout(r, 150));
                setCursorClicked(false);

                // Type the name
                const name = "Rahul Kumar";
                for (let i = 1; i <= name.length; i++) {
                    if (!active) break;
                    setTypingText(name.substring(0, i));
                    await new Promise((r) => setTimeout(r, 80));
                }
            }

            // Move to "Start Battle" Button
            await new Promise((r) => setTimeout(r, 500));
            if (!active) return;

            if (submitRef.current) {
                const rect = submitRef.current.getBoundingClientRect();
                await cursorControls.start({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
                });

                if (!active) return;
                setCursorClicked(true);
                await new Promise((r) => setTimeout(r, 150));
                setCursorClicked(false);
            }

            // Move cursor out
            cursorControls.start({
                x: window.innerWidth + 100,
                y: window.innerHeight,
                transition: { duration: 1.5, ease: "easeInOut" }
            });

            // Transition to MATCH FOUND Cinematic
            await new Promise((r) => setTimeout(r, 400));
            if (!active) return;
            setStep(4);

            // Wait on Match Found, then go to Outro
            await new Promise((r) => setTimeout(r, 4000));
            if (!active) return;
            setStep(5);
        };

        playSequence();
        return () => { active = false; };
    }, [cursorControls]);

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans">
            {/* Global style to hide real mouse cursor */}
            <style dangerouslySetInnerHTML={{ __html: `body { cursor: none !important; }` }} />

            <AnimatePresence mode="wait">
                {/* INTRO TEXT */}
                {step === 1 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-white text-5xl md:text-7xl font-bold tracking-tighter text-center"
                    >
                        <span className="bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                            Education meets <br /> The Arena.
                        </span>
                    </motion.div>
                )}

                {/* APP DASHBOARD / MAIN UI */}
                {(step === 2 || step === 3) && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 10 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // Apple-like custom spring feel
                        className="w-full max-w-5xl aspect-video bg-[#0A0A0A] rounded-[2rem] border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden relative flex flex-col"
                        style={{ perspective: "1000px" }}
                    >
                        {/* Fake Header */}
                        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white font-bold text-lg tracking-tight">Dheeyudha</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-gray-400 text-sm font-medium">Dashboard</span>
                                <span className="text-gray-400 text-sm font-medium">Leaderboard</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Fake Body */}
                        <div className="flex-1 p-10 flex gap-8">
                            <div className="flex-1 flex flex-col justify-center">
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4 w-max"
                                >
                                    <Sparkles className="w-3 h-3" /> New Co-op Mode
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                                    className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
                                >
                                    Prove your skills. <br /> Challenge the best.
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
                                    className="text-gray-400 max-w-md text-lg mb-8"
                                >
                                    Engage in intense academic battles, climb the global leaderboard, and conquer the Dheeyudha realm.
                                </motion.p>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
                                    <button
                                        ref={buttonRef}
                                        className="relative group bg-white text-black px-8 py-4 rounded-xl font-bold text-lg overflow-hidden flex items-center gap-3 hover:scale-105 transition-transform"
                                    >
                                        <Sword className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        Challenge a Friend
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    </button>
                                </motion.div>
                            </div>

                            {/* Decorative Glass Cards Right Side */}
                            <div className="hidden md:flex flex-1 relative items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: -5 }} transition={{ delay: 1.2, type: "spring" }}
                                    className="absolute bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-6 rounded-2xl w-64 shadow-2xl -ml-20 -mt-10"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                            <Trophy className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Rank</div>
                                            <div className="text-white font-bold text-xl">Grandmaster</div>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 w-3/4" />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 5 }} transition={{ delay: 1.4, type: "spring" }}
                                    className="absolute bg-gradient-to-br from-indigo-900 to-black border border-indigo-500/30 p-6 rounded-2xl w-72 shadow-2xl ml-20 mt-20 backdrop-blur-xl"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white font-bold">Recent Battles</span>
                                        <Target className="text-indigo-400 w-5 h-5" />
                                    </div>
                                    <div className="space-y-3 gap-2">
                                        {[1, 2].map(i => (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                                <div className="flex-1">
                                                    <div className="h-2 bg-white/20 w-16 rounded mb-1.5" />
                                                    <div className="h-1.5 bg-white/10 w-10 rounded" />
                                                </div>
                                                <span className="text-emerald-400 text-xs font-bold">+15</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* FAKE MODAL OVERLAY */}
                        <AnimatePresence>
                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                        className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                                        <h3 className="text-2xl font-bold text-white mb-2">Issue a Challenge</h3>
                                        <p className="text-gray-400 text-sm mb-6">Enter your opponent's username to start a live co-op battle.</p>

                                        <div className="relative mb-6">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                ref={inputRef}
                                                readOnly
                                                value={typingText}
                                                placeholder="Username..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>

                                        <button
                                            ref={submitRef}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors relative overflow-hidden group"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">Initiate Battle <ArrowRight className="w-4 h-4" /></span>
                                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* EPIC MATCH FOUND TRANSITION */}
                {step === 4 && (
                    <motion.div
                        key="epic-match"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 1 } }}
                        className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden"
                    >
                        {/* Dramatic radial glow */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 2, opacity: 0.4 }} transition={{ duration: 3, ease: "easeOut" }}
                            className="absolute bg-red-600/30 w-[800px] h-[800px] rounded-full blur-[100px]"
                        />

                        <div className="relative z-10 flex flex-col items-center justify-center text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                className="w-32 h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(239,68,68,0.5)] mb-8"
                            >
                                <Sword className="w-16 h-16 text-white" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", delay: 0.4 }}
                                className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 uppercase tracking-tighter"
                            >
                                MATCH FOUND
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                                className="mt-10 flex items-center gap-8 text-3xl font-bold text-white"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full border-2 border-indigo-500 bg-indigo-900/50 backdrop-blur-md flex items-center justify-center">
                                        <User className="w-8 h-8 text-indigo-300" />
                                    </div>
                                    <span className="text-indigo-400">You</span>
                                </div>
                                <span className="text-red-500 text-5xl font-black italic">VS</span>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full border-2 border-red-500 bg-red-900/50 backdrop-blur-md flex items-center justify-center">
                                        <span className="text-red-300 font-bold text-2xl">R</span>
                                    </div>
                                    <span className="text-red-400">Rahul</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* OUTRO */}
                {step === 5 && (
                    <motion.div
                        key="outro"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-center"
                    >
                        <h2 className="text-white text-6xl md:text-8xl font-black tracking-tighter mb-6">
                            DHEEYUDHA
                        </h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="text-gray-400 text-xl font-medium tracking-widest uppercase"
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
                    className="fixed top-0 left-0 z-[99999] pointer-events-none drop-shadow-2xl"
                    style={{ transformOrigin: "top left" }}
                >
                    <motion.div
                        animate={{ scale: cursorClicked ? 0.8 : 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Inner solid black cursor */}
                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" fill="#000" />
                            {/* Thick bright white stroke to make it pop like Mac */}
                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>

                        {/* Ripple click effect */}
                        <AnimatePresence>
                            {cursorClicked && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0.8 }}
                                    animate={{ scale: 3, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute top-1 left-2 w-4 h-4 rounded-full border-2 border-white pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
