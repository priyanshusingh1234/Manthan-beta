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
      unlocked: true, // Allow them to equip it
      source: 'Special Unlock ⚡',
      isPuzzle: false,
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
          <ScrollView className="flex-1 px-5 pt-6 pb-24">
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

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => item.unlocked ? toggleTitle(item.titleName) : null}
                    disabled={!item.unlocked}
                    style={[
                      {
                        padding: 16,
                        borderRadius: 18,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: isSelected
                          ? '#6d28d9'
                          : isCrusher && item.unlocked
                            ? '#dc2626'
                            : item.unlocked
                              ? '#e2e8f0'
                              : 'transparent',
                        backgroundColor: isSelected
                          ? '#ede9fe'
                          : isCrusher && item.unlocked
                            ? '#fff1f2'
                            : item.unlocked
                              ? '#fff'
                              : '#f1f5f9',
                        opacity: item.unlocked ? 1 : 0.5,
                      }
                    ]}
                  >
                    {/* Icon */}
                    <View style={{
                      width: 48, height: 48, borderRadius: 24,
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 14,
                      backgroundColor: isSelected
                        ? '#7c3aed'
                        : isCrusher && item.unlocked
                          ? '#dc2626'
                          : item.unlocked ? '#f1f5f9' : '#e2e8f0',
                    }}>
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
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={{
                          fontWeight: '900',
                          fontSize: 15,
                          color: isSelected ? '#6d28d9' : isCrusher && item.unlocked ? '#dc2626' : '#0f172a',
                          letterSpacing: isCrusher ? 0.5 : 0,
                        }}>
                          {item.titleName}
                        </Text>
                        {isCrusher && item.unlocked && (
                          <View style={{ backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>RARE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                        {item.unlocked ? `From: ${item.source}` : `Locked. Solve the Daily Puzzle to unlock.`}
                      </Text>
                    </View>

                    {isSelected && (
                      <View style={{ width: 24, height: 24, backgroundColor: '#7c3aed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
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
