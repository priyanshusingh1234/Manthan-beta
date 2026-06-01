import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
// import { Zap } from 'lucide-react-native'; // We will install lucide-react-native next

import { XP_PER_LEVEL, getLevel } from '@/lib/xp';

const LEVEL_COLORS = [
    { from: '#94a3b8', to: '#64748b', label: 'Rookie' },     // L1
    { from: '#22d3ee', to: '#0891b2', label: 'Scholar' },    // L2
    { from: '#34d399', to: '#059669', label: 'Expert' },     // L3
    { from: '#818cf8', to: '#4f46e5', label: 'Master' },     // L4
    { from: '#fb923c', to: '#ea580c', label: 'Champion' },   // L5
    { from: '#f472b6', to: '#db2777', label: 'Legend' },     // L6
    { from: '#fbbf24', to: '#d97706', label: 'Mythic' },     // L7+
];

function getLevelColor(level: number) {
    return LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)];
}

interface XPBarProps {
    xp: number;
    compact?: boolean;
}

export default function XPBar({ xp = 0, compact = false }: XPBarProps) {
    const { level, xpInLevel, progressPct } = getLevel(xp);
    const color = getLevelColor(level);

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(progressPct, {
            duration: 1000,
            easing: Easing.out(Easing.ease),
        });
    }, [progressPct]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value}%`,
        };
    });

    if (compact) {
        return (
            <View className="flex-row items-center gap-2 w-full">
                <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: color.to }}>
                    {/* <Zap size={10} color="white" /> */}
                    <Text className="text-[10px] font-black text-white">Lv.{level}</Text>
                </View>

                <View className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <Animated.View
                        className="h-full rounded-full"
                        style={[{ backgroundColor: color.from }, animatedStyle]}
                    />
                </View>

                <Text className="text-[10px] text-slate-400 font-bold shrink-0">{xpInLevel}/{XP_PER_LEVEL}</Text>
            </View>
        );
    }

    return (
        <View className="w-full">
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    <View
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: color.to }}
                    >
                        {/* <Zap size={18} color="white" /> */}
                    </View>
                    <View>
                        <View className="flex-row items-center">
                            <Text className="font-black text-sm text-slate-900 dark:text-white">Level {level}</Text>
                            <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: color.from }}>
                                <Text className="text-xs font-black text-white">{color.label}</Text>
                            </View>
                        </View>
                        <Text className="text-[10px] text-slate-400 font-bold mt-0.5">{xp} XP total</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-xs font-black text-slate-900 dark:text-white">{xpInLevel} / {XP_PER_LEVEL}</Text>
                    <Text className="text-[10px] text-slate-400">to Lv.{level + 1}</Text>
                </View>
            </View>

            <View className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <Animated.View
                    className="h-full rounded-full"
                    style={[{ backgroundColor: color.from }, animatedStyle]}
                />
            </View>

            <View className="flex-row justify-between mt-1 px-0.5">
                {[0, 25, 50].map(tick => (
                    <Text key={tick} className="text-[9px] text-slate-300 dark:text-slate-600 font-bold">
                        {tick}
                    </Text>
                ))}
            </View>
        </View>
    );
}
