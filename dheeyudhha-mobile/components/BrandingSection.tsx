"use client";

import React from 'react';
import { Brain, Trophy, BookOpen, Users, Sparkles, Settings } from 'lucide-react-native';
import Logo from './Logo';

interface BrandingSectionProps {
    title: string;
    subtitle: string;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({ title, subtitle }) => {
    return (
        <View className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 flex-row">
            {/* Custom Styles for Advanced Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes gear-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gear-spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes float-ethereal {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-10px) scale(1.02); opacity: 0.9; }
        }
        .animate-gear-1 { animation: gear-spin 35s linear infinite; }
        .animate-gear-2 { animation: gear-spin-reverse 30s linear infinite; }
        .animate-gear-3 { animation: gear-spin 25s linear infinite; }
        .animate-gear-4 { animation: gear-spin-reverse 40s linear infinite; }
        .animate-float-ethereal { animation: float-ethereal 8s ease-in-out infinite; }
        .animate-float-ethereal-delayed { animation: float-ethereal 10s ease-in-out infinite 2s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
        }
        
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 1);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px 0 rgba(0, 0, 0, 0.08), 0 0 15px rgba(59, 130, 246, 0.1);
        }
      `}} />

            {/* Dynamic Gradient Background Background */}
            <View className="absolute inset-0 z-0">
                <View className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.1)_0%,_transparent_50%)]"></View>
                <View className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,92,246,0.1)_0%,_transparent_50%)]"></View>
                <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.05)_0%,_transparent_60%)]"></View>
            </View>

            {/* Unique Gear System Animation */}
            <View className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply overflow-hidden">
                <View className="absolute top-[10%] -left-[10%] text-blue-300/40 animate-gear-1">
                    <Settings className="w-[500px] h-[500px]" strokeWidth={0.5} />
                </View>
                <View className="absolute top-[40%] left-[35%] text-purple-300/40 animate-gear-2" style={{ transformOrigin: 'center' }}>
                    <Settings className="w-[300px] h-[300px]" strokeWidth={1} />
                </View>
                <View className="absolute -bottom-[20%] right-[10%] text-emerald-300/30 animate-gear-3">
                    <Settings className="w-[400px] h-[400px]" strokeWidth={0.8} />
                </View>
                <View className="absolute top-[20%] -right-[15%] text-pink-300/30 animate-gear-4">
                    <Settings className="w-[300px] h-[300px]" strokeWidth={0.8} />
                </View>

                {/* Floating Sparks */}
                <Sparkles className="absolute top-[25%] left-[25%] w-6 h-6 text-yellow-500 animate-float-ethereal" />
                <Sparkles className="absolute bottom-[35%] right-[25%] w-5 h-5 text-blue-500 animate-float-ethereal-delayed" />
                <Sparkles className="absolute top-[60%] left-[15%] w-4 h-4 text-purple-500 animate-float-ethereal" style={{ animationDelay: '4s' }} />
            </View>

            {/* Main Content Container */}
            <View className="relative z-10 flex flex-col items-center justify-center w-full px-6 xl:px-8 overflow-y-auto scrollbar-hide py-4">
                {/* Logo container with glowing effect */}
                <View className="relative mb-4 group shrink-0">
                    <View className="absolute inset-0 bg-blue-100 blur-[40px] opacity-50 group-hover:opacity-80 transition-opacity duration-700 rounded-full"></View>
                    <View className="relative glass-card p-3 rounded-[2rem] animate-float-ethereal backdrop-blur-xl">
                        <Logo width={90} height={90} showTagline={true} />
                    </View>
                </View>

                {/* Hero Text */}
                <View className="text-center space-y-2 mb-6 relative w-full max-w-sm shrink-0">
                    <Text className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm leading-tight pb-1">
                        {title}
                    </Text>
                    <Text className="text-sm text-slate-600 font-medium leading-relaxed">
                        {subtitle}
                    </Text>

                    {/* Subtle separator */}
                    <View className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mx-auto rounded-full mt-4"></View>
                </View>

                {/* Interactive Feature Grid */}
                <View className="grid grid-cols-2 gap-3 w-full max-w-sm relative shrink-0">
                    <View className="glass-card rounded-xl p-4 transition-all duration-500 group cursor-pointer hover:bg-slate-50/80">
                        <View className="bg-emerald-100/80 rounded-lg p-2 w-fit mb-2 group-hover:scale-110 transition-transform duration-500">
                            <Brain className="h-4 w-4 text-emerald-600" />
                        </View>
                        <Text className="text-[13px] font-bold mb-1 text-slate-800">Brain Wars</Text>
                        <Text className="text-[11px] text-slate-500 leading-snug">Challenge top minds in epic battles</Text>
                    </View>

                    <View className="glass-card rounded-xl p-4 transition-all duration-500 group cursor-pointer hover:bg-slate-50/80" style={{ transform: 'translateY(10px)' }}>
                        <View className="bg-yellow-100/80 rounded-lg p-2 w-fit mb-2 group-hover:scale-110 transition-transform duration-500">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                        </View>
                        <Text className="text-[13px] font-bold mb-1 text-slate-800">Leaderboards</Text>
                        <Text className="text-[11px] text-slate-500 leading-snug">Ascend the ranks and claim glory</Text>
                    </View>

                    <View className="glass-card rounded-xl p-4 transition-all duration-500 group cursor-pointer hover:bg-slate-50/80">
                        <View className="bg-pink-100/80 rounded-lg p-2 w-fit mb-2 group-hover:scale-110 transition-transform duration-500">
                            <BookOpen className="h-4 w-4 text-pink-600" />
                        </View>
                        <Text className="text-[13px] font-bold mb-1 text-slate-800">Learn & Grow</Text>
                        <Text className="text-[11px] text-slate-500 leading-snug">Master subjects effortlessly</Text>
                    </View>

                    <View className="glass-card rounded-xl p-4 transition-all duration-500 group cursor-pointer hover:bg-slate-50/80" style={{ transform: 'translateY(10px)' }}>
                        <View className="bg-blue-100/80 rounded-lg p-2 w-fit mb-2 group-hover:scale-110 transition-transform duration-500">
                            <Users className="h-4 w-4 text-blue-600" />
                        </View>
                        <Text className="text-[13px] font-bold mb-1 text-slate-800">School Wars</Text>
                        <Text className="text-[11px] text-slate-500 leading-snug">Represent and conquer schools</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default BrandingSection;
