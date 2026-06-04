import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Zap, ArrowLeft, Camera, Image as ImageIcon, CheckCircle2, Shield, Users, Trophy } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabaseClient';

export default function WrittenSolveClient({ question, challengeId }: { question: any; challengeId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [solveTimeLeft, setSolveTimeLeft] = useState<number>((question.time_limit || 30) * 60);
  const [timerStarted, setTimerStarted] = useState(false);

  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [teacherSolutionUrl, setTeacherSolutionUrl] = useState<string | null>(null);
  const [showTeacherAnswer, setShowTeacherAnswer] = useState(false);

  const [selfMarked, setSelfMarked] = useState(false);
  const [selfMarkResult, setSelfMarkResult] = useState<any>(null);

  const activeSubmission = existingSubmission;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setToken(session.access_token);
      setCurrentUserId(session.user.id);

      const { data } = await supabase
        .from('written_submissions')
        .select('*')
        .eq('student_id', session.user.id)
        .eq('question_id', question.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setExistingSubmission(data);
      }
      setTimerStarted(true);
    };
    init();
  }, [question.id]);

  useEffect(() => {
    if (!timerStarted || activeSubmission || solveTimeLeft <= 0) return;
    const t = setInterval(() => setSolveTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [timerStarted, solveTimeLeft, activeSubmission]);

  useEffect(() => {
    const fetchTeacherSolution = async () => {
      if (!token || !activeSubmission) return;
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const res = await fetch(`${API_URL}/api/teacher-solution?questionId=${question.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.hasModelAnswer) setTeacherSolutionUrl(data.solutionUrl);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTeacherSolution();
  }, [activeSubmission, token, question.id]);

  // Polling for checker-feed updates
  useEffect(() => {
    if (!existingSubmission) return;
    if (existingSubmission.status !== 'pending_check' && existingSubmission.status !== 'flagged_for_ai') return;

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('written_submissions')
        .select('*')
        .eq('id', existingSubmission.id)
        .maybeSingle();
      if (data && data.status !== existingSubmission.status) {
        setExistingSubmission(data);
        if (data.status === 'points_given' || data.status === 'auto_approved') clearInterval(poll);
      }
    }, 8000);
    return () => clearInterval(poll);
  }, [existingSubmission]);

  const handlePickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required to upload photos.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setSelectedImageUri(manipResult.uri);
      }
    } catch (error) {
      console.error('Image picking error', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedImageUri || !token) return;
    setUploading(true);

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const formData = new FormData();

      const filename = selectedImageUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('file', {
        uri: selectedImageUri,
        name: filename,
        type,
      } as any);

      formData.append('questionId', question.id);
      if (challengeId) formData.append('challengeId', challengeId);

      const res = await fetch(`${API_URL}/api/written-submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // React Native FormData sets Content-Type automatically with boundary
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setExistingSubmission({
        id: data.submissionId,
        submission_url: data.submissionUrl || selectedImageUri,
        self_marked_correct: false,
        status: 'pending',
        points_awarded: 0,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSelfMark = async () => {
    if (!existingSubmission || !token) return;
    setSubmitting(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/written-submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId: existingSubmission.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to self mark');
      setSelfMarked(true);
      setSelfMarkResult(data);
      // Update local status
      setExistingSubmission({ ...existingSubmission, status: 'pending_check' });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} className="text-slate-900 dark:text-white" />
        </TouchableOpacity>

        {!activeSubmission && (
          <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex-row items-center gap-2">
            <Clock size={16} color={solveTimeLeft <= 60 ? "#dc2626" : "#64748b"} />
            <Text className={`font-bold ${solveTimeLeft <= 60 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
              {formatTime(solveTimeLeft)}
            </Text>
          </View>
        )}

        <View className="bg-violet-600 px-3 py-1.5 rounded-full flex-row items-center gap-1 shadow-sm">
          <Zap size={14} color="#fff" fill="#fff" />
          <Text className="text-white font-bold text-xs">{question.points || 0} pts - Written</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Question Details */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 mb-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">{question.title}</Text>
          {question.body && <Text className="text-slate-600 dark:text-slate-300 mb-4">{question.body}</Text>}
          {question.image_url && (
            <Image
              source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${question.image_url}` }}
              className="w-full h-48 rounded-xl bg-slate-100"
              resizeMode="contain"
            />
          )}
        </View>

        {!activeSubmission ? (
          /* Upload Section */
          <View className="space-y-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 text-center">
              Write your answer on paper, then snap a photo!
            </Text>

            {selectedImageUri ? (
              <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <Image source={{ uri: selectedImageUri }} className="w-full h-64 bg-slate-100" resizeMode="contain" />
                <View className="p-4 flex-row justify-between gap-3">
                  <TouchableOpacity
                    onPress={() => setSelectedImageUri(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
                  >
                    <Text className="font-bold text-slate-600 dark:text-slate-300">Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpload}
                    disabled={uploading}
                    className="flex-1 py-3 bg-indigo-600 rounded-xl items-center flex-row justify-center"
                  >
                    {uploading ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">Upload Answer</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handlePickImage(true)}
                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 items-center justify-center"
                >
                  <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-3">
                    <Camera size={24} color="#4f46e5" />
                  </View>
                  <Text className="font-bold text-slate-700 dark:text-slate-300">Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handlePickImage(false)}
                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 items-center justify-center"
                >
                  <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-3">
                    <ImageIcon size={24} color="#4f46e5" />
                  </View>
                  <Text className="font-bold text-slate-700 dark:text-slate-300">Upload Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Submission / Self-Mark Section */
          <View className="space-y-6">
            <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-4 rounded-xl flex-row items-center gap-3">
              <Shield size={20} color="#d97706" />
              <Text className="flex-1 font-bold text-amber-800 dark:text-amber-400">
                {activeSubmission.status === 'pending_check' ? 'In Checker Queue' :
                  activeSubmission.status === 'points_given' ? 'Points Awarded ✓' :
                    'Uploaded - Please Self Mark'}
              </Text>
            </View>

            <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <Text className="font-bold text-slate-500 mb-2 uppercase text-xs">Your Uploaded Answer</Text>
              <Image source={{ uri: activeSubmission.submission_url }} className="w-full h-48 rounded-xl bg-slate-100" resizeMode="contain" />
            </View>

            {showTeacherAnswer ? (
              <View className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800/30">
                <Text className="font-bold text-indigo-500 mb-2 uppercase text-xs">Teacher's Model Answer</Text>
                {teacherSolutionUrl ? (
                  <Image source={{ uri: teacherSolutionUrl }} className="w-full h-48 rounded-xl bg-white" resizeMode="contain" />
                ) : (
                  <View className="h-32 items-center justify-center bg-white/50 rounded-xl">
                    <Text className="text-slate-500 italic text-center px-4">No model answer provided by teacher.</Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowTeacherAnswer(true)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 items-center shadow-sm"
              >
                <Text className="font-bold text-indigo-600 dark:text-indigo-400">Reveal Teacher's Answer</Text>
              </TouchableOpacity>
            )}

            {!selfMarked && activeSubmission.status === 'pending' && showTeacherAnswer && (
              <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center mb-2">Be Honest!</Text>
                <Text className="text-slate-600 dark:text-slate-400 text-center mb-6">
                  Compare your answer to the teacher's model above. Does your answer cover all the key points?
                </Text>

                <TouchableOpacity
                  onPress={handleSelfMark}
                  disabled={submitting}
                  className="bg-emerald-600 flex-row justify-center items-center py-4 rounded-xl"
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <CheckCircle2 size={20} color="#fff" className="mr-2" />
                      <Text className="text-white font-bold text-lg">Yes, My Answer is Correct</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text className="text-xs text-center text-slate-400 mt-3 px-4">
                  (Note: Peer checkers will verify this. False claims will result in a penalty!)
                </Text>
              </View>
            )}

            {selfMarked && selfMarkResult && (
              <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-6 items-center">
                <View className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800/50 rounded-full items-center justify-center mb-4">
                  <CheckCircle2 size={32} color="#10b981" />
                </View>
                <Text className="text-xl font-black text-emerald-900 dark:text-emerald-400 mb-2">Self-Marked!</Text>
                <Text className="text-emerald-800 dark:text-emerald-300 font-bold mb-4 text-center">
                  +{selfMarkResult.pointsAwarded} Points awarded provisionally.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/')}
                  className="bg-emerald-600 px-6 py-3 rounded-xl w-full items-center"
                >
                  <Text className="text-white font-bold">Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
