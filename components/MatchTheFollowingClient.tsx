"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface Pair {
  left: string;
  right: string;
  id: string; // generated id
}

export default function MatchTheFollowingClient({ question }: { question: any }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [solved, setSolved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize pairs
  const { leftItems, rightItems, correctMapping } = useMemo(() => {
    const rawPairs = question.matchPairs || [];
    const pairs: Pair[] = rawPairs.map((p: any, i: number) => ({ ...p, id: `p${i}` }));
    
    const left = pairs.map(p => ({ id: p.id, text: p.left }));
    
    // Shuffle right items
    const right = pairs.map(p => ({ id: p.id, text: p.right }));
    for (let i = right.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [right[i], right[j]] = [right[j], right[i]];
    }

    const mapping = new Map();
    pairs.forEach(p => mapping.set(p.id, p.id));

    return { leftItems: left, rightItems: right, correctMapping: mapping };
  }, [question.matchPairs]);

  const [connections, setConnections] = useState<Map<string, string>>(new Map()); // leftId -> rightId
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });

  // Compute SVG coords for an element
  const getCenterCoords = (el: HTMLElement | null) => {
    if (!el || !containerRef.current) return { x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    
    // Check if it's left or right
    const isLeft = el.dataset.side === 'left';
    
    return {
      x: isLeft ? rect.right - containerRect.left : rect.left - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, side: 'left' | 'right') => {
    if (solved || submitting) return;
    if (side !== 'left') return; // Only start from left
    
    e.preventDefault();
    // If there's an existing connection for this left item, remove it
    if (connections.has(id)) {
      const newConns = new Map(connections);
      newConns.delete(id);
      setConnections(newConns);
    }

    setIsDragging(true);
    setDragStartId(id);
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setDragCurrentPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setDragCurrentPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartId) return;
    
    // Find if we dropped over a right item
    const rightNodes = rightRefs.current;
    let droppedId = null;
    
    for (let i = 0; i < rightNodes.length; i++) {
      const node = rightNodes[i];
      if (node) {
        const rect = node.getBoundingClientRect();
        // Expand the hit area slightly for mobile
        if (
          e.clientX >= rect.left - 20 &&
          e.clientX <= rect.right + 20 &&
          e.clientY >= rect.top - 20 &&
          e.clientY <= rect.bottom + 20
        ) {
          droppedId = rightItems[i].id;
          break;
        }
      }
    }

    if (droppedId) {
      // Check if right node is already connected
      let existingLeftId = null;
      for (const [l, r] of connections.entries()) {
        if (r === droppedId) existingLeftId = l;
      }
      
      const newConns = new Map(connections);
      if (existingLeftId) newConns.delete(existingLeftId); // Disconnect existing
      newConns.set(dragStartId, droppedId);
      setConnections(newConns);
    }

    setIsDragging(false);
    setDragStartId(null);
  };

  const handleSubmit = async () => {
    if (connections.size < leftItems.length) return;
    
    setSubmitting(true);
    setErrorMsg(null);
    
    // Validate locally
    let isCorrect = true;
    for (const [leftId, rightId] of connections.entries()) {
      if (correctMapping.get(leftId) !== rightId) {
        isCorrect = false;
        break;
      }
    }

    if (!isCorrect) {
      setErrorMsg("Some connections are incorrect. Try again!");
      setSubmitting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrorMsg("Please sign in to save your progress.");
        setSubmitting(false);
        return;
      }

      // Record the successful attempt
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption: -1, // Not MCQ
          isCorrect: true
        })
      });

      if (!res.ok) {
         // Proceed anyway if it's already solved locally
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setSolved(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save progress.");
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent scrolling on mobile while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDragging]);

  const allConnected = connections.size === leftItems.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center text-center mb-10">
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full mb-4 inline-block">
            Match The Following
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {question.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg">
            {question.body || "Draw lines connecting the items on the left to their correct matches on the right."}
          </p>
        </div>

        {/* DRAG & DROP ARENA */}
        <div 
          ref={containerRef}
          className="relative w-full max-w-2xl mx-auto select-none touch-none bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 sm:p-8"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* SVG Overlay for Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
            {/* Draw established connections */}
            {Array.from(connections.entries()).map(([leftId, rightId]) => {
              const leftIdx = leftItems.findIndex(i => i.id === leftId);
              const rightIdx = rightItems.findIndex(i => i.id === rightId);
              if (leftIdx < 0 || rightIdx < 0) return null;
              
              const start = getCenterCoords(leftRefs.current[leftIdx]);
              const end = getCenterCoords(rightRefs.current[rightIdx]);
              
              // Determine line color based on state
              let stroke = "rgb(139, 92, 246)"; // violet-500
              if (solved) stroke = "rgb(16, 185, 129)"; // emerald-500

              return (
                <path
                  key={`${leftId}-${rightId}`}
                  d={`M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="animate-in fade-in duration-300"
                />
              );
            })}
            
            {/* Draw active drag line */}
            {isDragging && dragStartId && (
              <path
                d={(() => {
                  const leftIdx = leftItems.findIndex(i => i.id === dragStartId);
                  const start = getCenterCoords(leftRefs.current[leftIdx]);
                  const end = dragCurrentPos;
                  return `M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`;
                })()}
                fill="none"
                stroke="rgb(139, 92, 246)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 8"
                className="opacity-70"
              />
            )}
          </svg>

          <div className="flex justify-between items-stretch gap-10 relative z-20">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-4">
              {leftItems.map((item, i) => {
                const isConnected = connections.has(item.id);
                return (
                  <div
                    key={item.id}
                    ref={el => { leftRefs.current[i] = el; }}
                    data-side="left"
                    onPointerDown={(e) => handlePointerDown(e, item.id, 'left')}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center text-center min-h-[5rem] shadow-sm
                      ${solved ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                      : isConnected ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-300' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 text-slate-700 dark:text-slate-200'}`}
                  >
                    <span className="font-bold text-sm sm:text-base">{item.text}</span>
                    {/* Connector node */}
                    <div className={`absolute right-0 translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 
                      ${solved ? 'border-emerald-500' : isConnected ? 'border-violet-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col gap-4">
              {rightItems.map((item, i) => {
                let isConnected = false;
                for (const v of connections.values()) if (v === item.id) isConnected = true;

                return (
                  <div
                    key={item.id}
                    ref={el => { rightRefs.current[i] = el; }}
                    data-side="right"
                    className={`relative p-4 rounded-2xl border-2 transition-all flex items-center justify-center text-center min-h-[5rem] shadow-sm
                      ${solved ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                      : isConnected ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-300' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                  >
                    <span className="font-bold text-sm sm:text-base">{item.text}</span>
                    {/* Connector node */}
                    <div className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 
                      ${solved ? 'border-emerald-500' : isConnected ? 'border-violet-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`} 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 text-center text-red-500 font-bold animate-in fade-in zoom-in">
            {errorMsg}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          {solved ? (
            <div className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" /> Perfect Match! +{question.points || 5} Points
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allConnected || submitting}
              className={`inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black transition-all transform
                ${allConnected 
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/30 hover:-translate-y-1' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
            >
              {submitting ? 'Checking...' : 'Submit Answers'} <Sparkles className={`w-5 h-5 ${allConnected ? 'animate-pulse' : 'hidden'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
