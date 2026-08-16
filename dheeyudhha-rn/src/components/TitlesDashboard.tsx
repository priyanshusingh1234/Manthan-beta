import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { X, Check, Lock, Trophy } from 'lucide-react-native';

interface Gauntlet {
  id: string;
  slug: string;
  title: string;
  reward: string;
  reward_threshold_percent: number;
}

interface TitlesDashboardProps {
  visible: boolean;
  onClose: () => void;
  currentCosmetics: string[];
  onTitlesUpdated: (newCosmetics: string[]) => void;
}

export default function TitlesDashboard({ visible, onClose, currentCosmetics, onTitlesUpdated }: TitlesDashboardProps) {
  const [gauntlets, setGauntlets] = useState<Gauntlet[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track selected titles as a string array
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      // Initialize selected titles from cosmetics
      const equipped = currentCosmetics
        .filter(c => typeof c === 'string' && c.startsWith('equipped_title_'))
        .map(c => c.split(':')[1])
        .filter(Boolean);
      setSelectedTitles(equipped);
      fetchData();
    }
  }, [visible, currentCosmetics]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch gauntlets that have a reward
      const { data: gData, error: gErr } = await supabase
        .from('gauntlets')
        .select('id, slug, title, reward, reward_threshold_percent')
        .neq('reward', null);

      if (gErr) throw gErr;
      setGauntlets(gData || []);

      // Fetch user's test results
      const { data: trData, error: trErr } = await supabase
        .from('test_results')
        .select('test_id, accuracy')
        .eq('user_id', user.id);

      if (trErr) throw trErr;
      setTestResults(trData || []);

    } catch (error) {
      console.error('Error fetching titles data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTitle = (title: string) => {
    if (selectedTitles.includes(title)) {
      setSelectedTitles(prev => prev.filter(t => t !== title));
    } else {
      if (selectedTitles.length >= 2) {
        Alert.alert('Limit Reached', 'You can only equip up to 2 titles at a time.');
        return;
      }
      setSelectedTitles(prev => [...prev, title]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${apiUrl}/api/profile/titles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ titles: selectedTitles }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      onTitlesUpdated(data.cosmetics);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute unlock status for gauntlet titles
  const titleList = gauntlets.map(g => {
    const titleName = g.reward.split('+')[0].trim();
    const unlocked = testResults.some(
      tr => tr.test_id === g.slug && (tr.accuracy || 0) >= (g.reward_threshold_percent || 0)
    );
    return { titleName, unlocked, source: g.title, isPuzzle: false };
  });

  // Also include puzzle titles from cosmetics
  const puzzleTitles = currentCosmetics
    .filter(c => typeof c === 'string' && c.startsWith('puzzle_title:'))
    .map(c => ({
      titleName: c.replace('puzzle_title:', ''),
      unlocked: true,
      source: 'Daily Puzzle 🧩',
      isPuzzle: true,
    }));

  // Merge and deduplicate
  const uniqueTitles = Array.from(
    new Map([...titleList, ...puzzleTitles].map(item => [item.titleName, item])).values()
  );

  // Add 'The Crusher' if it's not already in the list
  if (!uniqueTitles.some(t => t.titleName === 'The Crusher')) {
    uniqueTitles.push({
      titleName: 'The Crusher',
      unlocked: false, // Locked by default unless they actually earned it
      source: 'Special Unlock ⚡',
      isPuzzle: false,
    });
  }

  // Add 'Tiranga 🇮🇳' if purchased
  if (!uniqueTitles.some(t => t.titleName === 'Tiranga 🇮🇳')) {
    uniqueTitles.push({
      titleName: 'Tiranga 🇮🇳',
      unlocked: currentCosmetics.includes('title_tiranga'),
      source: 'Store (500 Points)',
      isPuzzle: false,
    });
  }

  // Add 'Slow & Steady' if it's not already in the list
  if (!uniqueTitles.some(t => t.titleName === 'Slow & Steady')) {
    uniqueTitles.push({
      titleName: 'Slow & Steady',
      unlocked: false,
      source: 'Daily Puzzle 🧩',
      isPuzzle: true,
    });
  }

  // Add 'Lily Pad Logic' if it's not already in the list
  if (!uniqueTitles.some(t => t.titleName === 'Lily Pad Logic')) {
    uniqueTitles.push({
      titleName: 'Lily Pad Logic',
      unlocked: false,
      source: 'Daily Puzzle 🧩',
      isPuzzle: true,
    });
  }

  const unlockedCount = uniqueTitles.filter(t => t.unlocked).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <View>
            <Text className="text-xl font-black text-slate-900 dark:text-white">Titles Dashboard</Text>
            <Text className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{selectedTitles.length}/2 Equipped</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}
          >
            <View className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
              <Text className="text-indigo-800 dark:text-indigo-300 font-bold mb-1">Show off your achievements!</Text>
              <Text className="text-indigo-600/80 dark:text-indigo-400/80 text-sm">
                Clear Arena Battles with high accuracy to unlock titles. You can display up to 2 titles on your profile.
              </Text>
            </View>

            <Text className="font-black text-slate-900 dark:text-white text-lg mb-4">
              Your Titles ({unlockedCount}/{uniqueTitles.length})
            </Text>

            <View className="gap-3">
              {uniqueTitles.map((item, index) => {
                const isSelected = selectedTitles.includes(item.titleName);
                const isCrusher = item.titleName === 'The Crusher';
                
                let containerClass = "p-4 rounded-[18px] flex-row items-center border-2 ";
                let iconBgClass = "w-12 h-12 rounded-full items-center justify-center mr-3.5 ";
                let titleTextClass = "font-black text-[15px] mb-0.5 ";
                let subtitleClass = "text-[11px] font-semibold ";

                if (isSelected) {
                  containerClass += "border-purple-600 bg-purple-50 dark:bg-purple-900/40 opacity-100";
                  iconBgClass += "bg-purple-600";
                  titleTextClass += "text-purple-700 dark:text-purple-400";
                  subtitleClass += "text-purple-600/80 dark:text-purple-300/80";
                } else if (isCrusher && item.unlocked) {
                  containerClass += "border-red-600 bg-red-50 dark:bg-red-900/40 opacity-100";
                  iconBgClass += "bg-red-600";
                  titleTextClass += "text-red-700 dark:text-red-400";
                  subtitleClass += "text-red-600/80 dark:text-red-300/80";
                } else if (item.unlocked) {
                  const isLilyPad = item.titleName === 'Lily Pad Logic';
                  if (isLilyPad && isSelected) {
                    containerClass += "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/40 opacity-100";
                    iconBgClass += "bg-yellow-500";
                    titleTextClass += "text-yellow-700 dark:text-yellow-400";
                    subtitleClass += "text-yellow-600/80 dark:text-yellow-300/80";
                  } else {
                    containerClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-100";
                    iconBgClass += "bg-slate-100 dark:bg-slate-700";
                    titleTextClass += "text-slate-900 dark:text-white";
                    subtitleClass += "text-slate-500 dark:text-slate-400";
                  }
                } else {
                  containerClass += "border-transparent bg-slate-100 dark:bg-slate-800/50 opacity-50";
                  iconBgClass += "bg-slate-200 dark:bg-slate-700";
                  titleTextClass += "text-slate-900 dark:text-white";
                  subtitleClass += "text-slate-500 dark:text-slate-400";
                }

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => item.unlocked ? toggleTitle(item.titleName) : null}
                    disabled={!item.unlocked}
                    className={containerClass}
                  >
                    {/* Icon */}
                    <View className={iconBgClass}>
                      {!item.unlocked ? (
                        <Lock size={20} color="#94a3b8" />
                      ) : isCrusher ? (
                        <Text style={{ fontSize: 22 }}>⚡</Text>
                      ) : item.isPuzzle ? (
                        <Text style={{ fontSize: 22 }}>🧩</Text>
                      ) : (
                        <Trophy size={20} color={isSelected ? '#fff' : '#64748b'} />
                      )}
                    </View>

                    {/* Text */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 mb-0.5">
                        <Text className={titleTextClass} style={{ letterSpacing: isCrusher ? 0.5 : 0 }}>
                          {item.titleName}
                        </Text>
                        {isCrusher && item.unlocked && (
                          <View className="bg-red-600 rounded-md px-1.5 py-0.5">
                            <Text className="text-white text-[9px] font-black tracking-widest">RARE</Text>
                          </View>
                        )}
                      </View>
                      <Text className={subtitleClass}>
                        {item.unlocked ? `From: ${item.source}` : `Locked. Solve the Daily Puzzle to unlock.`}
                      </Text>
                    </View>

                    {isSelected && (
                      <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center ml-2">
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {uniqueTitles.length === 0 && (
                <Text className="text-slate-500 text-center py-10 font-medium">No Arena Battles available yet.</Text>
              )}
            </View>
          </ScrollView>
        )}

        {/* Floating Save Button */}
        {!loading && (
          <View className="absolute bottom-0 left-0 right-0 p-5 bg-white/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800">
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="w-full py-4 bg-indigo-600 rounded-xl items-center flex-row justify-center"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-black uppercase tracking-widest text-sm">Save Selection</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
