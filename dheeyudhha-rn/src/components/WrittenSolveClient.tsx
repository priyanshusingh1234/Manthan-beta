import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Image,
  ScrollView, Alert, Platform, DeviceEventEmitter
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock, Zap, ArrowLeft, Camera, Image as ImageIcon,
  CheckCircle2, XCircle, Shield, Users, ThumbsUp,
  AlertTriangle, Info, Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabaseClient';
import ImageViewerModal from '@/components/ImageViewerModal';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

/** Resolves a question image_url to a full URL — matches web logic exactly */
function resolveImageUrl(question: any): string | null {
  if (!question) return null;
  const rawUrl = question.imageUrl || question.image_url;
  if (rawUrl) {
    if (rawUrl.startsWith('http')) return rawUrl;
    if (rawUrl.startsWith('/')) return `${API_URL}${rawUrl}`;
  }
  const rawPath = question.imagePath || question.image_path;
  if (rawPath) {
    return `${SUPABASE_URL}/storage/v1/object/public/question-images/${rawPath}`;
  }
  return null;
}

function StatusBanner({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending_check: { label: 'In Checker Queue', color: 'bg-amber-50 border-amber-200', icon: <Shield size={16} color="#d97706" /> },
    points_given:  { label: 'Points Awarded ✓ — Peer review open', color: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={16} color="#059669" /> },
    auto_approved: { label: 'Auto-Approved ✓', color: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={16} color="#059669" /> },
    ai_confirmed_correct: { label: 'AI Verified Correct ✓', color: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={16} color="#059669" /> },
    ai_confirmed_wrong:   { label: 'AI Confirmed Incorrect ✗', color: 'bg-red-50 border-red-200', icon: <XCircle size={16} color="#dc2626" /> },
  };
  const info = cfg[status] || { label: 'Uploaded — Not Yet Marked', color: 'bg-slate-50 border-slate-200', icon: <Clock size={16} color="#64748b" /> };
  return (
    <View className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl border ${info.color} mb-2`}>
      {info.icon}
      <Text className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex-1">{info.label}</Text>
    </View>
  );
}

export default function WrittenSolveClient({ question, challengeId }: { question: any; challengeId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [solveTimeLeft, setSolveTimeLeft] = useState<number>((question.time_limit || 30) * 60);
  const [timerStarted, setTimerStarted] = useState(false);

  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [uploadedSubmission, setUploadedSubmission] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [teacherSolutionUrl, setTeacherSolutionUrl] = useState<string | null>(null);
  const [showTeacherAnswer, setShowTeacherAnswer] = useState(false);
  const [loadingTeacherAnswer, setLoadingTeacherAnswer] = useState(false);
  
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);

  const [selfMarked, setSelfMarked] = useState(false);
  const [selfMarkResult, setSelfMarkResult] = useState<any>(null);

  const activeSubmission = existingSubmission || uploadedSubmission;
  const questionImageUrl = resolveImageUrl(question);

  // ── Auth + existing submission ──
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setToken(session.access_token);
      setCurrentUserId(session.user.id);

      const { data } = await supabase
        .from('written_submissions')
        .select('id, submission_url, self_marked_correct, status, points_awarded, challenge_id')
        .eq('student_id', session.user.id)
        .eq('question_id', question.id)
        .limit(1)
        .maybeSingle();

      if (data) setExistingSubmission(data);
      setTimerStarted(true);
    };
    init();
  }, [question.id]);

  // ── Timer ──
  useEffect(() => {
    if (!timerStarted || activeSubmission || solveTimeLeft <= 0) return;
    const t = setInterval(() => setSolveTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [timerStarted, solveTimeLeft, activeSubmission]);

  // ── Fetch teacher solution ──
  const fetchTeacherSolution = useCallback(async () => {
    if (!token) return;
    setLoadingTeacherAnswer(true);
    try {
      const res = await fetch(`${API_URL}/api/teacher-solution?questionId=${question.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.hasModelAnswer) setTeacherSolutionUrl(data.solutionUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeacherAnswer(false);
    }
  }, [question.id, token]);

  useEffect(() => {
    if (activeSubmission && token) fetchTeacherSolution();
  }, [activeSubmission, token, fetchTeacherSolution]);

  // ── Poll for status ──
  useEffect(() => {
    const sub = existingSubmission || uploadedSubmission;
    if (!sub) return;
    if (!['pending_check', 'flagged_for_ai'].includes(sub.status)) return;

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('written_submissions')
        .select('id, submission_url, self_marked_correct, status, points_awarded')
        .eq('id', sub.id)
        .maybeSingle();
      if (data && !['pending_check', 'flagged_for_ai'].includes(data.status)) {
        if (existingSubmission) setExistingSubmission(data);
        else setUploadedSubmission(data);
        clearInterval(poll);
      }
    }, 8000);
    return () => clearInterval(poll);
  }, [existingSubmission, uploadedSubmission]);

  // ── Pick image ──
  const handlePickImage = async (useCamera: boolean) => {
    try {
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', useCamera ? 'Camera access is required.' : 'Gallery access is required.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });

      if (!result.canceled && result.assets?.length > 0) {
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
        );
        setSelectedImageUri(compressed.uri);
      }
    } catch (error) {
      console.error('Image picking error', error);
    }
  };

  // ── Upload ──
  const handleUpload = async () => {
    if (!selectedImageUri || !token) return;
    setUploading(true);
    try {
      const uriToUpload = Platform.OS === 'android' && !selectedImageUri.startsWith('file://') 
        ? `file://${selectedImageUri}` 
        : selectedImageUri;

      const uploadRes = await FileSystem.uploadAsync(
        `${API_URL}/api/written-submit`,
        uriToUpload,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          parameters: challengeId ? { questionId: question.id, challengeId } : { questionId: question.id },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let data;
      try {
        data = JSON.parse(uploadRes.body);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (uploadRes.status < 200 || uploadRes.status >= 300) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedSubmission({
        id: data.submissionId,
        submission_url: data.submissionUrl || selectedImageUri,
        self_marked_correct: false,
        status: 'pending',
        points_awarded: 0,
        challenge_id: challengeId || null,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Self-Mark: I Got It RIGHT ──
  const handleSelfMarkCorrect = async () => {
    if (!activeSubmission || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/written-submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId: activeSubmission.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to self mark');
      setSelfMarked(true);
      setSelfMarkResult(data);
      if (data?.streak?.streakEarnedToday) {
        DeviceEventEmitter.emit('streak_earned', { streak: data.streak.current });
      }
      setExistingSubmission((prev: any) => prev ? { ...prev, status: 'pending_check' } : prev);
      setUploadedSubmission((prev: any) => prev ? { ...prev, status: 'pending_check' } : prev);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete / Discard ──
  const handleDelete = async () => {
    if (!activeSubmission || !token) return;
    Alert.alert(
      'Discard Answer?',
      'This will delete your uploaded answer so you can try again alone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard', style: 'destructive', onPress: async () => {
            setDeleting(true);
            try {
              const res = await fetch(`${API_URL}/api/written-submit?submissionId=${activeSubmission.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to delete');
              setExistingSubmission(null);
              setUploadedSubmission(null);
              setSelectedImageUri(null);
              setShowTeacherAnswer(false);
              setSelfMarkResult(null);
              setSelfMarked(false);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setDeleting(false);
            }
          }
        },
      ]
    );
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentStatus = activeSubmission?.status || 'none';
  const isTimeLow = solveTimeLeft <= 120 && !activeSubmission;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#64748b" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          {!activeSubmission && (
            <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${isTimeLow ? 'bg-red-50 border-red-200' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <Clock size={14} color={isTimeLow ? '#dc2626' : '#64748b'} />
              <Text className={`font-bold text-sm ${isTimeLow ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                {formatTime(solveTimeLeft)}
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-1 bg-violet-600 px-3 py-1.5 rounded-full">
            <Zap size={12} color="#fff" fill="#fff" />
            <Text className="text-white font-bold text-xs">{question.points || 0} pts · Written</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── Question Card ── */}
        <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 mb-4 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <View className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full -mr-10 -mt-10" />

          {/* Meta tags */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {question.class_grade && (
              <View className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">Class {question.class_grade}</Text>
              </View>
            )}
            {question.subject && (
              <View className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">{question.subject}</Text>
              </View>
            )}
            {question.difficulty && (
              <View className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{question.difficulty}</Text>
              </View>
            )}
          </View>

          <Text className="text-xl font-black text-slate-900 dark:text-slate-100 mb-3 leading-snug">{question.title}</Text>
          {question.body && (
            <Text className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">{question.body}</Text>
          )}

          {/* Question image */}
          {questionImageUrl && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setViewerImageUri(questionImageUrl)}
              className="mb-4 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 items-center justify-center"
            >
              <Image
                source={{ uri: questionImageUrl }}
                style={{ width: '100%', height: 200 }}
                resizeMode="contain"
                onError={(e) => console.warn('[WrittenSolveClient] Question image load error:', e.nativeEvent.error, questionImageUrl)}
              />
            </TouchableOpacity>
          )}

          {/* Rules */}
          <View className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4 flex-row gap-3">
            <Info size={18} color="#7c3aed" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="font-bold text-violet-800 dark:text-violet-300 mb-2">How written answers work:</Text>
              {[
                'Solve on paper, take a clear photo',
                'Upload within the time limit',
                'Compare with teacher\'s model answer',
                'Tap "I Got It Right" to earn points instantly',
                'Community members will verify your answer',
                'False claims = point loss + 3 extra penalty points',
              ].map((step, i) => (
                <Text key={i} className="text-violet-700 dark:text-violet-400 text-sm mb-0.5">{i + 1}. {step}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* ── Upload Section (before submission) ── */}
        {!activeSubmission && (
          <View className="space-y-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 text-center mb-3">
              Write your answer on paper, then snap a photo!
            </Text>

            {selectedImageUri ? (
              <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <Image source={{ uri: selectedImageUri }} style={{ width: '100%', height: 260 }} resizeMode="contain" />
                <View className="p-4 flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setSelectedImageUri(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
                  >
                    <Text className="font-bold text-slate-600 dark:text-slate-300">Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpload}
                    disabled={uploading}
                    className="flex-1 py-3 bg-indigo-600 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="font-bold text-white">Upload Answer</Text>}
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
                  <Text className="text-xs text-slate-400 mt-1">Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handlePickImage(false)}
                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 items-center justify-center"
                >
                  <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-3">
                    <ImageIcon size={24} color="#4f46e5" />
                  </View>
                  <Text className="font-bold text-slate-700 dark:text-slate-300">Upload Gallery</Text>
                  <Text className="text-xs text-slate-400 mt-1">Photo Library</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── After submission ── */}
        {activeSubmission && (
          <View className="space-y-4">
            <StatusBanner status={currentStatus} />

            {/* Your answer */}
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <Text className="font-bold text-slate-400 mb-2 uppercase text-xs tracking-widest">Your Uploaded Answer</Text>
              {activeSubmission.submission_url ? (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerImageUri(activeSubmission.submission_url)}>
                  <Image
                    source={{ uri: activeSubmission.submission_url }}
                    style={{ width: '100%', height: 220 }}
                    className="rounded-xl bg-slate-100"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <View className="h-32 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <Text className="text-slate-400">Image not available</Text>
                </View>
              )}
            </View>

            {/* Teacher's model answer */}
            {showTeacherAnswer ? (
              <View className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800/30">
                <Text className="font-bold text-indigo-500 mb-2 uppercase text-xs tracking-widest">Teacher's Model Answer</Text>
                {loadingTeacherAnswer ? (
                  <View className="h-32 items-center justify-center">
                    <ActivityIndicator color="#6366f1" />
                    <Text className="text-slate-400 mt-2 text-sm">Loading model answer...</Text>
                  </View>
                ) : teacherSolutionUrl ? (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerImageUri(teacherSolutionUrl)}>
                    <Image
                      source={{ uri: teacherSolutionUrl }}
                      style={{ width: '100%', height: 220 }}
                      className="rounded-xl bg-white"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ) : (
                  <View className="h-24 items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl">
                    <Text className="text-slate-500 italic text-center px-4">No model answer provided by teacher yet.</Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowTeacherAnswer(true)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 items-center shadow-sm"
              >
                <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-base">👁 Reveal Teacher's Model Answer</Text>
                <Text className="text-slate-400 text-xs mt-1">Tap to compare with your answer</Text>
              </TouchableOpacity>
            )}

            {/* ── Self-mark form (status=pending, not yet marked) ── */}
            {currentStatus === 'pending' && !selfMarked && (
              <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                <Text className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">Did you get it right?</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Compare honestly with the model answer above. Claim your{' '}
                  <Text className="font-black text-violet-600 dark:text-violet-400">{question.points} points</Text>{' '}
                  if you're correct.
                </Text>

                <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex-row gap-3 mb-5">
                  <AlertTriangle size={16} color="#d97706" style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-sm text-amber-800 dark:text-amber-300">
                    <Text className="font-bold">Warning: </Text>
                    The community will review your claim. If 2 peers flag it as wrong, an AI Verifier checks it.
                    False claims = {question.points} pts lost + 3 extra penalty points.
                  </Text>
                </View>

                {/* ✅ I Got It RIGHT */}
                <TouchableOpacity
                  onPress={handleSelfMarkCorrect}
                  disabled={submitting || deleting}
                  className="w-full bg-emerald-600 flex-row justify-center items-center py-4 rounded-2xl mb-3 gap-2"
                  style={{ opacity: (submitting || deleting) ? 0.6 : 1 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <ThumbsUp size={18} color="#fff" />
                      <Text className="text-white font-bold text-base">I Got It Right — Claim {question.points} Points</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* ❌ I Got It WRONG */}
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={submitting || deleting}
                  className="w-full bg-slate-100 dark:bg-slate-800 flex-row justify-center items-center py-4 rounded-2xl mb-3 gap-2"
                  style={{ opacity: (submitting || deleting) ? 0.6 : 1 }}
                >
                  {deleting ? (
                    <ActivityIndicator color="#64748b" size="small" />
                  ) : (
                    <>
                      <XCircle size={18} color="#64748b" />
                      <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">I Got It Wrong — Try Again</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text className="text-xs text-center text-slate-400 px-4">
                  "I Got It Wrong" discards this upload so you can try again alone.
                </Text>
              </View>
            )}

            {/* ── Points awarded confirmation ── */}
            {(selfMarked || (activeSubmission.self_marked_correct && currentStatus === 'pending_check')) && (
              <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                <View className="flex-row items-center gap-4 mb-4">
                  <View className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl items-center justify-center">
                    <CheckCircle2 size={28} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-black text-slate-900 dark:text-slate-100">Points Awarded!</Text>
                    <Text className="text-slate-500 text-sm">
                      +{selfMarkResult?.pointsAwarded ?? activeSubmission.points_awarded} pts added provisionally
                    </Text>
                  </View>
                </View>

                <View className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Shield size={14} color="#7c3aed" />
                    <Text className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Community Verification Active</Text>
                  </View>
                  <Text className="text-slate-500 text-xs">Your peers are verifying your answer right now.</Text>
                </View>

                {selfMarkResult?.newTotal !== undefined && (
                  <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 flex-row items-center justify-between mb-4">
                    <Text className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">Your total points</Text>
                    <Text className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selfMarkResult.newTotal}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => router.replace('/')}
                  className="w-full bg-slate-900 dark:bg-slate-100 py-4 rounded-2xl items-center"
                >
                  <Text className="text-white dark:text-slate-900 font-bold">Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── AI confirmed wrong ── */}
            {currentStatus === 'ai_confirmed_wrong' && (
              <View className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/50 p-6 items-center">
                <XCircle size={48} color="#dc2626" />
                <Text className="text-xl font-black text-red-700 dark:text-red-300 mt-3 mb-2">Answer Confirmed Incorrect</Text>
                <Text className="text-red-600 dark:text-red-400 text-sm text-center mb-4">
                  Points + {question.points >= 15 ? '3-point penalty' : 'penalty'} have been deducted.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/')}
                  className="bg-slate-900 dark:bg-slate-100 px-8 py-3 rounded-xl"
                >
                  <Text className="text-white dark:text-slate-900 font-bold">Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Auto approved / AI confirmed correct ── */}
            {(currentStatus === 'auto_approved' || currentStatus === 'ai_confirmed_correct') && (
              <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-6 items-center">
                <CheckCircle2 size={48} color="#059669" />
                <Text className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-3 mb-2">
                  {currentStatus === 'auto_approved' ? 'Auto-Approved! ✓' : 'Verified by AI! ✓'}
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-sm text-center mb-4">
                  {currentStatus === 'auto_approved'
                    ? 'Two peers marked your answer correct. Points permanently secured!'
                    : 'AI verified your answer is absolutely correct. Well done!'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/')}
                  className="bg-emerald-600 px-8 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <ImageViewerModal 
        visible={!!viewerImageUri} 
        imageUri={viewerImageUri} 
        onClose={() => setViewerImageUri(null)} 
      />
    </View>
  );
}
