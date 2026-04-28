'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { X, Star, Heart, CheckCircle2, ChevronRight, Swords, ArrowLeft } from 'lucide-react';

// Using a publicly available educational/talking Lottie animation for the "Teacher" character
// We'll load it dynamically or use a fallback. We'll simulate with a fast network fetch or inline JSON if possible,
// but for simplicity, we'll fetch a public url.
const TEACHER_LOTTIE_URL = 'https://assets3.lottiefiles.com/packages/lf20_1hpexdke.json';

// ── LEVEL DATA (Candy Crush / Duolingo Style) ────────────────────────────────────────────────────────
const MAP_LEVELS = [
  {
    id: 1,
    title: 'The French Spark',
    icon: '🔥',
    color: '#ef4444', 
    story: "Imagine it's the late 1700s. You are a PEASANT. A king takes all your money. In 1789, the French people SNAPPED. The French Revolution happened — power shifted from the monarchy to the citizens. They used 'La Patrie' (Fatherland) and the Tricolour flag to unite.",
    questions: [
      { q: "In what year did the French Revolution begin?", opts: ["1776", "1789", "1804", "1815"], ans: 1, explain: "1789 — The French people overthrew the absolute monarchy." }
    ]
  },
  {
    id: 2,
    title: 'Enter Napoleon',
    icon: '👑',
    color: '#3b82f6',
    story: "By 1799, Napoleon takes over as Emperor. He was a dictator, but incredibly SMART. In 1804, he introduced the Napoleonic Code, abolishing the feudal system and freeing peasants! But he got greedy and was crushed at Waterloo in 1815.",
    questions: [
      { q: "The Napoleonic Code (1804) abolished which system?", opts: ["The Republic", "The Feudal System", "The Church", "The Monarchy"], ans: 1, explain: "It abolished the feudal system, freeing peasants." }
    ]
  },
  {
    id: 3,
    title: 'Vienna Strikes Back',
    icon: '📜',
    color: '#8b5cf6',
    story: "The conservatives (kings) held the Treaty of Vienna in 1815, hosted by Duke Metternich. Their goal? Undo EVERYTHING Napoleon did. They censored the press and restored old kings. But freedom went underground with rebel heroes like Giuseppe Mazzini.",
    questions: [
      { q: "Who hosted the Treaty of Vienna in 1815?", opts: ["Napoleon", "Duke Metternich", "Giuseppe Mazzini", "Friedrich Wilhelm IV"], ans: 1, explain: "Duke Metternich, Austrian Chancellor, hosted it." }
    ]
  },
  {
    id: 4,
    title: 'Culture as a Weapon',
    icon: '🎵',
    color: '#f59e0b',
    story: "You can't defeat an empire with swords alone. Romanticism used poetry and folk music to build identity. In Poland, Russia wiped Polish from schools. But the clergy used Polish anyway — speaking your language became hardcore rebellion!",
    questions: [
      { q: "Where did Mazzini secretly found 'Young Italy' after exile?", opts: ["Rome", "Vienna", "Marseilles", "Berne"], ans: 2, explain: "After exile in 1831, he founded Young Italy in Marseilles." }
    ]
  },
  {
    id: 5,
    title: 'Frankfurt Heartbreak',
    icon: '🏛️',
    color: '#ec4899',
    story: "1848: Liberal Revolution! Middle classes rose up. 831 reps marched to the Frankfurt Parliament, drafted a constitution, and offered the crown to the Prussian King. He laughed and rejected it. The military crushed them.",
    questions: [
      { q: "Frankfurt Parliament was convened on which date in 1848?", opts: ["January 18", "May 18", "July 4", "March 15"], ans: 1, explain: "May 18, 1848 inside the Church of St. Paul." }
    ]
  },
  {
    id: 6,
    title: 'BOSS: Blood & Iron',
    icon: '💀',
    color: '#0f766e',
    story: "Democracy failed. Now the big guns take over. Bismarck unites Germany with 'Blood and Iron'. Garibaldi's Red Shirts march through Italy. The modern map of Europe is drawn in war and blood.",
    questions: [
      { q: "What was Otto von Bismarck's famous strategy called?", opts: ["Liberty or Death", "Blood and Iron", "Bread and Roses", "Fire and Sword"], ans: 1, explain: "'Blood and Iron' — relying on the army, not speeches." },
      { q: "The THREE heroes of Italian unification were:", opts: ["Napoleon, Cavour, Mazzini", "Mazzini, Cavour, Garibaldi", "Garibaldi, Bismarck, Cavour", "Victor Emmanuel, Wellington, Mazzini"], ans: 1, explain: "Mazzini (Heart), Cavour (Brain), and Garibaldi (Sword)." }
    ]
  }
];

