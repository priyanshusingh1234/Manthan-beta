import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, ChevronRight, X, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { DeviceEventEmitter } from 'react-native';

const { height } = Dimensions.get('window');

const SUBJECTS = [
  { label: 'Maths', value: 'Maths', emoji: '📐', colors: ['#3b82f6', '#4f46e5'] as const },
  { label: 'Science', value: 'Science', emoji: '🔬', colors: ['#22c55e', '#059669'] as const },
  { label: 'English', value: 'English', emoji: '📖', colors: ['#f59e0b', '#ea580c'] as const },
  { label: 'SST', value: 'SST', emoji: '🌍', colors: ['#f43f5e', '#db2777'] as const },
  { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳', colors: ['#0ea5e9', '#2563eb'] as const },
  { label: 'G.K', value: 'G.K', emoji: '🧠', colors: ['#8b5cf6', '#7e22ce'] as const },
];

export default function DailyPlannerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [userName, setUserName] = useState('');
  const [userClass, setUserClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        let grade = meta.classGrade || meta.class;

        const { data: profile } = await supabase.from('profiles').select('class_grade').eq('id', user.id).single();
        if (profile?.class_grade) {
          grade = profile.class_grade;
        }

        setUserName(meta.fullName || meta.name || 'Student');
        setUserClass(grade || '10');

        const lastPlanDate = await AsyncStorage.getItem('dheeyudhha_daily_plan_date');
        const now = new Date().getTime();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (!lastPlanDate || (now - parseInt(lastPlanDate, 10)) > ONE_DAY) {
          setIsOpen(true);
        }
      }
    };

    initUser();

    const openListener = DeviceEventEmitter.addListener('open_daily_planner', () => {
      setStep(1);
      setIsOpen(true);
    });

    return () => {
      openListener.remove();
    };
  }, []);

  const fetchChapters = async (subject: string) => {
    setLoadingChapters(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/questions?subject=${subject}&class=${userClass}&limit=1000`);
      if (res.ok) {
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : (raw?.questions || []);

        const uniqueChapters = new Set<string>();
        items.forEach((q: any) => {
          if (q.chapter && q.chapter.trim()) {
            uniqueChapters.add(q.chapter.trim());
          }
        });

        let chapterList = Array.from(uniqueChapters);
        chapterList = chapterList.sort((a, b) => a.localeCompare(b));
        setChapters(chapterList);
      }
    } catch (err) {
      console.error(err);
      setChapters(["Chapter 1", "Chapter 2", "Chapter 3", "Mixed Practice"]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    fetchChapters(subject);
    setStep(2);
  };

  const handleChapterSelect = async (chapter: string) => {
    await AsyncStorage.setItem('dheeyudhha_daily_plan_date', new Date().getTime().toString());
    await AsyncStorage.setItem('dheeyudhha_feed_subject', selectedSubject);
    await AsyncStorage.setItem('dheeyudhha_feed_chapter', chapter);

    setIsOpen(false);
    
    // Emit an event so QuestionsFeed can refresh
    DeviceEventEmitter.emit('refresh_feed_filters');
  };

  const dismiss = async () => {
    await AsyncStorage.setItem('dheeyudhha_daily_plan_date', new Date().getTime().toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Modal visible={true} transparent={true} animationType="slide" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#4f46e5', '#7c3aed', '#6d28d9']} style={styles.header}>
            <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
              <X size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.iconWrapper}>
              <Sparkles size={40} color="#fde047" />
            </View>

            <Text style={styles.title}>Hii {userName}! 👋</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? `Welcome back! What are you planning to study today from Class ${userClass}?` 
                : `Great choice! Which chapter in ${selectedSubject}?`}
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            {step === 1 && (
              <View style={styles.grid}>
                {SUBJECTS.map((sub) => (
                  <TouchableOpacity 
                    key={sub.value} 
                    activeOpacity={0.8} 
                    onPress={() => handleSubjectSelect(sub.value)} 
                    style={styles.subjectCard}
                  >
                    <LinearGradient colors={sub.colors} style={styles.emojiCircle}>
                      <Text style={styles.emojiText}>{sub.emoji}</Text>
                    </LinearGradient>
                    <Text style={styles.subjectLabel}>{sub.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 2 && (
              <View style={styles.step2Container}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back to Subjects</Text>
                </TouchableOpacity>

                {loadingChapters ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.emptyText}>Finding your chapters...</Text>
                  </View>
                ) : chapters.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.iconCircle}>
                      <BookOpen size={24} color="#94a3b8" />
                    </View>
                    <Text style={styles.emptyTitle}>No chapters found</Text>
                    <Text style={styles.emptySubtitle}>Looks like teachers haven't uploaded any questions for this subject in your class yet!</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.chapterList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    {chapters.map((chap, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        activeOpacity={0.8} 
                        onPress={() => handleChapterSelect(chap)} 
                        style={styles.chapterRow}
                      >
                        <View style={styles.chapterLeft}>
                          <View style={styles.chapterIconWrapper}>
                            <BookOpen size={16} color="#4f46e5" />
                          </View>
                          <Text style={styles.chapterText} numberOfLines={2}>{chap}</Text>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.9,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    transform: [{ rotate: '3deg' }],
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emojiText: {
    fontSize: 20,
  },
  subjectLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  step2Container: {
    flex: 1,
    minHeight: 300,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chapterList: {
    maxHeight: 400,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  chapterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  chapterIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chapterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  }
});
