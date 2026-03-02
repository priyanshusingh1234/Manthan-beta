"use client";

import { motion } from "framer-motion";
import { Sword, Target, Sparkles, User, Trophy, Zap, ShieldAlert, Cpu } from "lucide-react";
import { DheeyudhaLogo } from "@/components/Logo";

export default function ThumbnailPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
            
            {/* INSTRUCTIONS FOR USER */}
            <div className="mb-8 text-center max-w-2xl bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md relative z-50">
                <h2 className="text-xl font-bold text-white mb-2">How to use this thumbnail:</h2>
                <p className="text-gray-400 text-sm">
                    1. Press <strong className="text-white">F11</strong> to go full screen.<br/>
                    2. Use your browser's zoom (Ctrl + / Ctrl -) to fit the bounding box exactly on your screen.<br/>
                    3. Take a screenshot (Windows Key + Shift + S).<br/>
                    4. Upload to YouTube!
                </p>
            </div>

            {/* EXACT 16:9 THUMBNAIL CANVAS (1280x720 reference size) */}
            <div className="relative w-[1280px] h-[720px] bg-[#0A0A0A] rounded-2xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden shrink-0 ring-4 ring-white/10">
                
                {/* 1. Dramatic Ambient Lighting */}
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-red-600/30 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-[-30%] right-[-10%] w-[1000px] h-[1000px] bg-indigo-600/30 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none" />

                {/* Grid Overlay for depth */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

                {/* 2. Main Title - HUGE and IMPACTFUL */}
                <div className="absolute top-12 left-0 w-full flex justify-center z-40">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-red-500/20 blur-2xl rounded-full" />
                        <h1 className="text-[110px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 tracking-tighter uppercase leading-none text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter">
                            WAR OF WITS
                        </h1>
                        <p className="text-3xl font-bold text-red-500 text-center uppercase tracking-[0.4em] drop-shadow-lg mt-2">
                            Is Live Now
                        </p>
                    </div>
                </div>

                {/* 3. Logo Placement */}
                <div className="absolute top-12 left-12 z-50">
                    <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                        <DheeyudhaLogo variant="icon" theme="dark" size={40} />
                        <span className="text-2xl font-black text-white tracking-tight">Dheeyudha</span>
                    </div>
                </div>

                {/* NEW BADGE */}
                <div className="absolute top-12 right-12 z-50">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-white/20 transform rotate-3">
                         <Sparkles className="w-6 h-6 text-white" />
                         <span className="text-2xl font-black text-white tracking-tight uppercase">Trailer</span>
                    </div>
                </div>

                {/* 4. Center Piece: The VS Matchup */}
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center items-center gap-24 z-30">
                    
                    {/* Player 1 (Blue/Indigo side) */}
                    <motion.div 
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-blue-500/30 blur-[80px] rounded-full scale-150" />
                        <div className="w-64 h-64 rounded-[3rem] bg-gradient-to-br from-blue-500 to-indigo-700 p-1 rotate-[-6deg] shadow-2xl relative z-10 transition-transform hover:scale-105">
                            <div className="w-full h-full bg-[#0A0A0A] rounded-[2.8rem] flex flex-col items-center justify-center p-6 border-4 border-black border-opacity-50">
                                <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 ring-4 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                    <User className="w-12 h-12 text-blue-300" />
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tight">You</h3>
                                <div className="mt-3 bg-blue-500/20 px-4 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-blue-400" />
                                    <span className="text-blue-200 font-bold text-sm">Rank #12</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Epic VS Badge */}
                    <div className="relative z-50 shrink-0">
                        <div className="absolute inset-0 bg-red-600/40 blur-[50px] scale-150 rounded-full" />
                        <div className="w-40 h-40 bg-[#050505] rounded-full border-[6px] border-[#111] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/10 opacity-50" />
                            <Sword className="absolute text-red-500/20 w-32 h-32 -rotate-12 scale-150" />
                            <span className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] relative z-10">
                                VS
                            </span>
                        </div>
                    </div>

                    {/* Player 2 (Red/Orange side) */}
                    <motion.div 
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-red-500/30 blur-[80px] rounded-full scale-150" />
                        <div className="w-64 h-64 rounded-[3rem] bg-gradient-to-br from-orange-500 to-red-700 p-1 rotate-[6deg] shadow-2xl relative z-10 transition-transform hover:scale-105">
                            <div className="w-full h-full bg-[#0A0A0A] rounded-[2.8rem] flex flex-col items-center justify-center p-6 border-4 border-black border-opacity-50">
                                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4 ring-4 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                                    <Cpu className="w-12 h-12 text-red-300" />
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tight">Rival</h3>
                                <div className="mt-3 bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/30 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-red-400" />
                                    <span className="text-red-200 font-bold text-sm">Matched</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* 5. Floating App UI Elements (To show it's a real app) */}
                
                {/* Floating Question Card (Bottom Left) */}
                <div className="absolute -bottom-12 -left-10 w-[450px] bg-[#111]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl rotate-[-12deg] z-40 transform hover:rotate-[-5deg] transition-transform duration-500">
                    <div className="flex gap-2 mb-3">
                         <span className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-full text-xs font-bold text-fuchsia-300 uppercase">Premium</span>
                         <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase">Physics</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2 leading-tight">
                        Calculate the magnetic field at the center of a coil.
                    </h4>
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Zap className="w-4 h-4 fill-indigo-400" />
                        <span className="font-bold">50 Points</span>
                    </div>
                </div>

                {/* Floating Ranking Card (Bottom Right) */}
                <div className="absolute -bottom-8 -right-8 w-[400px] bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl rotate-[8deg] z-40 transform hover:rotate-[0deg] transition-transform duration-500">
                     <div className="flex items-center gap-3 mb-4 opacity-90">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="text-white font-bold uppercase tracking-widest text-sm">Leaderboard Climbing</span>
                    </div>
                    <div className="text-[80px] font-black text-white tracking-tighter leading-none mb-2">#1</div>
                    <div className="text-emerald-400 font-bold text-lg bg-emerald-500/20 inline-block px-4 py-1 rounded-full border border-emerald-500/30">
                        ▲ Top 1% Global
                    </div>
                </div>

                {/* Foreground cinematic dust/particles */}
                <div className="absolute inset-0 z-50 pointer-events-none opacity-40 bg-[url('https://transparenttextures.com/patterns/stardust.png')]" />

            </div>
        </div>
    );
}
