"use client";
import React from 'react';
import { useRouter } from '@/lib/next-navigation';
import { Share } from 'react-native';
import { Platform } from 'react-native';
import { Target, Clock, ArrowRight, ShieldAlert, Share2 } from 'lucide-react-native';
import { getClientAppUrl } from '@/lib/appUrl';

export default function TestYourselfBanner() {
  const router = useRouter();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareText = `I challenge you to the Ultimate Class 9 Hard Gauntlet at Dheeyudha! 40 brutal MCQs, 60 Minutes. Do you have what it takes? 🧠🔥\n${getClientAppUrl()}/test/class-9-hard`;
    
    try {
      if ((Platform.OS !== 'web')) {
        await CapShare.share({
            title: 'Dheeyudha Test Challenge',
            text: shareText,
            dialogTitle: 'Challenge your friends'
        });
      } else if (navigator.share) {
        await navigator.share({
            title: 'Dheeyudha Test Challenge',
            text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Challenge link copied to clipboard!');
      }
    } catch (e) {
      console.log('Share failed', e);
    }
  };

  return (
    <View className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 mb-4">
      <View 
        onPress={() => router.push('/test/class-9-hard')}
        className="group cursor-pointer relative block w-full overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-6 md:p-8 hover:border-slate-700 transition-all shadow-xl md:shadow-2xl"
      >
        {/* Ambient background glows */}
        <View className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-red-500/10 blur-[60px] md:blur-[80px] rounded-full group-hover:bg-red-500/20 transition-all duration-500" />
        <View className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-indigo-500/10 blur-[40px] md:blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

        {/* Share Button Floating Top Right */}
        <View 
          onPress={handleShare}
          className="absolute top-4 md:top-6 right-4 md:right-6 p-2 md:p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-full md:rounded-xl text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-lg z-20 group/share"
          title="Challenge a Friend!"
        >
          <Share2 className="w-4 h-4 md:w-5 md:h-5 group-hover/share:scale-110 transition-transform" />
        </View>

        <View className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 pr-12 md:pr-16 lg:pr-0">
          <View className="flex-1 flex-row">
            <View className="flex items-center gap-2 text-red-400 md:text-red-500 mb-2 md:mb-3 flex-row">
              <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
              <Text className="text-[10px] md:text-xs font-black uppercase tracking-widest italic">Ultimate Gauntlet</Text>
            </View>
            
            <Text className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
              Test Yourself
            </Text>
            <Text className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
              Are you the toughest scholar? Take the ultimate Class 9 Hard MCQ challenge. 40 brutal questions. 1 Hour. No mercy.
            </Text>
          </View>

          <View className="flex flex-col sm:flex-row items-center gap-4 shrink-0 lg:pr-14">
            <View className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 flex-row">
              <View className="flex-1 sm:flex-none flex flex-col items-center justify-center bg-slate-800/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 border border-slate-700/50 min-w-[70px] md:min-w-[80px]">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-400 mb-1" />
                <Text className="text-white font-black text-sm">40</Text>
                <Text className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">MCQs</Text>
              </View>
              
              <View className="flex-1 sm:flex-none flex flex-col items-center justify-center bg-slate-800/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 border border-slate-700/50 min-w-[70px] md:min-w-[80px]">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400 mb-1" />
                <Text className="text-white font-black text-sm">60</Text>
                <Text className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">Mins</Text>
              </View>
            </View>

            <View className="w-full sm:w-auto px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white text-slate-900 font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-slate-100 transition-colors shadow-lg active:scale-95 flex-row">
              <Text>Start Now</Text>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
