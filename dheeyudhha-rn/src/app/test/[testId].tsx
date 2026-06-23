import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Upload, CheckCircle, XCircle } from 'lucide-react-native';

export default function TestTakingScreen() {
  const { testId } = useLocalSearchParams();
  const router = useRouter();
  const [testInfo, setTestInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, { type: string, answerText?: string, imageUrl?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQId, setUploadingQId] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: subData } = await supabase
            .from('test_submissions')
            .select('id')
            .eq('test_id', testId)
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (subData) {
            setHasAttempted(true);
            setLoading(false);
            return;
          }
        }

        const { data: testData, error: testErr } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();
        if (testErr) throw testErr;
        setTestInfo(testData);

        const { data: qData, error: qErr } = await supabase
          .from('test_questions')
          .select('*')
          .eq('test_id', testId)
          .order('order_index', { ascending: true });
        if (qErr) throw qErr;
        setQuestions(qData || []);
      } catch (e: any) {
        Alert.alert('Error loading test', e.message);
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchTest();
  }, [testId]);

  const handleSelectOption = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { type: 'mcq', answerText: option } }));
  };

  const uploadToSupabase = async (qId: string, uri: string) => {
    try {
      setUploadingQId(qId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const res = await FileSystem.uploadAsync(
        `${API_URL}/api/posts/upload`,
        uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          headers: { Authorization: `Bearer ${session?.access_token}` }
        }
      );
      
      if (res.status >= 200 && res.status < 300) {
        const data = JSON.parse(res.body);
        setAnswers(prev => ({ ...prev, [qId]: { type: 'written', imageUrl: data.url } }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploadingQId(null);
    }
  };

  const pickImage = async (qId: string) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1, // we compress in ImageManipulator
    });
    
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    
    try {
      setUploadingQId(qId);
      const maxW = 1200;
      const maxH = 1200;
      const needsResize = (asset.width || 0) > maxW || (asset.height || 0) > maxH;
      
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        needsResize ? [{ resize: { width: maxW, height: maxH } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const uriToUpload = Platform.OS === 'android' && !manipulated.uri.startsWith('file://') 
        ? `file://${manipulated.uri}` 
        : manipulated.uri;
        
      await uploadToSupabase(qId, uriToUpload);
    } catch (e: any) {
      setUploadingQId(null);
      Alert.alert('Image Processing Error', e.message);
    }
  };

  const deleteImage = (qId: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        ...ans
      }));

      const res = await fetch(`${API_URL}/api/tests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          testId,
          answers: formattedAnswers
        })
      });
      
      if (!res.ok) throw new Error('Submission failed on server');
      
      Alert.alert('Success!', 'Your test has been securely submitted.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/' as any) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950"><ActivityIndicator size="large" color="#4f46e5"/></View>;
  }

  if (hasAttempted) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
        <CheckCircle size={64} color="#10b981" className="mb-4" />
        <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Test Attempted!</Text>
        <Text className="text-slate-500 text-center font-medium">You have already submitted this test. Re-attempts are not allowed.</Text>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/' as any)}
          className="mt-8 bg-slate-200 dark:bg-slate-800 px-6 py-3 rounded-xl"
        >
          <Text className="text-slate-700 dark:text-slate-300 font-bold">Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!testInfo) {
    return <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950"><Text className="text-slate-500">Test not found</Text></View>;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
      <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">{testInfo.title}</Text>
      <Text className="text-slate-500 dark:text-slate-400 mb-8">{testInfo.description}</Text>

      {questions.map((q, idx) => (
        <View key={q.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <Text className="font-bold text-slate-400 dark:text-slate-500 mb-2">Question {idx + 1} ({q.marks} Marks)</Text>
          <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{q.question_text}</Text>

          {q.type === 'mcq' && q.options && (
            <View className="gap-3">
              {(q.options as string[]).map((opt, i) => {
                const isSelected = answers[q.id]?.answerText === opt;
                return (
                  <TouchableOpacity 
                    key={i}
                    onPress={() => handleSelectOption(q.id, opt)}
                    className={`p-4 rounded-xl border ${isSelected ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                  >
                    <Text className={`${isSelected ? 'text-indigo-700 font-bold dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {q.type === 'written' && (
            <View className="mt-2">
              {answers[q.id]?.imageUrl ? (
                <View className="relative">
                  <Image source={{ uri: answers[q.id].imageUrl }} className="w-full h-48 rounded-xl" resizeMode="cover" />
                  <View className="absolute top-2 left-2 bg-emerald-500 rounded-full p-1 flex-row items-center gap-1 px-2">
                    <CheckCircle size={14} color="white" />
                    <Text className="text-white text-xs font-bold">Uploaded</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => deleteImage(q.id)}
                    className="absolute top-2 right-2 bg-rose-500/90 rounded-full p-2"
                  >
                    <XCircle size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => pickImage(q.id)}
                    className="mt-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg items-center"
                  >
                    <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm">Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => pickImage(q.id)}
                  disabled={uploadingQId === q.id}
                  className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl p-8 items-center justify-center"
                >
                  {uploadingQId === q.id ? (
                    <>
                      <ActivityIndicator color="#4f46e5" className="mb-2" />
                      <Text className="text-indigo-600 dark:text-indigo-400 font-bold">Uploading image...</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={32} color="#4f46e5" className="mb-3" />
                      <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg text-center">Upload Answer Sheet</Text>
                      <Text className="text-indigo-400 dark:text-indigo-500/70 text-sm mt-1 text-center">Take a clear photo of your handwritten answer</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity 
        onPress={handleSubmit}
        disabled={submitting}
        className={`mt-4 mb-12 py-4 rounded-xl items-center ${submitting ? 'bg-indigo-400' : 'bg-indigo-600'}`}
      >
        <Text className="text-white font-black text-lg">{submitting ? 'Submitting Test...' : 'Final Submit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
