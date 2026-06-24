"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Target, CheckCircle2, TreePine, Zap, Plane } from 'lucide-react';
import { IndiaMapData } from '@/components/IndiaMapData';

export default function MapAnimationPromo() {
  const [step, setStep] = useState(0);

  // Auto-play cinematic sequence
  useEffect(() => {
    const sequence = async () => {
      // Step 0: Hook
      await new Promise(r => setTimeout(r, 2500));
      setStep(1); // Intro 1
      await new Promise(r => setTimeout(r, 2000));
      setStep(2); // Q1: Narora (UP)
      await new Promise(r => setTimeout(r, 1500));
      setStep(3); // Cursor to UP
      await new Promise(r => setTimeout(r, 1000));
      setStep(4); // Click UP
      await new Promise(r => setTimeout(r, 1500));
      
      setStep(5); // Intro 2 (Forests)
      await new Promise(r => setTimeout(r, 2000));
      setStep(6); // Q2: Kaziranga (Assam)
      await new Promise(r => setTimeout(r, 1500));
      setStep(7); // Cursor to Assam
      await new Promise(r => setTimeout(r, 1000));
      setStep(8); // Click Assam
      await new Promise(r => setTimeout(r, 1500));
      
      setStep(9); // Intro 3 (Airports)
      await new Promise(r => setTimeout(r, 2000));
      setStep(10); // Q3: Chhatrapati (MH)
      await new Promise(r => setTimeout(r, 1500));
      setStep(11); // Cursor to MH
      await new Promise(r => setTimeout(r, 1000));
      setStep(12); // Click MH
      await new Promise(r => setTimeout(r, 2000));
      
      setStep(13); // Zoom out all
      await new Promise(r => setTimeout(r, 2000));
      
      setStep(14); // Outro
    };
    
    sequence();
  }, []);

  const getHighlightStatus = (id: string) => {
    if (id === 'IN-UP' && step >= 4) return true;
    if (id === 'IN-AS' && step >= 8) return true;
    if (id === 'IN-MH' && step >= 12) return true;
    return false;
  };

  const getQuestionConfig = () => {
    if (step >= 1 && step <= 4) return { title: "Power Plants", q: "Where is the Narora Nuclear Power Plant?", icon: <Zap className="text-yellow-400" /> };
    if (step >= 5 && step <= 8) return { title: "National Parks", q: "Where is Kaziranga National Park?", icon: <TreePine className="text-emerald-400" /> };
    if (step >= 9 && step <= 12) return { title: "Airports", q: "Where is Chhatrapati Shivaji Int. Airport?", icon: <Plane className="text-sky-400" /> };
    return null;
  };

  const qc = getQuestionConfig();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden relative font-sans">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-900/20 rounded-full blur-[150px] pointer-events-none" />

      {/* STEP 0: Cinematic Text Hook */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="hook"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="absolute z-50 text-center px-6"
          >
            <p className="text-2xl text-indigo-400 font-bold uppercase tracking-[0.2em] mb-6">Geography Map Work</p>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
              Can you score <span className="text-emerald-500">3/3</span>
              <br />on this quick test?
            </h1>
          </motion.div>
        )}
        
        {/* Intros between questions */}
        {(step === 1 || step === 5 || step === 9) && qc && (
          <motion.div
            key={`intro-${step}`}
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="absolute z-50 flex flex-col items-center text-center px-6"
          >
            {React.cloneElement(qc.icon as React.ReactElement, { size: 100, className: "mb-6 " + (qc.icon as any).props.className })}
            <h1 className="text-6xl md:text-8xl font-black text-white leading-tight">
              {qc.title}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Animations */}
      <AnimatePresence>
        {((step >= 2 && step <= 4) || (step >= 6 && step <= 8) || (step >= 10 && step <= 13)) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateX: 15 }}
            animate={{ opacity: 1, scale: step === 13 ? 0.9 : 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full max-w-5xl flex flex-col items-center relative z-10 perspective-[1000px]"
          >
            {/* Question Banner */}
            <AnimatePresence mode="wait">
              {qc && step !== 13 && (
                <motion.div 
                  key={qc.q}
                  initial={{ opacity: 0, y: -40, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="bg-slate-900/80 backdrop-blur-xl px-10 py-6 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-8 border border-slate-700/50 z-20 flex items-center gap-6"
                >
                  {React.cloneElement(qc.icon as React.ReactElement, { size: 48 })}
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">Question {step < 5 ? 1 : step < 9 ? 2 : 3} of 3</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white">
                      {qc.q}
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Map */}
            <div className="relative w-full aspect-square md:aspect-video flex items-center justify-center">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={IndiaMapData.viewBox}
                  className="w-full h-full max-h-[65vh] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                  {IndiaMapData.locations.map((location: any) => {
                      const isHighlighted = getHighlightStatus(location.id);
                      let fillColor = '#171717'; 
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
                  
                  {/* Labels */}
                  <AnimatePresence>
                    {step >= 4 && (
                      <motion.text x="330" y="230" initial={{ opacity: 0 }} animate={{ opacity: 1 }} fill="white" className="text-xl font-black drop-shadow-xl" style={{ pointerEvents: 'none' }}>
                        UP
                      </motion.text>
                    )}
                    {step >= 8 && (
                      <motion.text x="520" y="240" initial={{ opacity: 0 }} animate={{ opacity: 1 }} fill="white" className="text-xl font-black drop-shadow-xl" style={{ pointerEvents: 'none' }}>
                        ASSAM
                      </motion.text>
                    )}
                    {step >= 12 && (
                      <motion.text x="180" y="380" initial={{ opacity: 0 }} animate={{ opacity: 1 }} fill="white" className="text-xl font-black drop-shadow-xl" style={{ pointerEvents: 'none' }}>
                        MAHARASHTRA
                      </motion.text>
                    )}
                  </AnimatePresence>
              </svg>

              {/* Success Badge */}
              <AnimatePresence>
                {(step === 4 || step === 8 || step === 12) && (
                  <motion.div
                    key={`badge-${step}`}
                    initial={{ opacity: 0, scale: 0, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: -120 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 px-8 py-4 rounded-full flex items-center gap-3 shadow-[0_0_50px_rgba(16,185,129,0.5)] border-2 border-emerald-300 z-30"
                  >
                    <CheckCircle2 color="white" size={32} />
                    <span className="text-white font-black text-3xl tracking-wide">CORRECT</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cursor */}
              {(step === 3 || step === 4 || step === 7 || step === 8 || step === 11 || step === 12) && (
                <motion.div
                  initial={{ x: '30vw', y: '30vh', opacity: 0, scale: 1.5 }}
                  animate={{
                    x: step >= 11 ? '-10vw' : step >= 7 ? '18vw' : '-2vw',
                    y: step >= 11 ? '10vh' : step >= 7 ? '-8vh' : '-10vh',
                    opacity: 1,
                    scale: (step === 4 || step === 8 || step === 12) ? 0.8 : 1
                  }}
                  transition={{ duration: 1.2, ease: "anticipate" }}
                  className="absolute z-50 pointer-events-none flex flex-col items-center"
                >
                  <Target size={64} color="rgba(255,255,255,0.8)" strokeWidth={1} className="absolute -top-6 -left-6 animate-spin-slow" />
                  <MousePointer2 size={56} color="white" fill="#0ea5e9" className="drop-shadow-2xl" />
                  
                  {/* Click Ripple */}
                  {(step === 4 || step === 8 || step === 12) && (
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

      {/* STEP 14: Epic Outro */}
      <AnimatePresence>
        {step >= 14 && (
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
