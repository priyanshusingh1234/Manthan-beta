'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Skull, HelpCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function BossFight() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [phase, setPhase] = useState<'entrance' | 'fight' | 'victory' | 'defeat'>('entrance');
  
  // MCQ state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [purchasedHint, setPurchasedHint] = useState<string | false>(false);
  const [hintError, setHintError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchBoss();
    
    // Play Entrance Audio
    audioRef.current = new Audio('/sounds/spooky-wind.mp3');
    audioRef.current.loop = true;
    audioRef.current.play().catch(e => console.warn("Audio autoplay blocked by browser", e));

    // Transition to fight after 4 seconds
    const timer = setTimeout(() => {
      setPhase('fight');
    }, 4500);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchBoss = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`/api/boss/daily`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const purchaseHint = async () => {
    setHintError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`/api/boss/hint`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setHintError(data.error || "Failed to purchase hint");
        return;
      }
      
      const theHint = data.hint || question.hint || "No hint available.";
      setPurchasedHint(theHint);
      
    } catch (e) {
      setHintError("Network error buying hint.");
    }
  };

  const handleOptionSelect = async (opt: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedOption(opt);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const optionIndex = question.options.indexOf(opt);
      
      await fetch(`/api/solve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption: optionIndex,
          startedAt: Date.now(),
          timeTaken: 10,
          isBoss: true,
        }),
      });
      
    } catch (e) {
      console.error('Failed to submit boss score:', e);
    } finally {
      setIsSubmitting(false);
      if (opt === question.correct_option) {
        setPhase('victory');
        if (audioRef.current) audioRef.current.pause();
      } else {
        setPhase('defeat');
        if (audioRef.current) audioRef.current.pause();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-1 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Boss not found or already defeated.</div>
      </div>
    );
  }

  // ENTRANCE PHASE
  if (phase === 'entrance') {
    return (
      <div className="flex-1 min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Red pulsating background */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-rose-600"
        />
        
        <motion.div
          animate={{ 
            x: [0, -10, 10, -10, 10, 0], 
            y: [0, -5, 5, -5, 5, 0] 
          }}
          transition={{ repeat: Infinity, duration: 0.1 }}
          className="z-10 flex flex-col items-center"
        >
          <Skull size={120} className="text-rose-500 mb-6 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]" />
          <h1 className="text-6xl font-black text-rose-500 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]">
            A Demon Approaches
          </h1>
        </motion.div>
      </div>
    );
  }

  // VICTORY / DEFEAT PHASES
  if (phase === 'victory' || phase === 'defeat') {
    const isWin = phase === 'victory';
    return (
      <div className={`flex-1 min-h-screen flex items-center justify-center p-4 ${isWin ? 'bg-emerald-950' : 'bg-rose-950'}`}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black/40 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full text-center border border-white/10"
        >
          {isWin ? (
            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
          ) : (
            <Skull size={80} className="text-rose-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
          )}
          
          <h2 className={`text-4xl font-black mb-2 ${isWin ? 'text-yellow-400' : 'text-rose-500'}`}>
            {isWin ? 'BOSS DEFEATED' : 'YOU DIED'}
          </h2>
          
          <p className="text-slate-300 mb-8 font-medium">
            {isWin 
              ? 'Incredible! You earned +5 points and massive XP.'
              : 'The boss overpowered you. You lost -2 points.'}
          </p>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            Return to Lair
          </button>
        </motion.div>
      </div>
    );
  }

  // FIGHT PHASE
  return (
    <div className="flex-1 min-h-screen bg-slate-950 px-4 py-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto flex flex-col pt-8 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 border-b border-rose-900/50 pb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/50">
              <Skull className="text-rose-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-rose-500 tracking-wider">DEMON LORD</h2>
              <span className="text-xs text-rose-500/70 font-bold tracking-widest uppercase">Health: 1000 HP</span>
            </div>
          </div>
        </motion.div>

        {/* Question Text */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <h3 className="text-xl font-bold text-white leading-relaxed">
            {question.text}
          </h3>
          {question.image_url && (
            <img src={question.image_url} alt="Question" className="w-full h-48 object-cover rounded-xl mt-4" />
          )}
        </motion.div>

        {/* Hint Section */}
        {purchasedHint ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-indigo-950/40 rounded-2xl p-5 border border-indigo-500/30 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={16} className="text-indigo-400" />
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Secret Weakness</span>
            </div>
            <p className="text-indigo-200">{purchasedHint}</p>
          </motion.div>
        ) : (
          <div className="mb-6 flex flex-col items-center">
            <button
              onClick={purchaseHint}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors"
            >
              <HelpCircle size={18} className="text-indigo-400" />
              <span className="text-indigo-300 font-bold text-sm tracking-wide">Purchase Hint (-20 Pts)</span>
            </button>
            {hintError && <span className="text-rose-400 text-xs mt-2">{hintError}</span>}
          </div>
        )}

        {/* Options */}
        <div className="flex flex-col gap-3">
          {question.options.map((opt: string, idx: number) => {
            const isSelected = selectedOption === opt;
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleOptionSelect(opt)}
                disabled={isSubmitting}
                className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected 
                    ? 'bg-rose-600/20 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <span className="font-semibold text-lg">{opt}</span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                )}
              </motion.button>
            );
          })}
        </div>
        
        {isSubmitting && (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
