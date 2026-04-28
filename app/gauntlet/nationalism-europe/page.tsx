'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, ChevronRight, RotateCcw, Trophy, Swords, Star, ArrowLeft } from 'lucide-react';
import { Q_SOLDIER, Q_GENERAL, Q_BOSS, PANELS_ACT1, PANELS_ACT2, PANELS_ACT3 } from './data';
import type { Q, Panel } from './data';

// SSR-safe dynamic import for Three.js characters --------------------
const BattleScene = dynamic(
  () => import('./characters').then(m => ({ default: m.BattleScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-5xl animate-bounce">⚔️</div>
      </div>
    ),
  }
);

// Types ---------------------------------------------------------------
type Stage = 'intro' | 'act1' | 'battle1' | 'act2' | 'battle2' | 'act3' | 'boss' | 'victory';
type CharState = 'idle' | 'attacking' | 'hit' | 'dead';
type EnemyType = 'soldier' | 'general' | 'boss';

// ── Rough.js scene sketch (chalk-on-blackboard style) ───────────────
function SceneSketch({ panelIndex, color }: { panelIndex: number; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 280, 200);

    // Dynamically import roughjs to avoid SSR issues
    import('roughjs').then(({ default: rough }) => {
      const rc = rough.canvas(canvas);
      const opts = { stroke: color, strokeWidth: 1.8, roughness: 2.4, fill: color + '22', fillStyle: 'hatch' as const };

      const scenes: Record<number, () => void> = {
        0: () => {
          // Bastille towers + crowd
          rc.rectangle(30, 60, 80, 120, opts);
          rc.rectangle(170, 60, 80, 120, opts);
          rc.rectangle(80, 30, 120, 50, opts);
          // Flag on top
          rc.line(140, 30, 140, 5, { stroke: color, strokeWidth: 2 });
          rc.rectangle(140, 5, 30, 18, { ...opts, fill: color + '88' });
          // Crowd silhouettes at bottom
          for (let x = 15; x < 260; x += 22) {
            rc.circle(x, 190, 13, { stroke: color, roughness: 3, strokeWidth: 1.5 });
            rc.line(x, 197, x, 200, { stroke: color });
          }
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 11px serif';
          ctx.fillText('LIBERTÉ! 1789', 85, 215);
        },
        1: () => {
          // Napoleon silhouette on horse
          // Horse body
          rc.ellipse(140, 130, 120, 55, opts);
          // Horse legs
          rc.line(100, 155, 95, 195, { stroke: color, strokeWidth: 2 });
          rc.line(120, 158, 115, 195, { stroke: color, strokeWidth: 2 });
          rc.line(155, 158, 155, 195, { stroke: color, strokeWidth: 2 });
          rc.line(175, 155, 178, 195, { stroke: color, strokeWidth: 2 });
          // Horse head
          rc.ellipse(195, 110, 40, 25, opts);
          // Rider (Napoleon)
          rc.ellipse(145, 85, 30, 50, opts);
          rc.circle(145, 55, 20, opts);
          // Bicorne hat
          rc.polygon([[130,48],[160,48],[145,32]], { ...opts, fill: color + '66' });
          // Crown
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('EMPEROR 1804', 65, 220);
        },
        2: () => {
          // Map of Europe silhouette
          rc.curve([[40,80],[70,50],[110,45],[140,60],[160,50],[190,55],[220,65],[240,90],[230,130],[200,150],[160,160],[120,155],[80,140],[50,120],[40,80]], opts);
          // Divide with chaotic borders
          rc.line(80, 70, 80, 150, { stroke: color, strokeWidth: 1.2, roughness: 4 });
          rc.line(120, 55, 120, 155, { stroke: color, strokeWidth: 1.2, roughness: 4 });
          rc.line(160, 55, 160, 158, { stroke: color, strokeWidth: 1.2, roughness: 4 });
          rc.line(60, 100, 230, 110, { stroke: color, strokeWidth: 1.2, roughness: 4 });
          // Kingdom labels
          ctx.fillStyle = color + 'aa';
          ctx.font = '9px serif';
          ['AUSTRIA', 'PRUSSIA', 'FRANCE', 'SPAIN'].forEach((t, i) =>
            ctx.fillText(t, 60 + i * 48, 130)
          );
          ctx.font = 'bold 10px serif';
          ctx.fillStyle = color + 'cc';
          ctx.fillText('No Germany. No Italy. Just chaos.', 25, 220);
        },
        3: () => {
          // Treaty table — top-down view
          rc.rectangle(60, 60, 160, 110, { ...opts, roughness: 3 });
          // Chairs around table
          for (let x = 60; x <= 220; x += 40) {
            rc.rectangle(x, 45, 20, 20, opts);
            rc.rectangle(x, 170, 20, 20, opts);
          }
          // Document on table
          rc.rectangle(100, 85, 80, 60, { stroke: color, strokeWidth: 1.5, roughness: 1.5, fill: color + '33', fillStyle: 'solid' as const });
          rc.line(110, 100, 170, 100, { stroke: color, strokeWidth: 1 });
          rc.line(110, 110, 170, 110, { stroke: color, strokeWidth: 1 });
          rc.line(110, 120, 155, 120, { stroke: color, strokeWidth: 1 });
          // Seal
          rc.circle(165, 130, 12, { ...opts, fill: color + '66' });
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('TREATY OF VIENNA 1815', 45, 218);
        },
        4: () => {
          // Shadowy figure with lantern (Mazzini underground)
          // Dark room / arched tunnel
          rc.arc(140, 200, 180, 220, Math.PI, 0, true, opts);
          // Figure silhouette
          rc.ellipse(140, 120, 35, 55, opts);
          rc.circle(140, 85, 18, opts);
          // Lantern
          rc.rectangle(160, 105, 20, 28, { ...opts, fill: color + '66' });
          rc.line(170, 105, 170, 95, { stroke: color, strokeWidth: 1.5 });
          // Rays from lantern
          for (let a = -60; a <= 60; a += 20) {
            const rad = (a * Math.PI) / 180;
            rc.line(170, 119, 170 + Math.sin(rad) * 40, 119 + Math.cos(rad) * 40, { stroke: color + '66', strokeWidth: 1, roughness: 1 });
          }
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('"The Most Dangerous Man" — Metternich', 10, 220);
        },
        5: () => {
          // Musical staff + folk dancers
          for (let y = 50; y <= 110; y += 15) {
            rc.line(30, y, 250, y, { stroke: color, strokeWidth: 1, roughness: 1.5 });
          }
          // Notes on staff
          const notePositions = [[60, 55], [90, 65], [120, 50], [160, 70], [190, 58], [220, 62]];
          notePositions.forEach(([x, y]) => {
            rc.circle(x, y, 9, { ...opts, fill: color + '88' });
            rc.line(x + 4, y, x + 4, y - 25, { stroke: color, strokeWidth: 1.5 });
          });
          // Dancing figures at bottom
          for (let x = 60; x <= 220; x += 55) {
            rc.circle(x, 155, 12, opts);
            rc.line(x, 167, x, 190, { stroke: color });
            rc.line(x, 175, x - 15, 165, { stroke: color });
            rc.line(x, 175, x + 15, 165, { stroke: color });
            rc.line(x, 190, x - 10, 205, { stroke: color });
            rc.line(x, 190, x + 10, 205, { stroke: color });
          }
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('Speak your language = ACT OF REBELLION', 15, 222);
        },
        6: () => {
          // Factory with smokestack (industrial revolution)
          rc.rectangle(60, 90, 140, 110, opts);
          rc.rectangle(90, 60, 30, 100, opts);
          rc.rectangle(160, 50, 25, 110, opts);
          // Smoke
          for (let i = 0; i < 4; i++) {
            rc.circle(100 + i * 4, 40 - i * 12, 10 + i * 3, { stroke: color + '88', roughness: 3, strokeWidth: 1 });
          }
          for (let i = 0; i < 4; i++) {
            rc.circle(170 + i * 4, 30 - i * 12, 9 + i * 3, { stroke: color + '88', roughness: 3, strokeWidth: 1 });
          }
          // Weaver figures carrying cloth
          rc.circle(30, 155, 12, opts);
          rc.line(30, 167, 30, 195, { stroke: color });
          rc.line(30, 175, 10, 165, { stroke: color });
          rc.line(30, 175, 50, 165, { stroke: color });
          // Fist raised
          rc.rectangle(220, 130, 22, 22, { ...opts, fill: color + '66' });
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('WEAVERS REVOLT! June 4, 1845', 30, 222);
        },
        7: () => {
          // Church of St Paul / parliament building
          // Pillars
          for (let x = 50; x <= 220; x += 35) {
            rc.rectangle(x, 60, 20, 130, opts);
          }
          // Roof triangle
          rc.polygon([[30, 60], [250, 60], [140, 20]], { ...opts, fill: color + '33' });
          // Steps
          for (let i = 0; i < 4; i++) {
            rc.line(30 - i * 6, 190 + i * 5, 250 + i * 6, 190 + i * 5, { stroke: color, strokeWidth: 1.5, roughness: 1 });
          }
          // 831 marching figures (simplified)
          for (let x = 45; x <= 220; x += 18) {
            rc.circle(x, 155, 8, { stroke: color + 'aa', roughness: 3, strokeWidth: 1 });
            rc.line(x, 163, x, 182, { stroke: color + '88' });
          }
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('FRANKFURT PARLIAMENT — MAY 18, 1848', 12, 222);
        },
        8: () => {
          // Crossed swords + cannon (Bismarck / war theme)
          // Swords
          rc.line(60, 40, 220, 180, { stroke: color, strokeWidth: 3, roughness: 1.5 });
          rc.line(220, 40, 60, 180, { stroke: color, strokeWidth: 3, roughness: 1.5 });
          rc.circle(60, 40, 12, { ...opts, fill: color + '66' });
          rc.circle(220, 40, 12, { ...opts, fill: color + '66' });
          // Cannon
          rc.rectangle(90, 150, 100, 35, opts);
          rc.circle(195, 167, 18, opts);
          // Cannon ball trajectory
          rc.curve([[195, 155], [220, 100], [240, 50]], { stroke: color + '88', strokeWidth: 1.5 });
          rc.circle(240, 50, 10, { ...opts, fill: color + '88' });
          // Crown of unified Germany
          rc.polygon([[110, 100], [170, 100], [165, 80], [150, 90], [140, 75], [130, 90], [115, 80]], { ...opts, fill: color + '55' });
          ctx.fillStyle = color + 'cc';
          ctx.font = 'bold 10px serif';
          ctx.fillText('BLOOD & IRON — Jan 18, 1871', 40, 222);
        },
      };

      (scenes[panelIndex] || (() => {}))();
    });
  }, [panelIndex, color]);

  return (
    <canvas
      ref={ref}
      width={280}
      height={220}
      className="w-full max-w-[280px] mx-auto opacity-80"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}

