import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState } from 'react';
export default function EggDemoPage() {
    const [key, setKey] = useState(0);
    const [eggDropped, setEggDropped] = useState(false);
    const [eggClicked, setEggClicked] = useState(false);

    const start = () => {
        setKey(k => k + 1);
        setEggDropped(false);
        setEggClicked(false);
        setTimeout(() => setEggDropped(true), 100);
    };

    return (
        <View className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-6">
            <Text className="text-2xl font-black">🥚 Daily Egg Drop Preview</Text>
            <Text className="text-slate-400 text-sm">Click below to preview the animation</Text>

            <View
                onPress={start}
                className="bg-yellow-400 text-black font-black px-8 py-4 rounded-full text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(234,179,8,0.4)]"
            >
                ▶ Run Animation
            </View>

            <>
                {eggDropped && !eggClicked && (
                    <View className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                        {/* Flying Man — arcs across the top */}
                        <View
                            initial={{ x: '-10vw', y: '8vh' }}
                            animate={{ x: '110vw', y: '8vh' }}
                            transition={{ duration: 3.5, ease: "linear" }}
                            className="absolute text-5xl"
                            style={{ fontSize: '3rem' }}
                        >
                            🦸‍♂️
                        </View>

                        {/* Egg drops from center top */}
                        <View
                            initial={{ y: '-5vh', x: '50vw', scale: 0, rotate: -15 }}
                            animate={{ y: '72vh', x: '50vw', scale: 1, rotate: 0 }}
                            transition={{ delay: 1.6, duration: 1.0, type: "spring", bounce: 0.55 }}
                            className="absolute pointer-events-auto cursor-pointer"
                            style={{ translateX: '-50%' }}
                            onPress={() => setEggClicked(true)}
                            whileHover={{ scale: 1.15, rotate: [0, -12, 12, -6, 6, 0] }}
                            whileTap={{ scale: 0.85 }}
                        >
                            {/* Glow ring */}
                            <View
                                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-yellow-400 blur-xl opacity-50 -z-10 scale-150"
                            />
                            <View className="text-7xl drop-shadow-[0_0_20px_rgba(255,215,0,0.9)] select-none relative z-10">
                                🥚
                            </View>
                            {/* Tap hint */}
                            <View
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.8 }}
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                            >
                                👆 Tap the egg!
                            </View>
                        </View>
                    </View>
                )}
            </>

            {/* Egg crack animation */}
            <>
                {eggClicked && (
                    <View
                        initial={{ scale: 2, opacity: 1 }}
                        animate={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "backIn" }}
                        className="fixed inset-0 bg-yellow-300 z-[60] flex items-center justify-center text-9xl flex-row"
                        onAnimationComplete={() => {}}
                    >
                        💥
                    </View>
                )}
            </>
        </View>
    );
}
