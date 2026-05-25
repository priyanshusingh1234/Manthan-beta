"use client";

import React from 'react';
import { Sparkles, Trophy, Users, Brain, ShieldAlert, Swords } from 'lucide-react';

export default function PlayStoreAssets() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center py-20 gap-20 overflow-hidden font-sans">
            
            <div className="text-center space-y-4 max-w-2xl px-4">
                <h1 className="text-4xl font-black text-white">Play Store Assets Studio</h1>
                <p className="text-slate-400">
                    Use advanced CSS to generate high-quality vector-sharp posters. 
                    Zoom your browser to 100% and take a clean screenshot of the boxes below!
                </p>
            </div>

            {/* 1. Feature Graphic (1024 x 500) */}
            <div>
                <h2 className="text-xl font-bold text-slate-300 mb-4 ml-2">1. Feature Graphic (1024 x 500)</h2>
                {/* The exact dimensions scale for the feature graphic */}
                <div 
                    className="relative overflow-hidden shadow-2xl rounded-3xl border border-slate-800"
                    style={{ width: '1024px', height: '500px', backgroundColor: '#0f172a' }}
                >
                    {/* Abstract Background Elements */}
                    <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse"></div>
                    <div className="absolute bottom-[-100px] right-[-200px] w-[600px] h-[600px] bg-rose-600 rounded-full mix-blend-screen filter blur-[120px] opacity-60"></div>
                    <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] bg-purple-600 rounded-full mix-blend-screen filter blur-[90px] opacity-50"></div>

                    <div className="absolute inset-0 flex items-center justify-between px-20 z-10">
                        {/* Left Side: Typography & Brand */}
                        <div className="flex flex-col items-start w-[55%]">
                            <div className="flex items-center gap-3 mb-6 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20">
                                <Sparkles className="w-6 h-6 text-yellow-400" />
                                <span className="text-white font-bold tracking-widest uppercase text-sm">Next-Gen Learning</span>
                            </div>
                            
                            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400 leading-tight mb-6 tracking-tight">
                                Learn. Compete. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Conquer.</span>
                            </h1>
                            
                            <p className="text-2xl text-slate-300 font-medium leading-relaxed max-w-lg">
                                The ultimate community-driven academic arena. Challenge friends, win wars, and rise to the top of your school!
                            </p>
                        </div>

                        {/* Right Side: Advanced UI Mockup (Floating Glass Cards) */}
                        <div className="relative w-[45%] h-full flex items-center justify-center perspective-[1000px]">
                            {/* Main Floating Card */}
                            <div 
                                className="absolute bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform -rotate-y-12 rotate-x-12 translate-x-10 z-20 w-80"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <Swords className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Academic Duel</h3>
                                        <p className="text-indigo-200 text-sm">vs Rival School</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-gradient-to-r from-rose-400 to-purple-500"></div>
                                    </div>
                                    <div className="h-4 w-3/4 bg-white/10 rounded-full"></div>
                                    <div className="h-4 w-5/6 bg-white/10 rounded-full"></div>
                                </div>
                            </div>

                            {/* Secondary Background Card */}
                            <div 
                                className="absolute bg-indigo-600/30 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-6 shadow-2xl transform -rotate-y-12 rotate-x-12 -translate-x-20 -translate-y-20 z-10 w-72"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">Top 10 Player</h3>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-white/20 rounded-full"></div>
                                    <div className="h-3 w-2/3 bg-white/20 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Portrait Screenshot (1080 x 1920) - Scaled down for viewing */}
            <div className="w-full flex justify-center mb-32">
                <div className="max-w-4xl w-full">
                    <h2 className="text-xl font-bold text-slate-300 mb-4 ml-2">2. Portrait Screenshot (Scaled, Actual Ratio 1080x1920)</h2>
                    <div 
                        className="relative overflow-hidden shadow-2xl rounded-[3rem] border-8 border-slate-900 mx-auto"
                        style={{ width: '400px', height: '711px', backgroundColor: '#0f172a' }}
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-indigo-600/40 to-transparent"></div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center pt-16 px-8 h-full">
                            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6 flex items-center gap-2">
                                <Brain className="w-4 h-4" /> Challenge Your Limits
                            </div>
                            
                            <h2 className="text-4xl font-black text-white leading-tight mb-4">
                                Master Every <br/>Subject
                            </h2>
                            <p className="text-slate-300 text-lg mb-12">
                                Engage in high-stakes academic battles and prove your brilliance.
                            </p>

                            {/* Faux UI Element */}
                            <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 mt-auto mb-12">
                                <div className="flex justify-between items-center">
                                    <div className="flex -space-x-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-500"></div>
                                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-rose-500"></div>
                                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-500 flex items-center justify-center text-xs font-bold text-white">+5</div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">Class 9 War</p>
                                        <p className="text-indigo-300 text-xs font-medium">Starts in 5m</p>
                                    </div>
                                </div>
                                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-3 rounded-xl text-white font-bold shadow-lg">
                                    Join Battle Arena
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
