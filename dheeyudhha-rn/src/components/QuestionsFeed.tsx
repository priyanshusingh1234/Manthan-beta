import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from './QuestionCard';
import ArenaBattleCard from './ArenaBattleCard';

const SUBJECTS = [
  { label: 'All', value: '', emoji: '⚡' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Science', value: 'Science', emoji: '🔬' },
  { label: 'English', value: 'English', emoji: '📖' },
  { label: 'SST', value: 'SST', emoji: '🌍' },
];

export default function QuestionsFeed() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [subjectFilter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (subjectFilter) {
        query = query.eq('subject', subjectFilter);
      }

      let gauntletQuery = supabase
        .from('gauntlets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (subjectFilter) {
        gauntletQuery = gauntletQuery.ilike('subject', `%${subjectFilter}%`);
      }

      const [{ data: qData, error: qError }, { data: gData }] = await Promise.all([query, gauntletQuery]);
      if (qError) throw qError;
      
      const apps = qData || [];
      const gauntletItems = (gData || []).map(g => ({ ...g, type: 'gauntlet' }));
      
      const finalFeed: any[] = [];
      let gIdx = 0;
      for (let i = 0; i < apps.length; i++) {
        if (gIdx < gauntletItems.length && (i === 0 || (i > 0 && i % 5 === 0))) {
          finalFeed.push(gauntletItems[gIdx++]);
        }
        finalFeed.push(apps[i]);
      }
      while (gIdx < gauntletItems.length) finalFeed.push(gauntletItems[gIdx++]);

      setQuestions(finalFeed);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Filters */}
      <View className="mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
          {SUBJECTS.map((sub) => {
            const isActive = subjectFilter === sub.value;
            return (
              <TouchableOpacity
                key={sub.label}
                onPress={() => setSubjectFilter(isActive ? '' : sub.value)}
                className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
                  isActive 
                    ? 'bg-indigo-600 border-indigo-600' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text className={isActive ? 'text-white' : 'text-slate-700'}>{sub.emoji}</Text>
                <Text className={`font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {sub.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed */}
      <View className="px-6 pb-20">
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" className="mt-10" />
        ) : questions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-4">🔍</Text>
            <Text className="text-slate-500 font-bold text-center">No questions found for {subjectFilter || 'this feed'}.</Text>
          </View>
        ) : (
          questions.map(q => 
            q.type === 'gauntlet' 
              ? <ArenaBattleCard key={`gauntlet-${q.id}`} gauntlet={q} /> 
              : <QuestionCard key={q.id} q={q} />
          )
        )}
      </View>
    </View>
  );
}
