import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, PanResponder, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Pair {
  left: string;
  right: string;
  id: string;
}

export default function MatchArena({
  question,
  onAttempt,
  disabled,
  isSubmitting,
}: {
  question: any;
  onAttempt: (isCorrect: boolean) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}) {
  const [connections, setConnections] = useState<Record<string, string>>({}); // leftId -> rightId
  
  // To track positions
  const [leftLayouts, setLeftLayouts] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [rightLayouts, setRightLayouts] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [currentDragPos, setCurrentDragPos] = useState({ x: 0, y: 0 });
  const arenaRef = useRef<View>(null);
  const [arenaYOffset, setArenaYOffset] = useState(0);

  // Refs for PanResponder closure
  const leftLayoutsRef = useRef(leftLayouts);
  leftLayoutsRef.current = leftLayouts;
  
  const rightLayoutsRef = useRef(rightLayouts);
  rightLayoutsRef.current = rightLayouts;
  
  const arenaYOffsetRef = useRef(arenaYOffset);
  arenaYOffsetRef.current = arenaYOffset;
  
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  
  const dragStartIdRef = useRef(dragStartId);
  dragStartIdRef.current = dragStartId;

  // Initialize pairs
  const { leftItems, rightItems, correctMapping } = useMemo(() => {
    const rawPairs = question.match_pairs || [];
    const pairs: Pair[] = rawPairs.map((p: any, i: number) => ({ ...p, id: `p${i}` }));
    
    const left = pairs.map(p => ({ id: p.id, text: p.left }));
    
    // Shuffle right items
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

    const mapping: Record<string, string> = {};
    pairs.forEach(p => { mapping[p.id] = p.id; });

    return { leftItems: left, rightItems: right, correctMapping: mapping };
  }, [question.match_pairs]);

  // PanResponder to handle the drag
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        if (disabled) return;
        const { locationX, locationY, pageY } = evt.nativeEvent;
        // y coordinates inside arena
        const y = pageY - arenaYOffsetRef.current;
        
        let foundLeftId = null;
        for (const [id, layout] of Object.entries(leftLayoutsRef.current)) {
          if (y >= layout.y && y <= layout.y + layout.height) {
            foundLeftId = id;
            break;
          }
        }

        if (foundLeftId) {
          setIsDragging(true);
          setDragStartId(foundLeftId);
          setCurrentDragPos({ x: evt.nativeEvent.pageX, y });
          
          // Remove existing connection for this left item if any
          setConnections(prev => {
            if (prev[foundLeftId!]) {
              const next = { ...prev };
              delete next[foundLeftId!];
              return next;
            }
            return prev;
          });
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isDraggingRef.current || disabled) return;
        const y = evt.nativeEvent.pageY - arenaYOffsetRef.current;
        setCurrentDragPos({ x: evt.nativeEvent.pageX, y });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isDraggingRef.current || !dragStartIdRef.current || disabled) {
          setIsDragging(false);
          setDragStartId(null);
          return;
        }

        const y = evt.nativeEvent.pageY - arenaYOffsetRef.current;
        const x = evt.nativeEvent.pageX;

        // Check if dropped on a right item
        let droppedRightId = null;
        for (const [id, layout] of Object.entries(rightLayoutsRef.current)) {
          // Add some padding to hit box
          if (
            x >= layout.x - 30 && x <= layout.x + layout.width + 30 &&
            y >= layout.y - 20 && y <= layout.y + layout.height + 20
          ) {
            droppedRightId = id;
            break;
          }
        }

        if (droppedRightId) {
          setConnections(prev => {
            const next = { ...prev };
            // If right item already connected, remove old
            for (const k in next) {
              if (next[k] === droppedRightId) delete next[k];
            }
            next[dragStartIdRef.current!] = droppedRightId;
            return next;
          });
        }

        setIsDragging(false);
        setDragStartId(null);
      },
    })
  ).current;

  const handleSubmit = () => {
    if (Object.keys(connections).length < leftItems.length || disabled) return;
    
    let isCorrect = true;
    for (const [leftId, rightId] of Object.entries(connections)) {
      if (correctMapping[leftId] !== rightId) {
        isCorrect = false;
        break;
      }
    }
    onAttempt(isCorrect);
  };

  const allConnected = Object.keys(connections).length === leftItems.length;

  return (
    <View className="w-full">
      <View 
        ref={arenaRef}
        className="w-full relative min-h-[300px] bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800"
        onLayout={() => {
          arenaRef.current?.measure((x, y, w, h, pageX, pageY) => {
            setArenaYOffset(pageY);
          });
        }}
        {...panResponder.panHandlers}
      >
        {/* Connection Lines (SVG) */}
        <View className="absolute inset-0 z-10" pointerEvents="none">
          <Svg height="100%" width="100%">
            {/* Established Connections */}
            {Object.entries(connections).map(([leftId, rightId]) => {
              const leftL = leftLayouts[leftId];
              const rightL = rightLayouts[rightId];
              if (!leftL || !rightL) return null;

              const startX = leftL.x + leftL.width;
              const startY = leftL.y + leftL.height / 2;
              const endX = rightL.x;
              const endY = rightL.y + rightL.height / 2;

              return (
                <Path
                  key={`${leftId}-${rightId}`}
                  d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={disabled ? "#94a3b8" : "#8b5cf6"}
                  strokeWidth="4"
                />
              );
            })}

            {/* Dragging Line */}
            {isDragging && dragStartId && leftLayouts[dragStartId] && (
              <Path
                d={`M ${leftLayouts[dragStartId].x + leftLayouts[dragStartId].width} ${leftLayouts[dragStartId].y + leftLayouts[dragStartId].height / 2} C ${leftLayouts[dragStartId].x + leftLayouts[dragStartId].width + 50} ${leftLayouts[dragStartId].y + leftLayouts[dragStartId].height / 2}, ${currentDragPos.x - 50} ${currentDragPos.y}, ${currentDragPos.x} ${currentDragPos.y}`}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeDasharray="8 8"
              />
            )}
          </Svg>
        </View>

        {/* Nodes */}
        <View className="flex-row justify-between relative z-20">
          
          {/* Left Column */}
          <View className="w-[42%] gap-4">
            {leftItems.map((item) => (
              <View
                key={item.id}
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  setLeftLayouts(prev => ({ ...prev, [item.id]: { x, y, width, height } }));
                }}
                className={`p-4 min-h-[5rem] items-center justify-center rounded-2xl border-2 ${
                  connections[item.id]
                    ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Text className={`text-center font-bold text-sm ${connections[item.id] ? 'text-violet-900 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.text}
                </Text>
                {/* Node connector dot */}
                <View className={`absolute -right-2 w-4 h-4 rounded-full border-2 ${connections[item.id] ? 'bg-violet-500 border-white dark:border-slate-900' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} />
              </View>
            ))}
          </View>

          {/* Right Column */}
          <View className="w-[42%] gap-4">
            {rightItems.map((item) => {
              let isConnected = false;
              for (const v of Object.values(connections)) if (v === item.id) isConnected = true;

              return (
                <View
                  key={item.id}
                  onLayout={(e) => {
                    const { x, y, width, height } = e.nativeEvent.layout;
                    // Right layouts need an offset because of flex layout
                    // The right column starts at roughly 58% of the screen width due to justify-between
                    setRightLayouts(prev => ({ ...prev, [item.id]: { x: x + (SCREEN_WIDTH * 0.58), y, width, height } }));
                  }}
                  className={`p-4 min-h-[5rem] items-center justify-center rounded-2xl border-2 ${
                    isConnected
                      ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Node connector dot */}
                  <View className={`absolute -left-2 w-4 h-4 rounded-full border-2 ${isConnected ? 'bg-violet-500 border-white dark:border-slate-900' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} />
                  <Text className={`text-center font-bold text-sm ${isConnected ? 'text-violet-900 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!allConnected || disabled || isSubmitting}
        className={`w-full py-4 mt-6 rounded-xl items-center flex-row justify-center ${
          !allConnected || disabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-violet-600'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={`text-lg font-bold ${!allConnected || disabled ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`}>
            Submit Matches
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