export default function CandyCrushGauntlet() {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [lottieData, setLottieData] = useState<any>(null);

  // Load Lottie
  useEffect(() => {
    fetch(TEACHER_LOTTIE_URL)
      .then(res => res.json())
      .then(data => setLottieData(data))
      .catch(() => console.error("Lottie failed to load"));
  }, []);

  const handleWin = (id: number) => {
    setActiveLevel(null);
    if (unlockedLevel <= id) {
      setUnlockedLevel(id + 1);
      // Fire confetti
      confetti({ particleCount: 150, zIndex: 10000, spread: 80, colors: ['#4f46e5', '#ec4899', '#f59e0b'] });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f0f9ff] text-slate-800 font-sans overflow-hidden flex flex-col items-center">
      
      {/* Top Bar */}
      <div className="w-full max-w-md bg-white shadow-sm px-4 py-3 sticky top-0 z-10 flex items-center justify-between border-b border-sky-100">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6 border-2 border-slate-300 rounded-full text-slate-400" />
        </button>
        <div className="flex-1 text-center font-black text-slate-700 tracking-tight text-lg">
          Chapter 1 path
        </div>
        <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-black text-amber-600">{(unlockedLevel - 1) * 25}</span>
        </div>
      </div>

      {/* The Map (Bottom to top scroll like Candy Crush) */}
      <div className="flex-1 w-full max-w-md relative overflow-y-auto pb-24 pt-10 flex flex-col-reverse items-center justify-start gap-12" style={{ backgroundImage: 'radial-gradient(#bae6fd 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
        
        {/* Draw curving path behind nodes */}
        <svg className="absolute inset-0 w-full h-[1000px] pointer-events-none" preserveAspectRatio="none" style={{ top: 'auto', bottom: 0 }}>
          <path d="M 200,900 C 100,800 300,700 200,600 C 100,500 300,400 200,300 C 100,200 300,100 200,50" fill="none" stroke="#bae6fd" strokeWidth="24" strokeLinecap="round" />
          <path d="M 200,900 C 100,800 300,700 200,600 C 100,500 300,400 200,300 C 100,200 300,100 200,50" fill="none" stroke="#e0f2fe" strokeWidth="16" strokeLinecap="round" />
        </svg>

        {MAP_LEVELS.map((level, index) => {
          const isUnlocked = unlockedLevel >= level.id;
          const isCurrent = unlockedLevel === level.id;
          const isCompleted = unlockedLevel > level.id;

          // Alternate left and right
          const xOffset = index % 2 === 0 ? '-30px' : '30px';

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              style={{ transform: `translateX(${xOffset})`, zIndex: 5 }}
              className="relative group"
            >
              {/* Tooltip for Title */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl shadow-md text-xs font-black text-slate-700 whitespace-nowrap opacity-90 border border-slate-100">
                {level.title}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-100"></div>
              </div>

              {/* Node Button */}
              <button
                onClick={() => { if (isUnlocked) setActiveLevel(level.id); }}
                disabled={!isUnlocked}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl transition-transform relative
                  ${isUnlocked ? 'active:scale-95 cursor-pointer' : 'grayscale opacity-50 cursor-not-allowed'}
                  ${isCurrent ? 'animate-bounce' : ''}
                `}
                style={{ 
                  background: isCompleted ? '#22c55e' : (isUnlocked ? level.color : '#cbd5e1'),
                  borderBottom: `6px solid ${isCompleted ? '#16a34a' : (isUnlocked ? level.color + 'aa' : '#94a3b8')}`,
                  borderTop: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                {isCompleted ? '⭐' : level.icon}
                
                {/* Checkmark for completed */}
                {isCompleted && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full text-green-500 shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Teaching / Battle Modal */}
      <AnimatePresence>
        {activeLevel && (
          <LevelModal
            level={MAP_LEVELS.find(l => l.id === activeLevel)!}
            lottieData={lottieData}
            onClose={() => setActiveLevel(null)}
            onWin={() => handleWin(activeLevel)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ── Level Modal Component ────────────────────────────────────────────────────────────
function LevelModal({ level, lottieData, onClose, onWin }: { level: typeof MAP_LEVELS[0]; lottieData: any; onClose: () => void; onWin: () => void; }) {
  const [phase, setPhase] = useState<'teach' | 'battle' | 'feedback'>('teach');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  
  const q = level.questions[qIndex];

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setPhase('feedback');
  };

  const handleNext = () => {
    if (phase === 'teach') {
      setPhase('battle');
    } else if (phase === 'feedback') {
      const isCorrect = selected === q.ans;
      if (isCorrect) {
        if (qIndex + 1 < level.questions.length) {
          setQIndex(i => i + 1);
          setSelected(null);
          setPhase('battle');
        } else {
          onWin(); // Level beat!
        }
      } else {
        setLives(l => l - 1);
        if (lives - 1 <= 0) {
          onClose(); // Failed
        } else {
          setSelected(null);
          setPhase('battle');
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shadow-sm">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50">
          <X className="w-6 h-6" />
        </button>
        <div className="font-black text-lg text-slate-700">{level.title}</div>
        <div className="flex items-center gap-1 text-red-500">
          <Heart className="w-5 h-5 fill-red-500" />
          <span className="font-black text-lg">{lives}</span>
        </div>
      </div>

      {phase === 'teach' && (
        <div className="flex-1 flex flex-col p-6 overflow-auto bg-slate-50">
          {/* Lottie Character Teaching */}
          <div className="w-48 h-48 mx-auto -mt-4 bg-transparent rounded-full flex items-center justify-center">
            {lottieData ? (
              <Lottie animationData={lottieData} loop={true} className="w-full h-full" />
            ) : (
              <div className="text-8xl">👩‍🏫</div>
            )}
          </div>

          {/* Speech Bubble */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-3xl rounded-tl-none border-2 border-slate-200 shadow-lg relative mt-2"
          >
            <div className="absolute -top-3 left-6 w-4 h-4 bg-white border-l-2 border-t-2 border-slate-200 rotate-45"></div>
            <p className="text-lg font-bold text-slate-700 leading-relaxed mb-0">
              {level.story}
            </p>
          </motion.div>
        </div>
      )}

      {phase === 'battle' && (
        <div className="flex-1 flex flex-col p-6 pt-10 bg-slate-50">
          <div className="mb-8">
            <span className="text-sm font-black text-sky-500 uppercase tracking-widest mb-2 block">Question {qIndex + 1} of {level.questions.length}</span>
            <h3 className="text-2xl font-black text-slate-800 leading-tight block">
              {q.q}
            </h3>
          </div>

          <div className="space-y-3 mt-auto">
            {q.opts.map((opt, i) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 bg-white font-bold text-lg text-slate-600 hover:border-sky-400 hover:bg-sky-50 transition-colors shadow-sm"
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div className={`flex-1 flex flex-col p-6 pt-10 ${selected === q.ans ? 'bg-green-50' : 'bg-red-50'}`}>
           <div className="mb-4">
            <h3 className={`text-3xl font-black ${selected === q.ans ? 'text-green-600' : 'text-red-600'}`}>
              {selected === q.ans ? 'Excellent!' : 'Not quite!'}
            </h3>
          </div>

          {/* Character reaction */}
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="text-7xl mb-6">
              {selected === q.ans ? '🥳' : '🧐'}
            </div>
            <div className={`p-5 rounded-2xl border-2 ${selected === q.ans ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
              <p className="font-bold text-lg">{q.explain}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Button */}
      <div className={`p-4 border-t-2 bg-white ${phase==='feedback' ? (selected===q.ans ? 'border-green-200' : 'border-red-200') : 'border-slate-100'}`}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleNext}
          disabled={phase === 'battle'}
          className={`
            w-full py-4 rounded-2xl font-black text-xl flex justify-center items-center gap-2 shadow-lg text-white
            ${phase === 'teach' || phase === 'battle' ? 'bg-sky-500 hover:bg-sky-400 border-b-4 border-sky-600' : ''}
            ${phase === 'feedback' && selected === q.ans ? 'bg-green-500 hover:bg-green-400 border-b-4 border-green-600' : ''}
            ${phase === 'feedback' && selected !== q.ans ? 'bg-red-500 hover:bg-red-400 border-b-4 border-red-600' : ''}
            ${phase === 'battle' ? 'opacity-50 grayscale cursor-not-allowed' : ''}
          `}
        >
          {phase === 'teach' ? 'Start Battle' : phase === 'battle' ? 'Choose an answer' : 'Continue'}
          {(phase === 'teach' || phase === 'feedback') && <ChevronRight className="w-6 h-6" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
