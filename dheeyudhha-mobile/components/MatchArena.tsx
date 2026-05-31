import { Svg, Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react-native';

interface Pair {
  left: string;
  right: string;
  id: string; // generated id
}

export default function MatchArena({ 
  question, 
  onAttempt, 
  disabled 
}: { 
  question: any;
  onAttempt: (isCorrect: boolean) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize pairs
  const { leftItems, rightItems, correctMapping } = useMemo(() => {
    const rawPairs = question.matchPairs || [];
    const pairs: Pair[] = rawPairs.map((p: any, i: number) => ({ ...p, id: `p${i}` }));
    
    const left = pairs.map(p => ({ id: p.id, text: p.left }));
    
    // Shuffle right items, ensuring it doesn't match original order if possible
    let right = pairs.map(p => ({ id: p.id, text: p.right }));
    if (right.length > 1) {
      let isSame = true;
      let attempts = 0;
      while (isSame && attempts < 5) {
        for (let i = right.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [right[i], right[j]] = [right[j], right[i]];
        }
        isSame = right.every((r, idx) => r.id === pairs[idx].id);
        attempts++;
      }
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
    if (disabled) return;
    if (side !== 'left') return; // Only start from left
    
    e.preventDefault();
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
    
    const rightNodes = rightRefs.current;
    let droppedId = null;
    
    for (let i = 0; i < rightNodes.length; i++) {
      const node = rightNodes[i];
      if (node) {
        const rect = node.getBoundingClientRect();
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

  const handleSubmit = () => {
    if (connections.size < leftItems.length) return;
    
    let isCorrect = true;
    for (const [leftId, rightId] of connections.entries()) {
      if (correctMapping.get(leftId) !== rightId) {
        isCorrect = false;
        break;
      }
    }

    onAttempt(isCorrect);
  };

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
    <View className="w-full">
      <View 
        ref={containerRef}
        className="relative w-full max-w-2xl mx-auto select-none touch-none bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 sm:p-8"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
          {Array.from(connections.entries()).map(([leftId, rightId]) => {
            const leftIdx = leftItems.findIndex(i => i.id === leftId);
            const rightIdx = rightItems.findIndex(i => i.id === rightId);
            if (leftIdx < 0 || rightIdx < 0) return null;
            
            const start = getCenterCoords(leftRefs.current[leftIdx]);
            const end = getCenterCoords(rightRefs.current[rightIdx]);
            
            let stroke = "rgb(139, 92, 246)"; // violet-500
            if (disabled) stroke = "rgb(148, 163, 184)"; // slate-400

            return (
              <Path
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
          
          {isDragging && dragStartId && (
            <Path
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
        </Svg>

        <View className="flex justify-between items-stretch gap-10 relative z-20 flex-row">
          <View className="flex-1 flex flex-col gap-4">
            {leftItems.map((item, i) => {
              const isConnected = connections.has(item.id);
              return (
                <View
                  key={item.id}
                  ref={el => { leftRefs.current[i] = el; }}
                  data-side="left"
                  onPointerDown={(e) => handlePointerDown(e, item.id, 'left')}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center text-center min-h-[5rem] shadow-sm
                    ${disabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500' 
                    : isConnected ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 text-slate-700 dark:text-slate-200'}`}
                >
                  <Text className="font-bold text-sm sm:text-base">{item.text}</Text>
                  <View className={`absolute right-0 translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 
                    ${disabled ? 'border-slate-300' : isConnected ? 'border-violet-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`} 
                  />
                </View>
              );
            })}
          </View>

          <View className="flex-1 flex flex-col gap-4">
            {rightItems.map((item, i) => {
              let isConnected = false;
              for (const v of connections.values()) if (v === item.id) isConnected = true;

              return (
                <View
                  key={item.id}
                  ref={el => { rightRefs.current[i] = el; }}
                  data-side="right"
                  className={`relative p-4 rounded-2xl border-2 transition-all flex items-center justify-center text-center min-h-[5rem] shadow-sm
                    ${disabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500' 
                    : isConnected ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                  <Text className="font-bold text-sm sm:text-base">{item.text}</Text>
                  <View className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 
                    ${disabled ? 'border-slate-300' : isConnected ? 'border-violet-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`} 
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className="mt-8 flex justify-center flex-row">
        <View
          onPress={handleSubmit}
          disabled={!allConnected || disabled}
          className={`inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black transition-all transform
            ${allConnected && !disabled
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/30 hover:-translate-y-1' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
        >
          Submit Matches <Sparkles className={`w-5 h-5 ${allConnected && !disabled ? 'animate-pulse' : 'hidden'}`} />
        </View>
      </View>
    </View>
  );
}
