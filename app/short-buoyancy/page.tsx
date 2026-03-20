"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowDown, Video, Loader2, Anchor, Edit3, ArrowUp } from "lucide-react";

export default function ShortAnimationBuoyancy() {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState<string>("Click to generate audio & record");
    const [recording, setRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const startRecordingAndAnimation = async () => {
        try {
            setStatus("Generating AI Voice via Sarvam...");

            // 1. Fetch TTS Audio (Sarvam AI API)
            const response = await fetch("https://api.sarvam.ai/text-to-speech/stream", {
                method: "POST",
                headers: {
                    "api-subscription-key": "sk_3ezu2nya_dTQ0gxd4pHVIdwAkDo4ZWmep",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: `Let's talk about Buoyancy. See this? A 100,000-ton solid steel ship. It floats perfectly. But if I drop this tiny 100 gram pebble... boom. Straight to the bottom. Why? The keyword is Displacement. When an object enters water, it has to push water out of the way. According to Archimedes' principle, the water pushes back with an upward force exactly equal to the weight of the water displaced. Because a ship's hull is hollow and holds air, its overall density is less than water, displacing massive water and floating! Okay, here's your challenge. A paradox: if you drop a heavy 16 pound bowling ball into a pool of liquid Mercury, what happens? Does it sink fast or float like a balloon? I just uploaded a Level 99 Bounty on this exact physics paradox on my competitive study app, Dheeyudha. Challenge yourself on this topic, tag your smartest friend for a Co-op session, and see if you can solve it. Link in the pinned comment. Let's see who gets it right.`,
                    target_language_code: "en-IN",
                    speaker: "shubh",
                    model: "bulbul:v3",
                    pace: 1.1,
                    speech_sample_rate: 22050,
                    output_audio_codec: "mp3",
                    enable_preprocessing: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const chunks: Uint8Array[] = [];
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader stream");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            setStatus("Waiting for screen share... (Select 'This Tab')");
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "browser",
                    width: { ideal: 1080 },
                    height: { ideal: 1920 },
                    frameRate: { ideal: 60 }
                },
                audio: false
            });

            setStatus("Starting mix down...");

            const audioCtx = new window.AudioContext();
            const dest = audioCtx.createMediaStreamDestination();
            const source = audioCtx.createMediaElementSource(audio);

            source.connect(dest);
            source.connect(audioCtx.destination);

            const tracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
            const combinedStream = new MediaStream(tracks);

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm',
                videoBitsPerSecond: 8000000 // 8 Mbps for 1080p quality
            });
            const recordedChunks: Blob[] = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };

            recorder.onstop = () => {
                const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(finalBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'Dheeyudha-Buoyancy-Short-V2.webm';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                stream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            mediaRecorderRef.current = recorder;

            setStatus("");
            setRecording(true);
            setStep(1);

            audio.ontimeupdate = () => {
                const t = audio.currentTime;
                // Re-timed to match the new "teaching" script
                if (t >= 0 && t < 2.5) setStep(1); // Title
                else if (t >= 2.5 && t < 7.5) setStep(2); // Ship
                else if (t >= 7.5 && t < 12.0) setStep(3); // Pebble
                else if (t >= 12.0 && t < 18.0) setStep(4); // Displacement Concept
                else if (t >= 18.0 && t < 25.0) setStep(5); // Archimedes
                else if (t >= 25.0 && t < 33.0) setStep(6); // Density & Hollow rule
                else if (t >= 33.0 && t < 43.0) setStep(7); // Bowling ball paradox
                else if (t >= 43.0 && t < 48.0) setStep(8); // App Reveal
                else if (t >= 48.0) setStep(9); // Call to action Co-op
            };

            audio.onended = () => {
                setTimeout(() => {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                        mediaRecorderRef.current.stop();
                    }
                    setRecording(false);
                    setStatus("Video downloaded successfully!");
                }, 1500);
            };

            audio.play();

        } catch (err: any) {
            console.error("Setup error:", err);
            setStatus(`Error: ${err.message || 'Something went wrong.'}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans overflow-hidden">
            {!recording && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Anchor className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Buoyancy Lesson (V2)</h2>
                        <p className="text-slate-400 text-sm mb-8">
                            Generates AI voice & records a frame-by-frame whiteboard "teaching" style animation.
                        </p>
                        <button
                            onClick={startRecordingAndAnimation}
                            disabled={status.includes("Generating") || status.includes("Waiting")}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                        >
                            {status.includes("Generating") && <Loader2 className="w-5 h-5 animate-spin" />}
                            {status || "START GENERATING & RECORDING"}
                        </button>
                    </div>
                </div>
            )}

            {/* WHITEBOARD STYLE CANVAS */}
            <div className="relative w-[360px] h-[640px] md:w-[450px] md:h-[800px] bg-[#0A0A0A] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,1)] border-[8px] border-[#1a1a1a] overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-50" />

                {/* Chalkboard texture background */}
                <div className="absolute inset-0 bg-[#1e293b] opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full border-[20px] border-slate-800/50 rounded-3xl m-4" />
                </div>

                <AnimatePresence mode="wait">

                    {/* SCENE 1: TITLE */}
                    {step === 1 && (
                        <motion.div
                            key="s1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10"
                        >
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1 }}
                                className="border-b-4 border-emerald-400 pb-4 overflow-hidden"
                            >
                                <h1 className="text-5xl font-black text-white text-center tracking-tight font-mono">BUOYANCY</h1>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SCENE 2: THE SHIP (Teaching draw-in) */}
                    {step === 2 && (
                        <motion.div
                            key="s2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10"
                        >
                            <div className="flex items-center gap-3 mb-10 text-emerald-400 font-mono text-2xl font-bold">
                                <Edit3 className="w-8 h-8" />
                                <span>Example A</span>
                            </div>

                            <div className="relative w-full h-40 border-b-2 border-dashed border-blue-400/50 flex items-end justify-center pb-2">
                                <motion.div
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="w-32 h-16 border-4 border-white rounded-b-xl flex flex-col items-center justify-end relative bg-slate-800/80"
                                >
                                    <span className="text-white font-black font-mono absolute -top-8">100,000 Tons</span>
                                    <span className="text-emerald-400 font-bold mb-2">FLOATS</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCENE 3: THE PEBBLE */}
                    {step === 3 && (
                        <motion.div
                            key="s3"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10"
                        >
                            <div className="flex items-center gap-3 mb-10 text-red-400 font-mono text-2xl font-bold">
                                <Edit3 className="w-8 h-8" />
                                <span>Example B</span>
                            </div>

                            <div className="relative w-full h-64 border-b-2 border-dashed border-blue-400/50 flex flex-col items-center justify-start pt-4 bg-blue-900/20">

                                <span className="text-white font-black font-mono">100g Pebble</span>

                                <motion.div
                                    initial={{ y: 0 }}
                                    animate={{ y: 150 }}
                                    transition={{ duration: 0.5, ease: "easeIn" }}
                                    className="w-6 h-6 bg-white rounded-full mt-2 relative"
                                >
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="absolute top-10 -left-16 text-red-500 font-bold text-xl drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]"
                                    >
                                        SINKS!
                                    </motion.div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCENE 4: DISPLACEMENT CONCEPT */}
                    {step === 4 && (
                        <motion.div
                            key="s4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center p-8 z-10 pt-24"
                        >
                            <motion.h2
                                initial={{ color: "#fff" }}
                                animate={{ color: "#34d399" }}
                                transition={{ delay: 1 }}
                                className="text-4xl font-black font-mono uppercase text-center mb-12"
                            >
                                DISPLACEMENT
                            </motion.h2>

                            {/* Water box animation */}
                            <div className="relative w-48 h-48 border-4 border-white/50 rounded-lg flex items-end justify-center overflow-hidden bg-slate-900/50">
                                <motion.div
                                    initial={{ height: "40%" }}
                                    animate={{ height: "80%" }}
                                    transition={{ delay: 1, duration: 2 }}
                                    className="w-full bg-blue-500/50 absolute bottom-0"
                                />

                                {/* Object entering */}
                                <motion.div
                                    initial={{ y: -100 }}
                                    animate={{ y: 20 }}
                                    transition={{ delay: 1, duration: 2 }}
                                    className="w-20 h-20 border-4 border-white bg-slate-800 z-10 flex items-center justify-center font-bold text-white mb-8"
                                >
                                    OBJ
                                </motion.div>

                                {/* Water pushing out arrows */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                                    <ArrowUp className="absolute top-10 left-4 w-8 h-8 text-blue-400" />
                                    <ArrowUp className="absolute top-10 right-4 w-8 h-8 text-blue-400" />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCENE 5: ARCHIMEDES EQUATION */}
                    {step === 5 && (
                        <motion.div
                            key="s5"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10"
                        >
                            <h2 className="text-2xl font-bold text-slate-400 font-mono mb-4 text-center">Archimedes' Principle</h2>

                            <motion.div
                                className="border-4 border-emerald-500 p-6 rounded-2xl bg-black/50"
                                initial={{ rotate: -5 }}
                                animate={{ rotate: 0 }}
                            >
                                <div className="flex items-center gap-4 text-3xl font-black font-mono text-white">
                                    <span className="text-emerald-400">F<sub className="text-sm">buoyancy</sub></span>
                                    <span>=</span>
                                    <span className="text-blue-400">W<sub className="text-sm">fluid</sub></span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 2, duration: 2 }}
                                className="overflow-hidden whitespace-nowrap mt-8 text-center"
                            >
                                <span className="text-xl font-bold text-white leading-tight">Upward Force = <br /><span className="text-blue-400">Weight of Water Displaced</span></span>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SCENE 6: DENSITY & HOLLOW RULE */}
                    {step === 6 && (
                        <motion.div
                            key="s6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 bg-[#0B101E]"
                        >
                            <h2 className="text-xl font-bold font-mono text-white mb-8 border-b-2 border-emerald-500 pb-2">Why the ship floats:</h2>

                            <div className="flex w-full items-center justify-between mb-8">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-24 h-24 border-4 dashed border-emerald-400 rounded-full flex items-center justify-center flex-col relative"
                                >
                                    <span className="font-bold text-white z-10">AIR</span>
                                    <span className="text-[10px] text-emerald-400 mt-1 z-10">Low Density</span>
                                    <div className="absolute inset-2 bg-emerald-500/20 rounded-full blur-sm" />
                                </motion.div>
                                <span className="text-4xl font-black text-slate-500">+</span>
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
                                    className="w-24 h-24 border-4 border-slate-400 bg-slate-600 rounded-md flex items-center justify-center flex-col"
                                >
                                    <span className="font-bold text-white">STEEL</span>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                className="bg-emerald-900/50 border border-emerald-500 p-4 rounded-xl text-center w-full shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                                <p className="font-mono text-emerald-400 font-bold uppercase tracking-wider">Overall Density</p>
                                <p className="text-white text-2xl font-black">&lt; Water</p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SCENE 7: THE TRAP (Bowling ball in Mercury) */}
                    {step === 7 && (
                        <motion.div
                            key="s7"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#1A0505] z-10"
                        >
                            <h2 className="text-4xl font-black text-white text-center leading-tight uppercase font-mono mb-2">
                                THE <span className="text-red-500">PARADOX</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-center mb-8 tracking-widest uppercase text-xs">A Level 99 Problem</p>

                            <div className="relative w-full max-w-xs h-64 border-4 border-slate-700 rounded-2xl flex flex-col overflow-hidden bg-black shadow-2xl">

                                {/* Liquid Mercury Pool - Silver/Grey */}
                                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-slate-300 to-slate-500 shadow-[inset_0_5px_15px_rgba(255,255,255,0.5)]">
                                    <span className="absolute bottom-2 left-0 w-full text-center text-slate-800 font-black tracking-widest opacity-50">LIQUID MERCURY</span>
                                </div>

                                {/* Bowling Ball Falling */}
                                <motion.div
                                    initial={{ y: -100, rotate: 0 }}
                                    animate={{ y: [-100, 60], rotate: 45 }}
                                    transition={{ duration: 1, ease: "easeIn" }}
                                    className="absolute left-1/2 -ml-10 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-800 to-black border-2 border-slate-400/30 flex items-center justify-center shadow-xl z-10"
                                >
                                    <div className="w-3 h-3 rounded-full bg-black/80 absolute top-4 left-4"></div>
                                    <div className="w-3 h-3 rounded-full bg-black/80 absolute top-4 right-4"></div>
                                    <div className="w-3 h-3 rounded-full bg-black/80 absolute top-10 left-8"></div>
                                </motion.div>

                                {/* QUESTION MARKS */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                    className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm"
                                >
                                    <span className="text-7xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">?</span>
                                </motion.div>
                            </div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="flex gap-4 mt-8 w-full font-black">
                                <div className="flex-1 border-2 border-slate-700 rounded-xl p-4 text-center text-xl text-slate-500 bg-black">SINK?</div>
                                <div className="flex-1 border-2 border-slate-700 rounded-xl p-4 text-center text-xl text-slate-500 bg-black">FLOAT?</div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SCENE 8: APP UI REVEAL */}
                    {step === 8 && (
                        <motion.div
                            key="s8"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                            transition={{ type: "spring", damping: 20 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0a] z-10"
                        >
                            <div className="absolute top-10 w-full px-8 flex items-center justify-between">
                                <span className="font-black text-white tracking-widest text-lg">DHEEYUDHA</span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500" />
                            </div>

                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="w-full bg-[#111] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_20px_60px_rgba(16,185,129,0.2)] relative overflow-hidden mt-6"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 blur-3xl -mr-10 -mt-10" />

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-red-500/30">
                                        Level 99 Bounty
                                    </span>
                                </div>

                                <h3 className="text-white font-bold text-xl mb-2">The Mercury Paradox</h3>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    Will a 16lb Bowling Ball float or sink in liquid Mercury? Prove your conclusion utilizing Archimedes' density formulas.
                                </p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-emerald-400 font-bold text-lg">+1000</div>
                                        <div className="text-slate-500 text-xs uppercase font-bold tracking-wider">XP</div>
                                    </div>

                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                    >
                                        Accept Challenge
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SCENE 9: CO-OP CALL TO ACTION */}
                    {step === 9 && (
                        <motion.div
                            key="s9"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0a] z-10"
                        >
                            <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xl" />

                            <motion.div
                                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 25 }}
                                className="w-full bg-white rounded-[2rem] p-6 shadow-2xl relative z-10 border border-slate-200"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shadow-inner">
                                        <span className="text-3xl">🤝</span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl leading-tight">Co-op Mode</h3>
                                        <p className="text-slate-500 text-sm font-medium">Earn 2x XP for teaming up</p>
                                    </div>
                                </div>

                                <div className="w-full bg-slate-100 p-4 rounded-xl border border-dashed border-slate-300 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold font-mono">P1</div>
                                        <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center -ml-5 text-slate-600 text-xs font-bold font-mono">?</div>
                                        <span className="text-slate-600 font-bold ml-2">Waiting for Partner...</span>
                                    </div>
                                </div>

                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-center text-sm shadow-xl flex items-center justify-center gap-2"
                                >
                                    Tag Your Smartest Friend
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="absolute bottom-10 px-8 py-4 bg-emerald-500 text-white rounded-full font-black shadow-[0_0_30px_rgba(16,185,129,0.5)] z-20 flex items-center gap-2 border-2 border-emerald-400"
                            >
                                🔗 Link in pinned comment
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