// ── HP Bar -------------------------------------------------------------------
function HPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, current / max) * 100;
  return (
    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 100 }}
      />
    </div>
  );
}

// ── Battle view ──────────────────────────────────────────────────────────────
function BattleView({
  questions, enemyType, enemyName, enemyHPMax, xpReward, onWin, onLose
}: {
  questions: Q[];
  enemyType: EnemyType;
  enemyName: string;
  enemyHPMax: number;
  xpReward: number;
  onWin: () => void;
  onLose: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [playerHP, setPlayerHP] = useState(3);
  const [enemyHP, setEnemyHP] = useState(enemyHPMax);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'question' | 'feedback' | 'animating'>('question');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [playerState, setPlayerState] = useState<CharState>('idle');
  const [enemyState, setEnemyState] = useState<CharState>('idle');
  const [log, setLog] = useState('');
  const [combo, setCombo] = useState(0);

  const q = questions[qIndex];

  const handleAnswer = useCallback((idx: number) => {
    if (phase !== 'question') return;
    setSelected(idx);
    setPhase('feedback');
    const correct = idx === q.ans;
    setLastCorrect(correct);

    setTimeout(() => {
      setPhase('animating');
      if (correct) {
        setPlayerState('attacking');
        setCombo(c => c + 1);
        setLog(`✅ Correct! ${combo >= 1 ? '🔥 COMBO x' + (combo + 1) : ''}`);
        setTimeout(() => {
          setEnemyState('hit');
          setEnemyHP(h => h - 1);
          setTimeout(() => {
            setPlayerState('idle');
            setEnemyState('idle');
            if (enemyHP - 1 <= 0) {
              setEnemyState('dead');
              setTimeout(onWin, 800);
            } else if (qIndex + 1 < questions.length) {
              setQIndex(i => i + 1);
              setSelected(null);
              setPhase('question');
            } else {
              // All questions done, enemy still alive — still win (player answered all)
              setEnemyState('dead');
              setTimeout(onWin, 800);
            }
          }, 500);
        }, 350);
      } else {
        setEnemyState('attacking');
        setCombo(0);
        setLog(`❌ Wrong! ${q.explain}`);
        setTimeout(() => {
          setPlayerState('hit');
          setPlayerHP(h => h - 1);
          setTimeout(() => {
            setEnemyState('idle');
            setPlayerState('idle');
            if (playerHP - 1 <= 0) {
              setPlayerState('dead');
              setTimeout(onLose, 800);
            } else if (qIndex + 1 < questions.length) {
              setQIndex(i => i + 1);
              setSelected(null);
              setPhase('question');
            } else {
              // All questions done (player survived) → win
              setEnemyState('dead');
              setTimeout(onWin, 800);
            }
          }, 500);
        }, 350);
      }
    }, 1400);
  }, [phase, q, combo, enemyHP, playerHP, qIndex, questions.length, onWin, onLose]);

  const isBoss = enemyType === 'boss';

  return (
    <div className="flex flex-col h-full gap-3">
      {/* HP displays */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-slate-300">🧑 You</span>
            <span className="text-xs font-bold text-slate-400">{playerHP}/3</span>
          </div>
          <HPBar current={playerHP} max={3} color="#22c55e" />
          <div className="flex gap-1 mt-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className={`text-lg ${i < playerHP ? 'opacity-100' : 'opacity-20'}`}>❤️</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black" style={{ color: isBoss ? '#ff6600' : '#e11d48' }}>
              {isBoss ? '💀' : '⚔️'} {enemyName}
            </span>
            <span className="text-xs font-bold text-slate-400">{enemyHP}/{enemyHPMax}</span>
          </div>
          <HPBar current={enemyHP} max={enemyHPMax} color={isBoss ? '#ff6600' : '#e11d48'} />
        </div>
      </div>

      {/* 3D Battle Arena */}
      <div
        className="relative rounded-2xl overflow-hidden border"
        style={{
          height: 240,
          borderColor: isBoss ? '#ff660044' : '#e11d4833',
          background: isBoss ? 'radial-gradient(ellipse at center, #1a0000 0%, #0a0a0a 100%)' : 'radial-gradient(ellipse at center, #0a0f2e 0%, #0a0a1a 100%)',
        }}
      >
        <BattleScene enemyType={enemyType} enemyState={enemyState} playerState={playerState} />
        {/* Enemy name plate */}
        <div className="absolute top-2 right-3 text-xs font-black px-2 py-0.5 rounded-full"
          style={{ background: isBoss ? '#ff660033' : '#e11d4833', color: isBoss ? '#ff6600' : '#f87171', border: `1px solid ${isBoss ? '#ff660055' : '#e11d4855'}` }}>
          {enemyName}
        </div>
        {/* Combo badge */}
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              key={combo}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute top-2 left-3 bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full"
            >
              🔥 COMBO ×{combo}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Log */}
      <AnimatePresence mode="wait">
        {log && (
          <motion.div
            key={log}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`text-xs font-bold rounded-xl px-3 py-2 ${lastCorrect ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'}`}
          >
            {log}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={qIndex} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500">Q{qIndex + 1}/{questions.length}</span>
            <span className="text-xs font-black" style={{ color: isBoss ? '#ff6600' : '#818cf8' }}>+{xpReward} XP on win</span>
          </div>
          <p className="text-sm font-bold text-white leading-snug">{q.q}</p>
          <div className="grid grid-cols-1 gap-2">
            {q.opts.map((opt, i) => {
              const isSelected = selected === i;
              const showResult = phase === 'feedback' || phase === 'animating';
              const isCorrect = i === q.ans;
              let bg = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-indigo-500 hover:bg-slate-700';
              if (showResult && isSelected && isCorrect) bg = 'bg-green-900 border-green-500 text-green-200';
              else if (showResult && isSelected && !isCorrect) bg = 'bg-red-900 border-red-500 text-red-200';
              else if (showResult && isCorrect) bg = 'bg-green-900/50 border-green-700 text-green-300';
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={phase !== 'question'}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${bg}`}
                >
                  <span className="text-slate-500 mr-2">{['A', 'B', 'C', 'D'][i]}.</span>{opt}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Story view (Rough.js panels) ─────────────────────────────────────────────
function StoryView({ panels, onComplete, actTitle, actNumber }: { panels: Panel[]; onComplete: () => void; actTitle: string; actNumber: number }) {
  const [idx, setIdx] = useState(0);
  const p = panels[idx];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col h-full rounded-3xl overflow-hidden"
        style={{ background: p.bg }}
      >
        {/* Act header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Act {actNumber}</span>
            <p className="text-sm font-black text-slate-300">{actTitle}</p>
          </div>
          <div className="flex gap-1.5">
            {panels.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i === idx ? p.color : '#334155' }} />
            ))}
          </div>
        </div>

        {/* Scene badge */}
        <div className="px-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full" style={{ background: p.color + '22', color: p.color, border: `1px solid ${p.color}44` }}>
            {p.icon} {p.scene}
          </span>
        </div>

        {/* Rough.js illustration */}
        <div className="px-5 py-3 flex justify-center">
          <SceneSketch panelIndex={(actNumber - 1) * 3 + idx} color={p.color} />
        </div>

        {/* Title + text */}
        <div className="px-5 pb-3 flex-1 overflow-auto">
          <h2 className="text-lg font-black text-white mb-2">{p.title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">"{p.text}"</p>

          {p.bullets && (
            <div className="space-y-1.5">
              {p.bullets.map((b, bi) => (
                <motion.div
                  key={bi}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: bi * 0.1 }}
                  className="flex items-start gap-2 text-xs font-semibold"
                  style={{ color: p.color }}
                >
                  <span className="shrink-0 mt-0.5">{b.slice(0, 2)}</span>
                  <span className="text-slate-300">{b.slice(2)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Next button */}
        <div className="px-5 pb-6">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { if (idx + 1 < panels.length) setIdx(i => i + 1); else onComplete(); }}
            className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-black"
            style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}
          >
            {idx + 1 < panels.length ? <><ChevronRight className="w-4 h-4" /> Next Scene</> : <><Swords className="w-4 h-4" /> Enter Battle!</>}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Victory screen ───────────────────────────────────────────────────────────
function VictoryScreen({ score, total }: { score: number; total: number }) {
  useEffect(() => {
    const shoot = () => {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'] });
    };
    shoot();
    const t = setTimeout(shoot, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 gap-6"
      style={{ background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0a0a1a 100%)' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="text-8xl mb-2">🏆</div>
      </motion.div>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <h1 className="text-3xl font-black text-white mb-1">Chapter Conquered!</h1>
        <p className="text-indigo-300 font-bold text-sm">Rise of Nationalism in Europe — Complete</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 }}
        className="bg-indigo-900/50 border border-indigo-700 rounded-2xl px-8 py-5 w-full space-y-3"
      >
        <div className="flex justify-between text-sm font-bold text-slate-300">
          <span>⚔️ Battles won</span><span className="text-green-400">3 / 3</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-slate-300">
          <span>🧠 Concepts mastered</span><span className="text-yellow-400">11 Key Ideas</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-slate-300">
          <span>⭐ XP Earned</span><span className="text-indigo-400">+{score} XP</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.1 }}>
            <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          </motion.div>
        ))}
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="text-xs text-slate-500 italic">
        "And that is how the map of Europe was drawn in blood, poetry, and iron." — Kabir
      </motion.p>
    </div>
  );
}

// ── Defeat screen ────────────────────────────────────────────────────────────
function DefeatScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6"
      style={{ background: 'radial-gradient(ellipse at center, #1c0008 0%, #0a0a0a 100%)' }}>
      <div className="text-7xl">💀</div>
      <div>
        <h2 className="text-2xl font-black text-white mb-1">You were defeated!</h2>
        <p className="text-red-400 text-sm font-bold">The enemy was too strong this time...</p>
      </div>
      <button onClick={onRetry}
        className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl transition-all active:scale-95">
        <RotateCcw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function NationalismGauntletPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [totalXP, setTotalXP] = useState(0);
  const [defeatStage, setDefeatStage] = useState<Stage | null>(null);

  const handleBattleWin = (xp: number, nextStage: Stage) => {
    setTotalXP(p => p + xp);
    setStage(nextStage);
    if (nextStage === 'victory') {
      // Award XP to user account (fire-and-forget)
      fetch('/api/xp/award', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ xp, source: 'gauntlet_nationalism' }) }).catch(() => {});
    }
  };

  const handleBattleLose = (thisStage: Stage) => {
    setDefeatStage(thisStage);
    setStage('intro'); // will be overridden by defeatStage
  };

  // Defeat modal overlay
  if (defeatStage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md h-[80vh]">
          <DefeatScreen onRetry={() => { setDefeatStage(null); setStage(defeatStage); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-start pb-20">
      {/* Fixed header */}
      <div className="w-full max-w-md px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-[#07070f]/95 backdrop-blur z-20">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">⚔️ Chapter Gauntlet</p>
          <p className="text-xs font-black text-white">Rise of Nationalism in Europe</p>
          <p className="text-[10px] text-slate-500">Class 10 History · Ch. 1</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 px-2 py-1 rounded-lg">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-black text-yellow-300">{totalXP}</span>
        </div>
      </div>

      {/* Stage progress bar */}
      {stage !== 'intro' && stage !== 'victory' && (
        <div className="w-full max-w-md px-4 mb-2">
          {(() => {
            const stageOrder: Stage[] = ['intro','act1','battle1','act2','battle2','act3','boss','victory'];
            const pct = (stageOrder.indexOf(stage) / (stageOrder.length - 1)) * 100;
            return (
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" animate={{ width: `${pct}%` }} />
              </div>
            );
          })()}
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-md px-4 flex-1">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {stage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl overflow-hidden"
              style={{ background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #07070f 100%)', minHeight: '80vh' }}>
              <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-6">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-7xl">⚔️</motion.div>
                <div>
                  <p className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-2">Chapter Gauntlet</p>
                  <h1 className="text-2xl font-black text-white leading-tight mb-1">Rise of Nationalism<br/>in Europe</h1>
                  <p className="text-slate-400 text-sm font-bold">Class 10 History · Chapter 1</p>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[['3', 'Acts', '📖'], ['3', 'Battles', '⚔️'], ['135', 'Max XP', '⭐']].map(([val, label, icon]) => (
                    <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 text-center">
                      <div className="text-xl">{icon}</div>
                      <div className="text-lg font-black text-white">{val}</div>
                      <div className="text-xs text-slate-400 font-bold">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-2xl p-4 text-left w-full">
                  <p className="text-xs font-black text-indigo-400 mb-1">HOW IT WORKS</p>
                  <ul className="text-xs text-slate-300 space-y-1 font-medium">
                    <li>📖 Read the chapter story panels</li>
                    <li>⚔️ Battle enemies with MCQ questions</li>
                    <li>💀 Boss Bismarck waits at the end</li>
                    <li>❤️ You have 3 hearts — don't lose them all!</li>
                  </ul>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStage('act1')}
                  className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
                >
                  <Swords className="w-5 h-5" /> Begin the Gauntlet
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ACT 1 */}
          {stage === 'act1' && (
            <motion.div key="act1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh' }}>
              <StoryView panels={PANELS_ACT1} actTitle="The French Spark to Napoleon" actNumber={1} onComplete={() => setStage('battle1')} />
            </motion.div>
          )}

          {/* BATTLE 1 — Enemy Soldier */}
          {stage === 'battle1' && (
            <motion.div key="battle1" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh' }}>
              <div className="rounded-3xl overflow-hidden border border-red-900/40 p-4" style={{ background: 'radial-gradient(ellipse at top, #1c0811 0%, #07070f 100%)', minHeight: '80vh' }}>
                <div className="text-center mb-4">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">⚔️ Battle 1</span>
                  <h2 className="text-lg font-black text-white">Royal Guard</h2>
                  <p className="text-xs text-slate-500">Defeat him to continue to Act 2</p>
                </div>
                <BattleView
                  questions={Q_SOLDIER} enemyType="soldier" enemyName="French Royal Guard" enemyHPMax={3} xpReward={30}
                  onWin={() => handleBattleWin(30, 'act2')}
                  onLose={() => handleBattleLose('battle1')}
                />
              </div>
            </motion.div>
          )}

          {/* ACT 2 */}
          {stage === 'act2' && (
            <motion.div key="act2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh' }}>
              <StoryView panels={PANELS_ACT2} actTitle="Vienna Strikes Back" actNumber={2} onComplete={() => setStage('battle2')} />
            </motion.div>
          )}

          {/* BATTLE 2 — Enemy General */}
          {stage === 'battle2' && (
            <motion.div key="battle2" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh' }}>
              <div className="rounded-3xl overflow-hidden border border-blue-900/40 p-4" style={{ background: 'radial-gradient(ellipse at top, #080e2c 0%, #07070f 100%)', minHeight: '80vh' }}>
                <div className="text-center mb-4">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">⚔️ Battle 2</span>
                  <h2 className="text-lg font-black text-white">Duke Metternich</h2>
                  <p className="text-xs text-slate-500">The Iron Chancellor of the Old Order</p>
                </div>
                <BattleView
                  questions={Q_GENERAL} enemyType="general" enemyName="Duke Metternich" enemyHPMax={3} xpReward={45}
                  onWin={() => handleBattleWin(45, 'act3')}
                  onLose={() => handleBattleLose('battle2')}
                />
              </div>
            </motion.div>
          )}

          {/* ACT 3 */}
          {stage === 'act3' && (
            <motion.div key="act3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh' }}>
              <StoryView panels={PANELS_ACT3} actTitle="Blood, Iron & Revolution" actNumber={3} onComplete={() => setStage('boss')} />
            </motion.div>
          )}

          {/* BOSS — Bismarck */}
          {stage === 'boss' && (
            <motion.div key="boss" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh' }}>
              <div className="rounded-3xl overflow-hidden border border-orange-900/40 p-4" style={{ background: 'radial-gradient(ellipse at top, #1a0800 0%, #07070f 100%)', minHeight: '80vh' }}>
                <div className="text-center mb-4">
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">💀 FINAL BOSS</span>
                    <h2 className="text-xl font-black text-orange-400">Otto von Bismarck</h2>
                  </motion.div>
                  <p className="text-xs text-slate-500">5 questions · No mercy</p>
                </div>
                <BattleView
                  questions={Q_BOSS} enemyType="boss" enemyName="Iron Chancellor" enemyHPMax={5} xpReward={60}
                  onWin={() => handleBattleWin(60, 'victory')}
                  onLose={() => handleBattleLose('boss')}
                />
              </div>
            </motion.div>
          )}

          {/* VICTORY */}
          {stage === 'victory' && (
            <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '80vh' }}>
              <VictoryScreen score={totalXP} total={135} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
