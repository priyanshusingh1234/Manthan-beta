import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Sword, Target, Sparkles, User, Trophy, RefreshCw, ArrowRight, Lock, Mail, BadgeCheck, Settings } from 'lucide-react-native';
import { DheeyudhaLogo } from "@/components/Logo";

export default function TrailerPage() {
    const cursorControls = useAnimation();
    const screenControls = useAnimation();

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
            transition: { duration, ease: [0.16, 1, 0.3, 1] }
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

            setScrollOffset(-200);
            await new Promise((r) => setTimeout(r, 2000));
            if (!active) return;

            // -- STEP 4: REPOST ACTION (16s - 20s) --
            setStep(4);
            setScrollOffset(-120);
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
        <View animate={screenControls} className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans flex-row">
            <style dangerouslySetInnerHTML={{ __html: `body { cursor: none !important; }` }} />

            <>
                {/* STEP 1: INTRO SEQUENCE */}
                {step === 1 && (
                    <View
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        <View initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1.5 }}>
                            <DheeyudhaLogo variant="full" theme="dark" size={30} />
                        </View>
                        <View initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2, duration: 1.5 }} className="mt-12 text-5xl md:text-7xl font-bold tracking-tighter">
                            <Text className="bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                                Redefining the <br /> Academic Arena.
                            </Text>
                        </View>
                        <View initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: 1, letterSpacing: "0.5em" }} transition={{ delay: 2.2, duration: 1.5 }} className="mt-8 text-lg font-bold text-red-500/90 uppercase">
                            Prepare for the War of Wits
                        </View>
                    </View>
                )}

                {/* STEP 2: SIGN IN */}
                {step === 2 && (
                    <View
                        key="signin"
                        initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -50, filter: "blur(10px)", transition: { duration: 0.6 } }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full flex items-center justify-center relative overflow-hidden flex-row"
                    >
                        <View className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full" />
                        <View className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 blur-[120px] rounded-full" />

                        <View className="bg-[#0A0A0A]/80 border border-white/10 backdrop-blur-3xl p-10 rounded-[2.5rem] w-full max-w-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.5)] z-10">
                            <View className="flex justify-center mb-8 flex-row">
                                <DheeyudhaLogo variant="icon" theme="dark" size={50} />
                            </View>
                            <Text className="text-3xl font-bold text-white text-center mb-2 tracking-tight">Welcome Back</Text>
                            <Text className="text-gray-400 text-center mb-8 text-sm font-medium">Enter the arena to continue your journey.</Text>

                            <View className="space-y-4">
                                <View ref={emailRef} className={`relative rounded-2xl transition-all duration-300 ${activeInput === 'email' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-white/10' : 'bg-white/5 border border-white/10'}`}>
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <View className="w-full py-4 pl-12 pr-4 text-white flex items-center h-[56px] flex-row">
                                        {typingEmail}
                                        {activeInput === "email" && <Text animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-5 bg-indigo-500 ml-0.5" />}
                                        {!typingEmail && activeInput !== "email" && <Text className="text-gray-600">Email Address</Text>}
                                    </View>
                                </View>
                                <View ref={passwordRef} className={`relative rounded-2xl transition-all duration-300 ${activeInput === 'password' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-white/10' : 'bg-white/5 border border-white/10'}`}>
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <View className="w-full py-4 pl-12 pr-4 text-white flex items-center h-[56px] flex-row">
                                        {typingPassword}
                                        {activeInput === "password" && <Text animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-5 bg-indigo-500 ml-0.5" />}
                                        {!typingPassword && activeInput !== "password" && <Text className="text-gray-600">Password</Text>}
                                    </View>
                                </View>
                                <View ref={loginBtnRef} className="w-full mt-4 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] flex-row">
                                    Enter Arena <ArrowRight className="w-5 h-5" />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* STEPS 3,4,5: DASHBOARD */}
                {(step >= 3 && step <= 5) && (
                    <View
                        key="dashboard"
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8 } }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-7xl h-[85vh] bg-[#050505] rounded-[2.5rem] border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col mx-4"
                    >
                        {/* Header */}
                        <View className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/60 backdrop-blur-xl z-20 shrink-0 flex-row">
                            <View className="flex items-center gap-4 flex-row">
                                <DheeyudhaLogo variant="icon" theme="dark" size={32} />
                                <Text className="text-white font-bold text-xl tracking-tight">Dheeyudha</Text>
                            </View>
                            <View className="hidden md:flex items-center gap-8 px-6 py-2.5 bg-white/5 rounded-full border border-white/10 shadow-inner flex-row">
                                <Text className="text-white font-semibold flex items-center gap-2 flex-row"><Trophy className="w-4 h-4 text-amber-400" /> Leaderboard</Text>
                                <Text className="text-gray-400 font-medium hover:text-white transition-colors">Subjects</Text>
                                <Text className="text-gray-400 font-medium hover:text-white transition-colors">Feed</Text>
                            </View>
                            <View className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.4)] flex-row">
                                <User className="w-5 h-5 text-white" />
                            </View>
                        </View>

                        {/* Scrolling Content */}
                        <View
                            className="flex-1 w-full relative z-10 flex flex-col"
                            animate={{ y: scrollOffset }}
                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <View className="px-12 py-20 flex flex-col lg:flex-row gap-16 items-start">

                                {/* Left Hero Column */}
                                <View className="w-full lg:w-5/12 pt-10">
                                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest mb-6 flex-row">
                                        <Sparkles className="w-4 h-4" /> The War of Wits is Live
                                    </View>
                                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-5xl md:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tighter">
                                        Earn glory. <br />
                                        <Text className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Master it all.</Text>
                                    </View>
                                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-gray-400 max-w-md text-xl mb-10 leading-relaxed font-medium">
                                        Drop into intense intellectual battles, solve premium teacher questions, and climb the ranks.
                                    </View>
                                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                                        <View ref={challengeBtnRef} className="group relative bg-white text-black px-10 py-5 rounded-2xl font-bold text-xl overflow-hidden flex items-center gap-4 transition-transform hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.15)] flex-row">
                                            <Sword className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300 text-indigo-600" />
                                            <Text>Challenge a Friend</Text>
                                            <View className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                                        </View>
                                    </View>
                                </View>

                                {/* Right Floating Bento Box Grid */}
                                <View className="w-full lg:w-7/12 relative">
                                    {/* Unified Ambient Glow */}
                                    <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-[100px] rounded-full -z-10 pointer-events-none" />

                                    <View className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Grid Column 1 */}
                                        <View className="flex flex-col gap-6">

                                            {/* Profile Card */}
                                            <View initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, type: "spring", stiffness: 100 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                                                <View className="flex justify-between items-start mb-6 flex-row">
                                                    <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-400 to-fuchsia-500 p-[2px] shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                                        <View className="w-full h-full bg-[#111] rounded-full flex items-center justify-center flex-row">
                                                            <User className="w-7 h-7 text-white" />
                                                        </View>
                                                    </View>
                                                    <View className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex-row">
                                                        <Settings className="w-5 h-5 text-gray-400" />
                                                    </View>
                                                </View>
                                                <Text className="text-2xl font-bold text-white tracking-tight mb-1">Priyanshu</Text>
                                                <Text className="text-gray-400 font-medium text-sm">Grandmaster Rank</Text>
                                            </View>

                                            {/* Teacher Question Card */}
                                            <View initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, type: "spring" }} className="bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                                                <View className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                                                <View className="flex gap-2 mb-4 relative z-10 flex-row">
                                                    <Text className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white tracking-wider uppercase">Physics</Text>
                                                    <Text className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-bold text-indigo-300 tracking-wider uppercase">Premium</Text>
                                                </View>

                                                <Text className="text-lg font-semibold text-white/90 leading-snug mb-8 relative z-10">
                                                    Calculate the magnetic field at the center of a circular coil with N turns and radius R.
                                                </Text>

                                                <View className="flex items-center justify-between relative z-10 border-t border-white/5 pt-5 flex-row">
                                                    <View className="bg-white text-black px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-gray-200 transition-colors text-sm">
                                                        Solve
                                                    </View>
                                                    <View id="repost-btn" ref={repostBtnRef} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2 px-3 rounded-xl border border-transparent text-sm font-semibold flex-row">
                                                        <RefreshCw className="w-4 h-4" /> Repost
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Grid Column 2 (Staggered Downward) */}
                                        <View className="flex flex-col gap-6 pt-12">

                                            {/* Leaderboard Chart Card */}
                                            <View initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, type: "spring" }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
                                                <View className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/10 blur-[50px] rounded-full pointer-events-none" />

                                                <View>
                                                    <View className="flex items-center gap-2 mb-4 opacity-70 flex-row">
                                                        <Trophy className="w-4 h-4 text-fuchsia-300" />
                                                        <Text className="text-white font-semibold uppercase tracking-widest text-xs">Leaderboard</Text>
                                                    </View>
                                                    <View className="flex items-end gap-3 mb-4 flex-row">
                                                        <View className="text-6xl font-bold text-white tracking-tighter leading-none">#12</View>
                                                    </View>
                                                    <View className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 inline-flex px-3 py-1 rounded-full mb-6 flex-row">
                                                        ▲ Up 4 places
                                                    </View>
                                                </View>

                                                {/* Chart Visual */}
                                                <View className="flex items-end h-28 w-full justify-between gap-1.5 overflow-hidden flex-row">
                                                    {[30, 45, 20, 60, 40, 80].map((height, i) => (
                                                        <View key={i} className="flex-1 bg-white/10 rounded-t-md relative group overflow-hidden flex-row">
                                                            <View initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: 1.5 + (i * 0.1), duration: 0.8, ease: "easeOut" }} className="absolute bottom-0 w-full rounded-t-md bg-white/30" />
                                                        </View>
                                                    ))}
                                                    <View className="flex-1 bg-white/10 rounded-t-md relative group shadow-[0_0_15px_rgba(192,38,211,0.3)] overflow-hidden flex-row">
                                                        <View initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ delay: 2.1, duration: 0.8, ease: "easeOut" }} className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-fuchsia-600 to-indigo-400" />
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <View className="h-[400px]" />
                        </View>

                        {/* FAKE MODAL OVERLAY */}
                        <>
                            {step === 5 && (
                                <View
                                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 flex-row"
                                >
                                    <View
                                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                                        animate={{ scale: 1, y: 0, opacity: 1 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-10 w-full max-w-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
                                    >
                                        <View className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                                        <Text className="text-3xl font-bold text-white mb-2 tracking-tight">Issue a Challenge</Text>
                                        <Text className="text-gray-400 mb-8 text-lg font-medium">Search for an opponent in the global arena.</Text>

                                        <View ref={searchRef} className={`relative mb-8 rounded-2xl transition-all duration-300 ${activeInput === 'search' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-white/10' : 'bg-white/5 border border-white/10'}`}>
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                                            <View className="w-full py-4 pl-14 pr-4 text-xl text-white flex items-center h-[60px] flex-row">
                                                {typingOpponent}
                                                {activeInput === "search" && <Text animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-6 bg-indigo-500 ml-1" />}
                                                {!typingOpponent && activeInput !== "search" && <Text className="text-gray-600">Opponent Username</Text>}
                                            </View>
                                        </View>
                                        <View ref={submitRef} className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] flex-row">
                                            Initiate Battle <Sword className="w-5 h-5 text-indigo-600" />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </>
                    </View>
                )}

                {/* STEP 6: EPIC MATCH FOUND */}
                {step === 6 && (
                    <View
                        key="epic-match"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 1 } }}
                        className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden z-[100] flex-row"
                    >
                        <View initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute inset-0 bg-white z-[101] pointer-events-none" />

                        <View initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 2, opacity: 0.4 }} transition={{ duration: 3, ease: "easeOut" }} className="absolute bg-orange-600/30 w-[800px] h-[800px] rounded-full blur-[120px]" />

                        <View className="relative z-10 flex flex-col items-center justify-center text-center">
                            <View initial={{ scale: 0, rotate: -180, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", damping: 15, delay: 0.1 }} className="w-40 h-40 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_120px_rgba(239,68,68,0.5)] mb-10 border border-white/20 flex-row">
                                <Sword className="w-20 h-20 text-white" />
                            </View>

                            <View className="flex flex-col items-center">
                                <View initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-orange-400 font-bold tracking-[0.5em] text-xl mb-4">
                                    GET READY
                                </View>
                                <View initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", delay: 0.3 }} className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter mix-blend-overlay drop-shadow-2xl">
                                    MATCH FOUND
                                </View>
                            </View>

                            <View initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="mt-16 flex items-center gap-12 text-4xl font-bold text-white bg-black/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl flex-row">
                                <View initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1, type: "spring" }} className="flex flex-col items-center gap-4 w-32">
                                    <View className="w-24 h-24 rounded-full border-[3px] border-indigo-500 bg-indigo-900/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] flex-row">
                                        <User className="w-10 h-10 text-indigo-300" />
                                    </View>
                                    <Text className="text-indigo-400 text-xl tracking-tight">You</Text>
                                </View>
                                <Text className="text-white/20 text-5xl font-black italic px-8">VS</Text>
                                <View initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.2, type: "spring" }} className="flex flex-col items-center gap-4 w-32">
                                    <View className="w-24 h-24 rounded-full border-[3px] border-red-500 bg-red-900/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] flex-row">
                                        <Text className="text-red-300 font-bold text-4xl">R</Text>
                                    </View>
                                    <Text className="text-red-400 text-xl tracking-tight">Rahul</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* STEP 7: OUTRO */}
                {step === 7 && (
                    <View
                        key="outro"
                        initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center text-center h-full w-full bg-black relative"
                    >
                        <View className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent" />
                        <View initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 2, ease: "easeOut" }} className="relative z-10">
                            <DheeyudhaLogo variant="full" theme="dark" size={80} />
                        </View>
                        <View initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: 1, letterSpacing: "0.5em" }} transition={{ delay: 1.5, duration: 2 }} className="text-white/60 text-lg font-bold tracking-[0.5em] uppercase mt-12 relative z-10">
                            The Arena Awaits.
                        </View>
                    </View>
                )}
            </>

            {/* APPLE-STYLE CURSOR */}
            {showCursor && (
                <View animate={cursorControls} className="fixed top-0 left-0 z-[999999] pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" style={{ transformOrigin: "top left" }}>
                    <View animate={{ scale: cursorClicked ? 0.8 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="relative">
                        <Check className="w-5 h-5 text-gray-500" />
                        <>
                            {cursorClicked && (
                                <View initial={{ scale: 0.2, opacity: 0.8 }} animate={{ scale: 3.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute top-1.5 left-2.5 w-5 h-5 rounded-full border-2 border-white/80 pointer-events-none" />
                            )}
                        </>
                    </View>
                </View>
            )}
        </View>
    );
}