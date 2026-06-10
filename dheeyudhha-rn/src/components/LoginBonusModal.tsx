import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { Gift, CheckCircle, X, Shield, Coins } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginBonusModal() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    let mounted = true;
    const checkBonus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const meta = session.user.user_metadata || {};
        
        // If completed all 7 days, never show again
        if (meta.loginBonusCompleted === true) return;

        const day = Number(meta.loginBonusDay) || 0;
        
        // Check if already claimed today
        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const todayStr = nowIST.toISOString().slice(0, 10);
        
        if (meta.lastLoginClaimDate !== todayStr) {
          // Check local storage to prevent annoying popups if they just dismissed it this session
          const dismissedToday = await AsyncStorage.getItem(`bonus_dismissed_${todayStr}`);
          if (dismissedToday !== 'true' && mounted) {
            setCurrentDay(day);
            setVisible(true);
          }
        }
      } catch (err) {
        console.warn('Failed to check login bonus', err);
      }
    };

    // Check after a short delay so the app layout has time to render
    setTimeout(checkBonus, 1500);

    return () => { mounted = false; };
  }, []);

  const handleClose = async () => {
    setVisible(false);
    // Mark as dismissed for today locally so it doesn't pop up again
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayStr = nowIST.toISOString().slice(0, 10);
    await AsyncStorage.setItem(`bonus_dismissed_${todayStr}`, 'true');
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/login-bonus/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const data = await res.json();
      
      if (data.error) {
        // Just close it if server says already claimed
        setVisible(false);
      } else {
        setCurrentDay(data.newDay);
        // Refresh session
        await supabase.auth.refreshSession();
        // Give a little time for user to see the success state
        setTimeout(() => {
          setVisible(false);
          // Notify other components if needed
          DeviceEventEmitter.emit('user_metadata_updated');
        }, 1500);
      }
    } catch (err) {
      console.warn('Bonus claim failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-slate-900/80 justify-center items-center px-4">
        <View className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
          
          <TouchableOpacity 
            onPress={handleClose} 
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 z-10"
          >
            <X size={20} color="white" />
          </TouchableOpacity>

          <View className="bg-indigo-500 pt-8 pb-6 px-6 items-center relative overflow-hidden">
            <View className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full" />
            <Gift size={48} color="white" className="mb-3" />
            <Text className="text-2xl font-black text-white tracking-tight">7-Day Login Bonus</Text>
            <Text className="text-indigo-100 font-medium mt-1 text-center">Claim your daily reward to grow faster!</Text>
          </View>

          <View className="p-6">
            <View className="flex-row flex-wrap justify-between mb-4">
              {days.slice(0, 4).map(day => (
                <DayCard key={day} day={day} currentDay={currentDay} isDark={isDark} />
              ))}
            </View>
            <View className="flex-row flex-wrap justify-center gap-3 mb-6">
              {days.slice(4, 7).map(day => (
                <DayCard key={day} day={day} currentDay={currentDay} isLarge={day === 7} isDark={isDark} />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleClaim}
              disabled={loading}
              className={`w-full py-4 rounded-2xl items-center shadow-lg active:scale-95 ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-black text-lg text-white">Claim Reward Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DayCard({ day, currentDay, isLarge = false, isDark }: { day: number, currentDay: number, isLarge?: boolean, isDark: boolean }) {
  const isClaimed = day <= currentDay;
  const isNext = day === currentDay + 1;
  
  let bgClass = 'bg-slate-50 dark:bg-slate-800/50';
  let borderClass = 'border-slate-100 dark:border-slate-800';
  
  if (isClaimed) {
    bgClass = 'bg-green-50 dark:bg-green-900/20';
    borderClass = 'border-green-200 dark:border-green-800';
  } else if (isNext) {
    bgClass = 'bg-indigo-50 dark:bg-indigo-900/20';
    borderClass = 'border-indigo-400 dark:border-indigo-500';
  }

  return (
    <View 
      className={`relative items-center justify-center p-3 rounded-2xl border-2 ${bgClass} ${borderClass}`}
      style={{ width: isLarge ? '30%' : '22%' }}
    >
      {isClaimed && (
        <View className="absolute -top-2 -right-2 bg-green-500 rounded-full p-0.5 shadow-sm z-10">
          <CheckCircle size={14} color="white" />
        </View>
      )}
      
      <Text className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isClaimed ? 'text-green-700 dark:text-green-400' : 'text-slate-400'}`}>
        Day {day}
      </Text>
      
      {day === 7 ? (
        <Shield size={28} color={isClaimed ? '#22c55e' : isNext ? '#6366f1' : '#cbd5e1'} className="mb-1" />
      ) : (
        <View className="flex-row items-center gap-1">
          <Coins size={14} color={isClaimed ? '#22c55e' : isNext ? '#fb923c' : '#cbd5e1'} />
          <Text className={`text-base font-black ${isClaimed ? 'text-green-700 dark:text-green-400' : isNext ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
            {day * 5}
          </Text>
        </View>
      )}
      
      {day === 7 && (
        <Text className="text-[9px] font-bold text-center mt-1 text-indigo-600 dark:text-indigo-400">Pioneer{'\n'}Badge</Text>
      )}
    </View>
  );
}
