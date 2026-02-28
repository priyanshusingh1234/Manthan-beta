"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowDown, Video, Loader2 } from "lucide-react";

export default function ShortAnimation() {
    const [step, setStep] = useState(0);
    const [counter, setCounter] = useState(0);
    const [status, setStatus] = useState<string>("Click to generate audio & record");
    const [recording, setRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

        // Await specific intervals matching the voiceover
        await new Promise((r) => setTimeout(r, 6500));

        // STEP 2: The Setup / Drawing
        setStep(2);
        await new Promise((r) => setTimeout(r, 11000));

        // STEP 3: The Options
        setStep(3);
        await new Promise((r) => setTimeout(r, 4000));

        // STEP 4: The Trap / Red X 
        setStep(4);
        await new Promise((r) => setTimeout(r, 7000));

        // STEP 5: Call to Action (App Reveal Prompt)
        setStep(5);
        await new Promise((r) => setTimeout(r, 12000)); // allow CTA to play

        // Stop Recording automatically
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
        setStatus("Video downloaded successfully!");
    };

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
                    text: `99% of students fail this. I am giving 500 bonus ranking points inside the Dheeyudha arena to the first person who solves this physics problem. Imagine a heavy uniform chain of mass M. It hangs vertically so the bottom link just touches a weighing scale. You let it drop. What is the absolute maximum weight the scale reads during the fall? If you said 1Mg, you're wrong. The impact force changes everything. I just uploaded this exact question as a Level 99 Bounty on my new competitive study app, Dheeyudha. Drop into the arena, upload your mathematical proof, and claim the rank number one spot. The link is in the pinned comment. Good luck.`,
                    target_language_code: "hi-IN",
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

            // Read the stream chunks into a playable blob
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

            // 2. Request screen recording (DisplayMedia)
            setStatus("Waiting for screen share... (Select 'This Tab')");
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: "browser" },
                audio: false
            });

            setStatus("Starting mix down...");

            // 3. Mix TTS Audio into Recording Stream bypassing Microphone
            const audioCtx = new window.AudioContext();
            const dest = audioCtx.createMediaStreamDestination();
            const source = audioCtx.createMediaElementSource(audio);

            // Connect to destination stream (for recording)
            source.connect(dest);
            // Connect to computer speakers so user can hear it locally
            source.connect(audioCtx.destination);

            // Combine the video from screen and audio from TTS
            const tracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
            const combinedStream = new MediaStream(tracks);

            // 4. Start Recording
            const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
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
                a.download = 'Dheeyudha-Viral-Short.webm';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                stream.getTracks().forEach(t => t.stop()); // kill screen share
            };

            recorder.start();
            mediaRecorderRef.current = recorder;

            // 5. Hide controls, play audio, start animation sequence!
            setStatus("");
            setRecording(true);
            audio.play();
            timeline();

        } catch (err: any) {
            console.error("Setup error:", err);
            setStatus(`Error: ${err.message || 'Something went wrong.'}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans overflow-hidden">

            {/* INSTRUCTIONS / RECORDING OVERLAY (Hides while recording) */}
            {!recording && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Video className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Auto-Record Short</h2>
                        <p className="text-slate-400 text-sm mb-8">
                            This will generate the AI voice, ask you to select this tab, and automatically record the animation & audio into an MP4/WebM file.
                        </p>

                        <button
                            onClick={startRecordingAndAnimation}
                            disabled={status.includes("Generating") || status.includes("Waiting")}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                        >
                            {status.includes("Generating") && <Loader2 className="w-5 h-5 animate-spin" />}
                            {status || "START GENERATING & RECORDING"}
                        </button>
                    </div>
                </div>
            )}

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
                                className="text-4xl font-black text-white uppercase tracking-tight mt-6 leading-tight"
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
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] text-center"
                        >
                            <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase blur-[0.5px]">
                                Try to <br /> Beat Me.
                            </h2>
                            <div className="flex flex-col gap-3 font-bold uppercase text-xl mt-6">
                                <span className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                                    Link in Comments
                                </span>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
