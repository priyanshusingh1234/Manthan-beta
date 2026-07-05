import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { supabase } from '@/lib/supabase';
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

  // Compute unlock status
  const titleList = gauntlets.map(g => {
    const titleName = g.reward.split('+')[0].trim();
    // Check if any test result for this gauntlet meets the threshold
    const unlocked = testResults.some(
      tr => tr.test_id === g.slug && (tr.accuracy || 0) >= (g.reward_threshold_percent || 0)
    );
    return { titleName, unlocked, gauntletTitle: g.title };
  });

  // Remove duplicates just in case multiple gauntlets give the same title
  const uniqueTitles = Array.from(new Map(titleList.map(item => [item.titleName, item])).values());

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
                
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => item.unlocked ? toggleTitle(item.titleName) : null}
                    disabled={!item.unlocked}
                    className={`p-4 rounded-2xl flex-row items-center border-2 ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' 
                        : item.unlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-100 dark:bg-slate-900/50 border-transparent opacity-60'
                    }`}
                  >
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      isSelected ? 'bg-indigo-500' : item.unlocked ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-200 dark:bg-slate-800'
                    }`}>
                      {item.unlocked ? (
                        <Trophy size={20} color={isSelected ? '#fff' : '#64748b'} />
                      ) : (
                        <Lock size={20} color="#94a3b8" />
                      )}
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`font-black text-base ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.titleName}
                      </Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {item.unlocked ? `From: ${item.gauntletTitle}` : `Locked. Clear '${item.gauntletTitle}' to unlock.`}
                      </Text>
                    </View>

                    {isSelected && (
                      <View className="w-6 h-6 bg-indigo-500 rounded-full items-center justify-center ml-2">
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
