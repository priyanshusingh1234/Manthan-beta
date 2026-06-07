import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, Image, Platform, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { ChevronLeft, Plus, X, Camera, FileText, CheckCircle2, ChevronDown } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

type Difficulty = 'easy' | 'moderate' | 'hard' | '';
const SUBJECT_OPTIONS = ['Mathematics', 'Science', 'English', 'English Literature', 'SST', 'Hindi', 'G.K'];

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

export default function CreateQuestionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [points, setPoints] = useState('5');
  const [timeLimit, setTimeLimit] = useState('10');
  const [difficulty, setDifficulty] = useState<Difficulty>('');
  const [chapter, setChapter] = useState('');
  const [isVip, setIsVip] = useState(false);

  // Type State
  const [questionType, setQuestionType] = useState<'mcq' | 'match'>('mcq');
  
  // MCQ State
  const [options, setOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);

  // Match State
  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>([
    { left: '', right: '' },
    { left: '', right: '' },
    { left: '', right: '' },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Image Upload State
  const [imageFile, setImageFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Model Answer State
  const [modelAnswerFile, setModelAnswerFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [modelAnswerPreview, setModelAnswerPreview] = useState<string | null>(null);
  const [modelAnswerUploading, setModelAnswerUploading] = useState(false);
  const [modelAnswerSaved, setModelAnswerSaved] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login' as any);
        return;
      }
      supabase.from('profiles').select('is_teacher').eq('id', user.id).single().then(({ data }) => {
        const isAuthTeacher = data?.is_teacher || user.user_metadata?.isTeacher || false;
        setIsTeacher(isAuthTeacher);
        setLoading(false);
      });
    });
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!subject.trim()) e.subject = 'Subject is required.';
    if (subject !== 'English' && !classGrade.trim()) e.classGrade = 'Class is required.';
    
    const p = Number(points);
    if (!Number.isFinite(p) || p < 1 || p > 25) e.points = 'Points must be 1-25.';
    if (p > 15 && !modelAnswerFile && !modelAnswerSaved) e.modelAnswer = 'Model answer required for >15 points.';
    
    const t = Number(timeLimit);
    if (!Number.isFinite(t) || t <= 0) e.timeLimit = 'Time must be > 0.';

    if (questionType === 'mcq') {
      const filledOptions = options.filter(o => o.trim() !== '');
      if (filledOptions.length > 0 && filledOptions.length < 2) e.options = 'Provide at least two options or remove them.';
      if (filledOptions.length > 0) {
        if (correctOption === null || correctOption < 0 || correctOption >= filledOptions.length) {
          e.options = 'Select the correct option using the radio button.';
        }
      }
    } else {
      const filledPairs = matchPairs.filter(p => p.left.trim() && p.right.trim());
      if (filledPairs.length < 3) e.matchPairs = 'Provide at least 3 pairs.';
      if (matchPairs.some(p => (p.left.trim() && !p.right.trim()) || (!p.left.trim() && p.right.trim()))) {
        e.matchPairs = 'Both sides of a pair must be filled.';
      }
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async (type: 'illustration' | 'answer') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera roll access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    // Compress
    const maxW = 1000;
    const maxH = 1000;
    const needsResize = (asset.width || 0) > maxW || (asset.height || 0) > maxH;

    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      needsResize ? [{ resize: { width: maxW, height: maxH } }] : [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const uriToUpload = Platform.OS === 'android' && !manipulated.uri.startsWith('file://') 
      ? `file://${manipulated.uri}` : manipulated.uri;

    const fileInfo = {
      uri: uriToUpload,
      type: 'image/jpeg',
      name: `${type}-${Date.now()}.jpg`,
    };

    if (type === 'illustration') {
      setImageFile(fileInfo);
      setImagePreview(uriToUpload);
      // Fire and forget upload
      uploadIllustration(fileInfo);
    } else {
      setModelAnswerFile(fileInfo);
      setModelAnswerPreview(uriToUpload);
    }
  };

  const uploadIllustration = async (fileInfo: { uri: string; type: string; name: string }) => {
    setImageUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await FileSystem.uploadAsync(
        `${API_URL}/api/questions/upload`,
        fileInfo.uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const body = JSON.parse(res.body);
      if (res.status !== 200) throw new Error(body?.error || 'Upload failed');
      setImagePath(body.path || null);
    } catch (e) {
      console.warn('Image upload failed', e);
      Alert.alert('Upload Error', 'Illustration upload failed. It will be ignored.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please check the errors in the form.');
      return;
    }

    if (imageFile && !imagePath && !imageUploading) {
       await uploadIllustration(imageFile);
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        title: title.trim(),
        body: body.trim(),
        subject: subject.trim(),
        classGrade: classGrade.trim() || 'All',
        points: Number(points),
        timeLimit: Number(timeLimit),
        difficulty: difficulty || null,
        chapter: chapter.trim() || null,
        isVip,
        questionType,
        matchPairs: questionType === 'match' ? matchPairs.filter(p => p.left.trim() && p.right.trim()) : null,
        options: questionType === 'mcq' ? options.filter(o => o.trim() !== '') : null,
        correctOption: questionType === 'mcq' && correctOption !== null ? correctOption : null,
        imageUrl: null,
        imagePath: imagePath || null,
      };

      const res = await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const bodyRes = await res.json();
      if (!res.ok) throw new Error(bodyRes?.error || 'Save failed');
      
      const createdQuestionId = bodyRes?.data?.id || bodyRes?.id;

      // Upload model answer if needed
      if (Number(points) > 15 && modelAnswerFile && createdQuestionId) {
        setModelAnswerUploading(true);
        try {
          const solRes = await FileSystem.uploadAsync(
            `${API_URL}/api/teacher-solution`,
            modelAnswerFile.uri,
            {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              parameters: {
                questionId: createdQuestionId
              }
            }
          );
          if (solRes.status === 200) setModelAnswerSaved(true);
        } catch {
          // ignore
        } finally {
          setModelAnswerUploading(false);
        }
      }

      Alert.alert('Success', 'Question created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!isTeacher) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
        <Alert.alert title="Access Denied" />
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4">Not Authorized</Text>
        <Text className="text-slate-500 text-center mt-2">Only verified teachers can create questions.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-indigo-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 pb-4">
        <View className="flex-row items-center mt-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <ChevronLeft size={24} color={isDark ? '#cbd5e1' : '#475569'} />
          </TouchableOpacity>
          <Text className="text-xl font-black text-slate-900 dark:text-slate-100 ml-2">Create Question</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        
        {/* Type Toggle */}
        <View className="flex-row bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-6">
          <TouchableOpacity 
            onPress={() => setQuestionType('mcq')}
            className={`flex-1 py-2.5 items-center rounded-lg ${questionType === 'mcq' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-bold ${questionType === 'mcq' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>MCQ / Written</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setQuestionType('match')}
            className={`flex-1 py-2.5 items-center rounded-lg ${questionType === 'match' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-bold ${questionType === 'match' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>Match Pairs</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Title <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter question title..."
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white font-medium"
            />
            {errors.title && <Text className="text-red-500 text-xs mt-1">{errors.title}</Text>}
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject <Text className="text-red-500">*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {SUBJECT_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSubject(s)}
                  className={`px-4 py-2 mr-2 rounded-full border ${subject === s ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                >
                  <Text className={`text-sm font-bold ${subject === s ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.subject && <Text className="text-red-500 text-xs mt-1">{errors.subject}</Text>}
          </View>

          {subject !== 'English' && (
            <View>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Class/Grade <Text className="text-red-500">*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {['All', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setClassGrade(c)}
                    className={`px-4 py-2 mr-2 rounded-full border ${classGrade === c ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                  >
                    <Text className={`text-sm font-bold ${classGrade === c ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.classGrade && <Text className="text-red-500 text-xs mt-1">{errors.classGrade}</Text>}
            </View>
          )}

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Points <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={points}
                onChangeText={setPoints}
                keyboardType="numeric"
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white font-medium"
              />
              {errors.points && <Text className="text-red-500 text-xs mt-1">{errors.points}</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mins <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={timeLimit}
                onChangeText={setTimeLimit}
                keyboardType="numeric"
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white font-medium"
              />
              {errors.timeLimit && <Text className="text-red-500 text-xs mt-1">{errors.timeLimit}</Text>}
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Chapter (Optional)</Text>
            <TextInput
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Thermodynamics"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white font-medium"
            />
          </View>

          {/* VIP Toggle */}
          <View className="flex-row items-center justify-between p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-lg">👑</Text>
                <Text className="font-black text-amber-700 dark:text-amber-400">VIP Challenge</Text>
              </View>
              <Text className="text-xs text-amber-600/80 dark:text-amber-400/60">Premium card design. Good for hard questions.</Text>
            </View>
            <Switch
              value={isVip}
              onValueChange={setIsVip}
              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#f59e0b' }}
            />
          </View>

          {/* Options / Pairs */}
          {questionType === 'mcq' ? (
            <View className="mt-2">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Options</Text>
              {options.map((opt, i) => (
                <View key={i} className="flex-row items-center gap-3 mb-3">
                  <TouchableOpacity onPress={() => setCorrectOption(i)} className="p-1">
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${correctOption === i ? 'border-amber-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {correctOption === i && <View className="w-3 h-3 rounded-full bg-amber-500" />}
                    </View>
                  </TouchableOpacity>
                  <TextInput
                    value={opt}
                    onChangeText={(v) => setOptions(opts => opts.map((o, idx) => idx === i ? v : o))}
                    placeholder={`Option ${i + 1}`}
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-slate-900 dark:text-white"
                  />
                  <TouchableOpacity onPress={() => {
                    setOptions(opts => opts.filter((_, idx) => idx !== i));
                    if (correctOption === i) setCorrectOption(null);
                    else if (correctOption !== null && correctOption > i) setCorrectOption(correctOption - 1);
                  }}>
                    <X size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {options.length < 6 && (
                <TouchableOpacity onPress={() => setOptions([...options, ''])} className="flex-row items-center gap-2 py-2">
                  <Plus size={16} color="#4f46e5" />
                  <Text className="text-indigo-600 dark:text-indigo-400 font-bold">Add Option</Text>
                </TouchableOpacity>
              )}
              {errors.options && <Text className="text-red-500 text-xs">{errors.options}</Text>}
            </View>
          ) : (
            <View className="mt-2">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Matching Pairs</Text>
              {matchPairs.map((pair, i) => (
                <View key={i} className="flex-row items-center gap-2 mb-3">
                  <TextInput
                    value={pair.left}
                    onChangeText={(v) => setMatchPairs(pairs => pairs.map((p, idx) => idx === i ? { ...p, left: v } : p))}
                    placeholder="Left"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                  <Text className="text-slate-400">→</Text>
                  <TextInput
                    value={pair.right}
                    onChangeText={(v) => setMatchPairs(pairs => pairs.map((p, idx) => idx === i ? { ...p, right: v } : p))}
                    placeholder="Right"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                  <TouchableOpacity onPress={() => setMatchPairs(pairs => pairs.filter((_, idx) => idx !== i))} disabled={matchPairs.length <= 3}>
                    <X size={20} color={matchPairs.length <= 3 ? '#94a3b8' : '#ef4444'} />
                  </TouchableOpacity>
                </View>
              ))}
              {matchPairs.length < 6 && (
                <TouchableOpacity onPress={() => setMatchPairs([...matchPairs, { left: '', right: '' }])} className="flex-row items-center gap-2 py-2">
                  <Plus size={16} color="#4f46e5" />
                  <Text className="text-indigo-600 dark:text-indigo-400 font-bold">Add Pair</Text>
                </TouchableOpacity>
              )}
              {errors.matchPairs && <Text className="text-red-500 text-xs">{errors.matchPairs}</Text>}
            </View>
          )}

          {/* Body */}
          <View>
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Question Text <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write the full question description here..."
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white font-medium min-h-[120px]"
            />
          </View>

          {/* Model Answer for > 15 points */}
          {Number(points) > 15 && (
            <View className="p-4 rounded-2xl border-2 border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-900/20">
              <Text className="text-sm font-bold text-violet-800 dark:text-violet-400 mb-1">📝 Model Answer Required</Text>
              <Text className="text-xs text-violet-600/80 dark:text-violet-400/80 mb-3">Questions worth > 15 points need a solution image.</Text>
              
              {modelAnswerPreview ? (
                <View className="relative w-full h-40 rounded-xl overflow-hidden bg-black mb-3">
                  <Image source={{ uri: modelAnswerPreview }} className="w-full h-full" resizeMode="cover" />
                  <TouchableOpacity onPress={() => setModelAnswerPreview(null)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full">
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => pickImage('answer')} className="bg-violet-100 dark:bg-violet-900/50 py-3 rounded-xl items-center">
                  <Text className="text-violet-700 dark:text-violet-300 font-bold text-sm">Upload Solution Image</Text>
                </TouchableOpacity>
              )}
              {errors.modelAnswer && <Text className="text-red-500 text-xs mt-2">{errors.modelAnswer}</Text>}
            </View>
          )}

          {/* Illustration Image */}
          <View>
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Illustration Image (Optional)</Text>
            {imagePreview ? (
              <View className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
                <TouchableOpacity onPress={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full">
                  <X size={16} color="white" />
                </TouchableOpacity>
                {imageUploading && (
                  <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    <ActivityIndicator color="white" />
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity onPress={() => pickImage('illustration')} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-dashed rounded-xl h-24 items-center justify-center">
                <Camera size={24} color={isDark ? '#475569' : '#94a3b8'} />
                <Text className="text-slate-500 font-medium text-sm mt-2">Tap to add image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Submit Button Sticky Bottom */}
      <View className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-8">
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={saving}
          className={`py-4 rounded-xl items-center flex-row justify-center gap-2 ${saving ? 'bg-amber-400' : 'bg-amber-500'}`}
        >
          {saving ? <ActivityIndicator color="white" /> : <CheckCircle2 size={20} color="white" />}
          <Text className="text-white font-black text-lg">{saving ? 'Saving...' : 'Create Question'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
