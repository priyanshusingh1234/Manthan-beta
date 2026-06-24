"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Target, CheckCircle2 } from 'lucide-react';
import { IndiaMapData } from '@/components/IndiaMapData';

export default function MapAnimationPromo() {
  const [step, setStep] = useState(0);

  // Auto-play cinematic sequence
  useEffect(() => {
    const sequence = async () => {
      // Step 0: Initial hook
      await new Promise(r => setTimeout(r, 2500));
      setStep(1); // Introduce Topic
      
      await new Promise(r => setTimeout(r, 2500));
      setStep(2); // Map reveals
      
      await new Promise(r => setTimeout(r, 2000));
      setStep(3); // Question appears
      
      await new Promise(r => setTimeout(r, 1500));
      setStep(4); // Cursor moves
      
      await new Promise(r => setTimeout(r, 1500));
      setStep(5); // Cursor clicks, state highlights
      
      await new Promise(r => setTimeout(r, 1000));
      setStep(6); // Success badge
      
      await new Promise(r => setTimeout(r, 2500));
      setStep(7); // Outro
    };
    
    sequence();
  }, []);

  const TARGET_STATE_ID = 'IN-UP';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden relative font-sans">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* STEP 0 & 1: Cinematic Text Intros */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="hook"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="absolute z-50 text-center px-6"
          >
            <p className="text-xl text-indigo-400 font-bold uppercase tracking-[0.2em] mb-4">Geography Class 10</p>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
              Most students <span className="text-red-500">lose marks</span>
              <br />on this exact question.
            </h1>
          </motion.div>
        )}
        
        {step === 1 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="absolute z-50 text-center px-6"
          >
            <h1 className="text-6xl md:text-8xl font-black text-white leading-tight">
              Map Work: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Power Plants</span>
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 2+: Map Animation */}
      <AnimatePresence>
        {step >= 2 && step < 7 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full max-w-5xl flex flex-col items-center relative z-10 perspective-[1000px]"
          >
            {/* The Question Banner */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: -40, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="bg-slate-900/80 backdrop-blur-xl px-10 py-6 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-8 border border-slate-700/50 z-20"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">Live Question</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white">
                    Where is the <span className="text-yellow-400">Narora Nuclear Power Plant</span>?
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Interactive Map */}
            <div className="relative w-full aspect-square md:aspect-video flex items-center justify-center">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={IndiaMapData.viewBox}
                  className="w-full h-full max-h-[65vh] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                  {IndiaMapData.locations.map((location: any) => {
                      const isTarget = location.id === TARGET_STATE_ID;
                      const isHighlighted = isTarget && step >= 5;
                      
                      let fillColor = '#171717'; // Neutral dark
                      let strokeColor = '#334155';
                      
                      if (isHighlighted) {
                          fillColor = '#10b981'; // Emerald
                          strokeColor = '#ffffff';
                      }

                      return (
                          <motion.path
                              key={location.id}
                              d={location.path}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isHighlighted ? 3 : 1}
                              initial={false}
                              animate={{ fill: fillColor, strokeWidth: isHighlighted ? 3 : 1 }}
                              transition={{ duration: 0.4 }}
                          />
                      );
                  })}
                  
                  {/* Floating State Label for UP after highlight */}
                  <AnimatePresence>
                    {step >= 5 && (
                      <motion.text
                        x="330" // Approx X coord for UP in this viewBox
                        y="230" // Approx Y coord for UP
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        fill="white"
                        className="text-2xl font-black drop-shadow-lg"
                        style={{ pointerEvents: 'none' }}
                      >
                        UTTAR PRADESH
                      </motion.text>
                    )}
                  </AnimatePresence>
              </svg>

              {/* Success Badge */}
              <AnimatePresence>
                {step >= 6 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: -120 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 px-8 py-4 rounded-full flex items-center gap-3 shadow-[0_0_50px_rgba(16,185,129,0.5)] border-2 border-emerald-300 z-30"
                  >
                    <CheckCircle2 color="white" size={32} />
                    <span className="text-white font-black text-3xl tracking-wide">CORRECT</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Cinematic Cursor */}
              {step >= 4 && (
                <motion.div
                  initial={{ x: '30vw', y: '30vh', opacity: 0, scale: 1.5 }}
                  animate={
                    step === 4 ? { x: '-2vw', y: '-10vh', opacity: 1, scale: 1 } : 
                    step >= 5 ? { scale: 0.8, x: '-2vw', y: '-10vh', opacity: 1 } : {}
                  }
                  transition={{ 
                    duration: step === 4 ? 1.5 : 0.1, 
                    ease: "anticipate" 
                  }}
                  className="absolute z-50 pointer-events-none flex flex-col items-center"
                >
                  <Target size={64} color="rgba(255,255,255,0.8)" strokeWidth={1} className="absolute -top-6 -left-6 animate-spin-slow" />
                  <MousePointer2 size={56} color="white" fill="#0ea5e9" className="drop-shadow-2xl" />
                  
                  {/* Click Ripple Effect */}
                  {step === 5 && (
                    <motion.div 
                      initial={{ opacity: 1, scale: 0 }}
                      animate={{ opacity: 0, scale: 6 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-cyan-400 bg-cyan-400/20"
                    />
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 7: Epic Outro */}
      <AnimatePresence>
        {step >= 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="absolute z-50 text-center px-6 flex flex-col items-center w-full max-w-4xl"
          >
            <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-[0_0_100px_rgba(79,70,229,0.3)] border border-slate-700/50">
              <p className="text-cyan-400 font-bold uppercase tracking-[0.3em] mb-6">Stop memorizing. Start playing.</p>
              <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-tight">
                Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Dheeyudhha</span>
              </h1>
              <p className="text-2xl text-slate-300 font-medium">
                The gamified learning app for Class 10.
              </p>
              
              <div className="mt-12 inline-flex items-center gap-4 bg-indigo-600 px-8 py-4 rounded-full">
                <span className="text-white font-black text-xl">🔗 Link in Pinned Comment</span>
              </div>
            </div>
            
            <button 
              onClick={() => setStep(0)} 
              className="mt-12 text-slate-600 hover:text-white transition-colors font-bold uppercase tracking-wider text-sm"
            >
              Replay Sequence
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
