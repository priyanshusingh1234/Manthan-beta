'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { X, Egg, Zap } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';

export default function DailyEggDrop() {
    const [isEligible, setIsEligible] = useState(false);
    const [eggDropped, setEggDropped] = useState(false);
    const [eggClicked, setEggClicked] = useState(false);
    const [question, setQuestion] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<'won' | 'lost' | null>(null);

    useEffect(() => {
        // Check time and eligibility
        const checkEligibility = () => {
            const now = new Date();
            const hour = now.getHours();
            const dateStr = now.toISOString().split('T')[0];
            const claimedKey = `daily_egg_claimed_${dateStr}`;

            // Must be 6 PM (18:00) or later, and not already claimed today
            if (hour >= 18 && !localStorage.getItem(claimedKey)) {
                setIsEligible(true);
            }
        };

        checkEligibility();
        
        // If they stay on the app, check occasionally
        const interval = setInterval(checkEligibility, 60000);
        return () => clearInterval(interval);
    }, []);

    // Trigger the drop animation shortly after becoming eligible
    useEffect(() => {
        if (isEligible && !eggDropped) {
            const timer = setTimeout(() => {
                setEggDropped(true);
                try { Haptics.vibrate({ duration: 50 }).catch(() => {}); } catch(e){}
            }, 3000); // 3 seconds after page load
            return () => clearTimeout(timer);
        }
    }, [isEligible, eggDropped]);

    const handleEggClick = async () => {
        try { Haptics.vibrate({ duration: 20 }).catch(() => {}); } catch(e){}
        setEggClicked(true);
        
        // Fetch a random question
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .limit(50); // Get top 50
            
        if (data && data.length > 0) {
            const randomQ = data[Math.floor(Math.random() * data.length)];
            setQuestion(randomQ);
        } else {
            toast.error("The egg was empty!");
            markClaimed();
        }
    };

    const markClaimed = () => {
        const dateStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(`daily_egg_claimed_${dateStr}`, 'true');
        setIsEligible(false);
        setEggDropped(false);
        setEggClicked(false);
    };

    const submitAnswer = async (index: number) => {
        if (!question) return;
        setSelectedOption(index);
        
        const isCorrect = index === question.correct_option;
        setResult(isCorrect ? 'won' : 'lost');
        try { Haptics.vibrate({ duration: isCorrect ? 100 : 50 }).catch(() => {}); } catch(e){}

        // Update score
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const pointsChange = isCorrect ? 5 : -1;
            
            // Just update profile points (simplified, usually done via API)
            const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', user.id).single();
            if (profile) {
                await supabase.from('profiles')
                    .update({ total_points: Math.max(0, profile.total_points + pointsChange) })
                    .eq('id', user.id);
            }
        }

        setTimeout(() => {
            markClaimed();
            if (isCorrect) toast.success("You gained 5 points from the Daily Egg!");
            else toast.error("You lost 1 point from the Daily Egg.");
        }, 3000);
    };

    if (!isEligible) return null;

    return (
        <>
            {/* The Flying Man & Egg Drop Animation */}
            <AnimatePresence>
                {!eggClicked && eggDropped && (
                    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                        {/* Flying Man */}
                        <motion.div
                            initial={{ x: '-100%', y: 100 }}
                            animate={{ x: '120vw', y: 150 }}
                            transition={{ duration: 4, ease: "linear" }}
                            className="absolute text-5xl"
                        >
                            🦸‍♂️
                        </motion.div>

                        {/* Dropping Egg */}
                        <motion.div
                            initial={{ y: 150, x: '50vw', scale: 0 }}
                            animate={{ y: '80vh', x: '50vw', scale: 1 }}
                            transition={{ delay: 1.8, duration: 1, type: "spring", bounce: 0.6 }}
                            className="absolute pointer-events-auto cursor-pointer"
                            onClick={handleEggClick}
                            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="relative group">
                                <div className="text-6xl drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] filter">
                                    🥚
                                </div>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Tap to open!
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* The Question Modal */}
            <AnimatePresence>
                {eggClicked && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-yellow-400 dark:border-yellow-600 relative"
                        >
                            <button onClick={markClaimed} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-2xl flex items-center justify-center text-2xl">
                                    🥚
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-slate-100">Daily Egg Question</h3>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <span className="text-green-500">+5</span> if right • <span className="text-red-500">-1</span> if wrong
                                    </p>
                                </div>
                            </div>

                            {!question ? (
                                <div className="py-12 flex justify-center text-yellow-500">
                                    <Zap className="w-8 h-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                                        {question.title}
                                    </p>

                                    <div className="space-y-3">
                                        {question.options.map((opt: string, idx: number) => {
                                            const isSelected = selectedOption === idx;
                                            const isCorrect = idx === question.correct_option;
                                            const showStatus = result !== null;

                                            let btnClass = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
                                            
                                            if (showStatus) {
                                                if (isSelected && isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400";
                                                else if (isSelected && !isCorrect) btnClass = "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-400";
                                                else if (isCorrect) btnClass = "bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400";
                                                else btnClass = "opacity-50 border-slate-200 dark:border-slate-800";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={showStatus}
                                                    onClick={() => submitAnswer(idx)}
                                                    className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${btnClass}`}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {result && (
                                        <motion.div 
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className={`p-4 rounded-xl text-center font-bold ${result === 'won' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
                                        >
                                            {result === 'won' ? 'Correct! +5 Points added to your profile.' : 'Incorrect! -1 Point deducted.'}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
