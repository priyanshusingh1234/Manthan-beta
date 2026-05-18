'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import QuestionCard from './QuestionCard';
import PostCard from './PostCard';
import VipQuestionCard from './VipQuestionCard';
import { Bookmark, ChevronUp, X, RotateCcw } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useRouter } from 'next/navigation';

interface SwipeableFeedProps {
    items: any[];
    userId: string | null;
    currentUserData: any;
    onLoadMore: () => void;
    onReload: () => void;
}

const SWIPE_THRESHOLD = 80; // px to trigger action

function SwipeCard({
    item,
    onSwipeUp,
    onSwipeDown,
    userId,
    currentUserData,
}: {
    item: any;
    onSwipeUp: () => void;
    onSwipeDown: () => void;
    userId: string | null;
    currentUserData: any;
}) {
    const router = useRouter();
    const y = useMotionValue(0);
    const opacity = useTransform(y, [-150, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, 150], [0, 0.6, 1, 0.6, 0]);
    const upIndicatorOpacity = useTransform(y, [-SWIPE_THRESHOLD, -30, 0], [1, 0.4, 0]);
    const downIndicatorOpacity = useTransform(y, [0, 30, SWIPE_THRESHOLD], [0, 0.4, 1]);
    const scale = useTransform(y, [-200, 0, 200], [0.92, 1, 0.92]);

    const isDragging = useRef(false);

    const handleDragEnd = async (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
        const offset = info.offset.y;
        const velocity = info.velocity.y;

        if (offset < -SWIPE_THRESHOLD || velocity < -400) {
            // Swipe up = next card / solve
            await animate(y, -window.innerHeight, { duration: 0.3, ease: [0.4, 0, 0.2, 1] });
            try { await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); } catch (_) {}
            onSwipeUp();
        } else if (offset > SWIPE_THRESHOLD || velocity > 400) {
            // Swipe down = skip
            await animate(y, window.innerHeight, { duration: 0.3, ease: [0.4, 0, 0.2, 1] });
            try { await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); } catch (_) {}
            onSwipeDown();
        } else {
            animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
        }
    };

    const handleTap = () => {
        if (isDragging.current) return;
        if (item.type !== 'post') {
            router.push(`/questions/${item.id}`);
        }
    };

    return (
        <motion.div
            style={{ y, opacity, scale, touchAction: 'none' }}
            drag="y"
            dragConstraints={{ top: -200, bottom: 200 }}
            dragElastic={0.3}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={handleDragEnd}
            onDragTransitionEnd={() => { setTimeout(() => { isDragging.current = false; }, 50); }}
            className="w-full will-change-transform cursor-grab active:cursor-grabbing select-none"
        >
            {/* Swipe up hint */}
            <motion.div
                style={{ opacity: upIndicatorOpacity }}
                className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none z-10"
            >
                <div className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-black px-4 py-2 rounded-full">
                    <ChevronUp className="w-3.5 h-3.5" />  Solve it!
                </div>
            </motion.div>

            {/* Swipe down hint */}
            <motion.div
                style={{ opacity: downIndicatorOpacity }}
                className="absolute -bottom-10 left-0 right-0 flex justify-center pointer-events-none z-10"
            >
                <div className="flex items-center gap-1.5 bg-slate-600 text-white text-xs font-black px-4 py-2 rounded-full">
                    <X className="w-3.5 h-3.5" />  Skip
                </div>
            </motion.div>

            {/* The actual card content */}
            <div onClick={handleTap}>
                {item.type === 'post' ? (
                    <PostCard
                        post={item}
                        currentUserId={userId}
                        onUpdate={() => {}}
                        feedLabel={item._feedLabel}
                        suppliedCurrentUserData={currentUserData}
                    />
                ) : item.is_vip ? (
                    <VipQuestionCard q={item} />
                ) : (
                    <QuestionCard q={item} />
                )}
            </div>
        </motion.div>
    );
}

export default function SwipeableFeed({
    items,
    userId,
    currentUserData,
    onLoadMore,
    onReload,
}: SwipeableFeedProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);

    const handleSwipeUp = () => {
        const next = currentIndex + 1;
        if (next >= items.length) onLoadMore();
        setDirection('up');
        setCurrentIndex(Math.min(next, items.length - 1));
    };

    const handleSwipeDown = () => {
        const next = currentIndex + 1;
        if (next >= items.length) onLoadMore();
        setDirection('down');
        setCurrentIndex(Math.min(next, items.length - 1));
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        onReload();
    };

    if (items.length === 0) return null;

    const item = items[currentIndex];
    const isDone = currentIndex >= items.length;

    return (
        <div className="relative w-full">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        animate={{ width: `${Math.min(100, ((currentIndex) / items.length) * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
                <span className="text-[11px] font-bold text-slate-400 tabular-nums shrink-0">
                    {currentIndex + 1} / {items.length}
                </span>
            </div>

            {/* Swipe hint text */}
            <p className="text-[11px] text-center text-slate-400 font-medium mb-2 tracking-wide">
                Swipe up to solve • Swipe down to skip
            </p>

            {/* Card stack */}
            <div className="relative min-h-[200px]">
                <AnimatePresence mode="wait">
                    {!isDone ? (
                        <motion.div
                            key={currentIndex}
                            initial={{
                                y: direction === 'down' ? -60 : 60,
                                opacity: 0,
                                scale: 0.95,
                            }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            className="relative"
                        >
                            {/* Ghost card peeking below */}
                            {currentIndex + 1 < items.length && (
                                <div className="absolute inset-x-2 -bottom-3 h-full rounded-3xl bg-slate-100 dark:bg-slate-800 opacity-50 scale-[0.97] pointer-events-none" />
                            )}

                            <SwipeCard
                                item={item}
                                onSwipeUp={handleSwipeUp}
                                onSwipeDown={handleSwipeDown}
                                userId={userId}
                                currentUserData={currentUserData}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-16 flex flex-col items-center gap-4"
                        >
                            <div className="text-5xl">🎉</div>
                            <p className="font-black text-xl text-slate-800 dark:text-slate-100">You've seen it all!</p>
                            <p className="text-sm text-slate-400 text-center">Great hustle. Come back for more questions.</p>
                            <button
                                onClick={handleRestart}
                                className="flex items-center gap-2 bg-indigo-600 text-white font-black px-6 py-3 rounded-full text-sm active:scale-95 transition-transform mt-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Shuffle Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
