import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import CreateQuestionForm from '@/components/CreateQuestionForm';

export const metadata = {
  title: 'Create question — Dheeyudha',
};

export default function CreateQuestionPage() {
  return (
    <View className="max-w-4xl mx-auto p-8">
      <View className="mb-8">
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">Create question</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">Only verified teachers can create questions.</Text>
      </View>

      <CreateQuestionForm />
    </View>
  );
}
