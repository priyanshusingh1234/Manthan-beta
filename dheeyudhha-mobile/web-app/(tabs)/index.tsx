import { ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';

export default function FeedScreen() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('id, title, subject, chapter')
        .limit(10);
      
      if (error) throw error;
      if (data) setQuestions(data);
    } catch (error: any) {
      console.error('Error fetching questions:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50 p-4 flex-row">
      <Text className="text-2xl font-bold text-gray-900 mb-6 mt-4">Recent Questions Feed</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="bg-indigo-100 px-3 py-1 rounded-full">
                  <Text className="text-indigo-700 text-xs font-semibold">{item.subject}</Text>
                </View>
                <Text className="text-gray-400 text-xs ml-2">{item.chapter}</Text>
              </View>
              <Text className="text-gray-800 text-lg font-medium leading-6">{item.title}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
