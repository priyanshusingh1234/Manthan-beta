"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowDown } from "lucide-react";

export default function ShortAnimation() {
    const [step, setStep] = useState(0);
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        // Sequence Timeline for YouTube Short
        const timeline = async () => {
            // STEP 1: The Hook (0s)
            setStep(1);

            // Fast counter animation for 99%
            let c = 0;
            const interval = setInterval(() => {
                c += 3;
                if (c >= 99) {
                    c = 99;
                    clearInterval(interval);
                }
                setCounter(c);
            }, 30);

            await new Promise((r) => setTimeout(r, 5000));

            // STEP 2: The Setup / Drawing (5s)
            setStep(2);
            await new Promise((r) => setTimeout(r, 8000)); // Increased time for reading the text

            // STEP 3: The Options (13s)
            setStep(3);
            await new Promise((r) => setTimeout(r, 3000));

            // STEP 4: The Trap / Red X (14s)
            setStep(4);
            await new Promise((r) => setTimeout(r, 6000));

            // STEP 5: Call to Action (App Reveal Prompt) (20s)
            setStep(5);
        };

        // Start 2 seconds after page loads to allow time to hit record
        setTimeout(timeline, 2000);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans overflow-hidden">

            {/* INSTRUCTIONS */}
            <div className="absolute top-4 left-4 text-white/50 text-xs max-w-xs">
                <p>1. Open OBS</p>
                <p>2. Window Capture this browser</p>
                <p>3. Crop to the 9:16 phone frame</p>
                <p>4. Reload page (F5) and hit RECORD immediately</p>
            </div>

            {/* 9:16 PHONE FRAME (1080x1920 scaled down) */}
            <div className="relative w-[360px] h-[640px] md:w-[450px] md:h-[800px] bg-[#0A0A0A] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,1)] border-[8px] border-[#1a1a1a] overflow-hidden flex flex-col">

                {/* GLOBAL GRAIN/GLOW */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-50" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />

                <AnimatePresence mode="wait">

                    {/* SCENE 1: THE HOOK */}
                    {step === 1 && (
                        <motion.div
                            key="scene1"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                            >
                                {counter}%
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="text-4xl font-black text-white uppercase tracking-tight mt-6"
                            >
                                Of Students <br />
                                <span className="text-red-500">Fail This.</span>
                            </motion.h1>
                        </motion.div>
                    )}

                    {/* SCENE 2: THE SETUP (DIGITAL WHITEBOARD & QUESTION TEXT) */}
                    {step === 2 && (
                        <motion.div
                            key="scene2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col p-6 bg-[#111]"
                        >
                            {/* Question Text Typing Out */}
                            <div className="mt-8 space-y-3 relative z-20">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "linear", delay: 0.5 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    <p className="text-white text-lg font-bold leading-tight">
                                        <span className="text-indigo-400">Q:</span> A uniform chain of mass
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "linear", delay: 2.0 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    <p className="text-white text-lg font-bold leading-tight">
                                        M hangs above a scale.
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2, ease: "linear", delay: 3.5 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    <p className="text-red-400 text-lg font-black leading-tight uppercase tracking-wide">
                                        It drops. What is the max
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "linear", delay: 5.5 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    <p className="text-red-400 text-lg font-black leading-tight uppercase tracking-wide">
                                        scale reading?
                                    </p>
                                </motion.div>
                            </div>

                            {/* Diagram Container */}
                            <div className="flex-1 w-full relative flex flex-col items-center justify-end pb-20">

                                {/* The Chain */}
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 200, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 7.5 }}
                                    className="w-4 bg-gradient-to-b from-slate-400 to-slate-200 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] relative z-10"
                                >
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2 }}
                                        className="absolute -right-16 top-1/2 -translate-y-1/2 text-2xl font-black text-white"
                                    >
                                        Mass M
                                    </motion.div>
                                </motion.div>

                                {/* The Drop Indicator */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.5, repeat: Infinity, repeatType: "reverse", duration: 1 }}
                                    className="absolute top-1/2 left-1/4"
                                >
                                    <ArrowDown className="w-10 h-10 text-red-500" />
                                </motion.div>

                                {/* The Scale */}
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 160, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="h-8 bg-slate-800 rounded-lg mt-1 border-t-2 border-slate-600 flex items-center justify-center relative z-0 shadow-2xl"
                                >
                                    <div className="w-16 h-4 bg-black rounded flex items-center justify-center">
                                        <motion.span
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                                            className="text-[10px] text-red-500 font-mono font-bold"
                                        >
                                            0.00 kg
                                        </motion.span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCENE 3 & 4: THE OPTIONS & THE TRAP */}
                    {(step === 3 || step === 4) && (
                        <motion.div
                            key="scene3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0a0a0a]"
                        >
                            <h2 className="text-3xl font-black text-white text-center mb-12 uppercase leading-tight">
                                Maximum <br />
                                <span className="text-indigo-400">Scale Reading?</span>
                            </h2>

                            <div className="w-full space-y-4">
                                {/* Option A */}
                                <motion.div
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className={`relative w-full p-6 rounded-2xl border-2 font-black text-2xl flex items-center justify-between transition-colors
                                        ${step === 4 ? 'bg-red-950/50 border-red-500/50 text-red-200' : 'bg-white/5 border-white/10 text-white'}
                                    `}
                                >
                                    <span>[A] 1 Mg</span>
                                    {step === 4 && (
                                        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                                            <X className="w-10 h-10" />
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Option B */}
                                <motion.div
                                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }}
                                    className={`w-full p-6 rounded-2xl border-2 font-black text-2xl flex items-center justify-between ${step === 4 ? 'opacity-50 blur-[1px]' : ''} bg-white/5 border-white/10 text-white`}
                                >
                                    <span>[B] 2 Mg</span>
                                </motion.div>

                                {/* Option C */}
                                <motion.div
                                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6, type: "spring" }}
                                    className={`w-full p-6 rounded-2xl border-2 font-black text-2xl flex items-center justify-between transition-all duration-1000 ${step === 4 ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200 scale-105 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 text-white'}`}
                                >
                                    <span>[C] 3 Mg</span>
                                    {step === 4 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-indigo-400">
                                            <Check className="w-8 h-8" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCENE 5: RECORD APP PROMPT */}
                    {step === 5 && (
                        <motion.div
                            key="scene5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-indigo-950 text-center"
                        >
                            <div className="w-24 h-24 mb-6 rounded-full bg-indigo-500/20 flex items-center justify-center border-4 border-indigo-400">
                                <Check className="w-12 h-12 text-indigo-300" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4">
                                ANIMATION COMPLETE
                            </h2>
                            <p className="text-indigo-200 font-medium mb-8">
                                Now, stop recording. Screen record yourself opening Dheeyudha, searching "Falling Chain", and interacting with the app. Stitch them together in your editor!
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
