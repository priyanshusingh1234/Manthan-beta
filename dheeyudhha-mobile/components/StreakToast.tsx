'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react-native';

export default function StreakToast() {
    const [toast, setToast] = useState<{ streak: number } | null>(null);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as { streak: number };
            if (timerRef.current) clearTimeout(timerRef.current);

            setToast(detail);
            // Small delay so CSS transition fires
            requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));

            // Auto-dismiss after 4s
            timerRef.current = setTimeout(() => {
                setVisible(false);
                setTimeout(() => setToast(null), 400);
            }, 4000);
        };

        window.addEventListener('streak_earned', handler);
        return () => {
            window.removeEventListener('streak_earned', handler);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    if (!toast) return null;

    return (
        // Portalled to top of screen, above everything
        <View
            className="fixed inset-x-0 bottom-24 z-[9999] flex justify-center pointer-events-none px-4 sm:bottom-8 flex-row"
            aria-live="polite"
        >
            <View
                onPress={() => {
                    setVisible(false);
                    setTimeout(() => setToast(null), 400);
                }}
                className={`pointer-events-auto cursor-pointer transition-all duration-300 ease-out ${
                    visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
                }`}
            >
                <View className="relative flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl overflow-hidden flex-row"
                    style={{
                        background: 'linear-gradient(135deg, #1e1b18 0%, #292118 100%)',
                        boxShadow: '0 8px 32px rgba(249,115,22,0.35), 0 2px 8px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(249,115,22,0.3)',
                    }}>

                    {/* Glow blob */}
                    <View className="absolute -left-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-40"
                        style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />

                    {/* Fire icon with pulse ring */}
                    <View className="relative shrink-0">
                        <View className="absolute inset-0 rounded-full animate-ping opacity-30"
                            style={{ background: '#f97316', animationDuration: '1s' }} />
                        <View className="relative w-10 h-10 rounded-full flex items-center justify-center flex-row"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                            <Flame className="w-5 h-5 text-white" fill="white" />
                        </View>
                    </View>

                    {/* Text */}
                    <View className="relative z-10">
                        <Text className="text-white font-black text-[15px] leading-tight">
                            Streak day {toast.streak} unlocked! 🔥
                        </Text>
                        <Text className="text-orange-300/80 text-[12px] font-semibold mt-0.5">
                            You solved 2 questions today · Keep it up!
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
