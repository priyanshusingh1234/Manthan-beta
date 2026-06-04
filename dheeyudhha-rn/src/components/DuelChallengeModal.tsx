import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import {
  X,
  Search,
  Send,
  Swords,
  CheckCircle2,
  ArrowLeft,
  Flame,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UserType {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

const QUICK_TAUNTS = [
  'Think you can beat me? 😤',
  'I dare you to try 🔥',
  "Let's settle this! ⚔️",
  'Catch me if you can 💨',
  'Scared? 😈',
];

interface DuelChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionTitle?: string;
  currentUserId: string;
}

export default function DuelChallengeModal({
  isOpen,
  onClose,
  questionId,
  questionTitle,
  currentUserId,
}: DuelChallengeModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedOpponent, setSelectedOpponent] = useState<UserType | null>(null);
  const [taunt, setTaunt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedOpponent(null);
      setTaunt('');
      setSearchQuery('');
      setResults([]);
      setSent(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 1) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const res = await fetch(
          `${API_URL}/api/users/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}&exclude=${currentUserId}`
        );
        if (res.ok) {
          const d = await res.json();
          setResults(d.users || []);
        } else {
          setError('Failed to query users');
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchQuery, isOpen, currentUserId, step]);

  const handleSend = async () => {
    if (!selectedOpponent || sending) return;
    setSending(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const res = await fetch(`${API_URL}/api/duel/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          questionId,
          challengedId: selectedOpponent.id,
          message: taunt.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSent(true);
        setTimeout(() => {
          onClose();
          setSent(false);
        }, 2000);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to send challenge');
      }
    } catch (err) {
      setError('Error connecting to duel service');
    } finally {
      setSending(false);
    }
  };

  const renderAvatar = (opp: UserType, size = 48) => {
    if (opp.avatar) {
      return (
        <Image
          source={{ uri: opp.avatar }}
          alt={opp.name}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="border-2 border-white dark:border-slate-800 shadow-sm"
        />
      );
    }
    const initials = opp.name.substring(0, 1).toUpperCase();
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-gradient-to-br from-orange-400 to-rose-500 items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm"
      >
        <Text className="text-white font-black text-lg">{initials}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-slate-50 dark:bg-slate-950"
      >
        {/* Full Screen Header */}
        <View 
          className="bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 px-6 pb-6 relative shadow-lg"
          style={{ paddingTop: Math.max(insets.top, 20) }}
        >
          {/* Header Controls */}
          <View className="flex-row items-center justify-between mb-6">
            {step === 2 ? (
              <TouchableOpacity
                onPress={() => setStep(1)}
                className="p-2.5 rounded-full bg-white/20 backdrop-blur-md"
              >
                <ArrowLeft size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View className="w-10 h-10" /> 
            )}
            
            <View className="flex-row items-center gap-2">
              <Swords size={22} color="#fff" />
              <Text className="text-xl font-black text-white tracking-widest uppercase">
                {step === 1 ? 'DUEL ARENA' : 'TAUNT'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-2.5 bg-white/20 rounded-full backdrop-blur-md"
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Question Preview */}
          {questionTitle && (
            <View className="bg-black/20 rounded-2xl p-4 flex-row items-center gap-3 border border-white/10">
              <View className="p-2 bg-orange-500/30 rounded-xl">
                <Flame size={20} color="#ffedd5" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-orange-200 uppercase tracking-widest mb-0.5">
                  Target Question
                </Text>
                <Text className="text-sm font-semibold text-white" numberOfLines={2}>
                  {questionTitle}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Content Area */}
        <View className="flex-1 px-6 pt-6">
          {step === 1 ? (
            <View className="flex-1">
              <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Choose Opponent
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 mb-6">
                Search for a friend to challenge. They will have 24 hours to respond to your duel.
              </Text>

              {/* Search Bar */}
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm mb-6">
                <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} className="mr-3" />
                <TextInput
                  placeholder="Search by name or @username..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-base text-slate-900 dark:text-slate-50 font-medium"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {loading && <ActivityIndicator size="small" color="#f97316" />}
              </View>

              {/* Results */}
              {searchQuery.trim().length < 2 ? (
                <View className="flex-1 items-center justify-center pb-20 opacity-50">
                  <Swords size={48} color={isDark ? '#334155' : '#cbd5e1'} className="mb-4" />
                  <Text className="text-lg font-bold text-slate-400 dark:text-slate-500 text-center">
                    Type a name to begin
                  </Text>
                </View>
              ) : results.length === 0 && !loading ? (
                <View className="flex-1 items-center justify-center pb-20">
                  <Text className="text-lg font-medium text-slate-400">
                    No students found for "{searchQuery}"
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedOpponent(item);
                        setStep(2);
                      }}
                      className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-3 active:scale-95 transition-transform"
                    >
                      <View className="flex-row items-center gap-4">
                        {renderAvatar(item)}
                        <View>
                          <Text className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                            {item.name}
                          </Text>
                          <Text className="text-sm font-medium text-slate-400">
                            @{item.username}
                          </Text>
                        </View>
                      </View>
                      <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
                        <Swords size={18} color="#ea580c" />
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          ) : (
            // Step 2: Taunt Screen
            selectedOpponent && (
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
              >
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Send a Taunt
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-6">
                  Add some flavor to your challenge. Let them know what they're up against!
                </Text>

                {/* Selected Opponent Card */}
                <View className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 items-center">
                  <View className="mb-4">
                    {renderAvatar(selectedOpponent, 80)}
                  </View>
                  <Text className="font-black text-slate-900 dark:text-white text-xl mb-1">
                    {selectedOpponent.name}
                  </Text>
                  <Text className="text-slate-400 font-medium text-base mb-3">
                    @{selectedOpponent.username}
                  </Text>
                  <View className="bg-orange-100 dark:bg-orange-900/30 px-4 py-1.5 rounded-full border border-orange-200 dark:border-orange-800/50">
                    <Text className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                      24 Hour Challenge
                    </Text>
                  </View>
                </View>

                {/* Taunt Input Area */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <MessageSquare size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Your Message
                    </Text>
                  </View>
                  
                  <View className="relative">
                    <TextInput
                      value={taunt}
                      onChangeText={setTaunt}
                      maxLength={120}
                      multiline
                      numberOfLines={4}
                      placeholder="Type your smack talk here..."
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-orange-500 dark:focus:border-orange-500 rounded-3xl p-5 text-base text-slate-900 dark:text-slate-50 font-medium min-h-[120px]"
                      style={{ textAlignVertical: 'top' }}
                    />
                    <Text className="absolute bottom-4 right-5 text-xs font-bold text-slate-400">
                      {taunt.length}/120
                    </Text>
                  </View>
                </View>

                {/* Quick Taunts */}
                <View className="mb-8">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Sparkles size={18} color="#ea580c" />
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Quick Suggestions
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {QUICK_TAUNTS.map((t) => {
                      const isSelected = taunt === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setTaunt(t)}
                          className={`px-4 py-2.5 rounded-full border-2 ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500 shadow-md shadow-orange-500/30'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <Text
                            className={`text-sm font-bold ${
                              isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {error ? (
                  <Text className="text-sm text-red-500 font-bold text-center mb-4">{error}</Text>
                ) : null}

                {/* Send Button */}
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={sending || sent}
                  className={`w-full py-5 rounded-3xl flex-row items-center justify-center gap-3 shadow-lg ${
                    sent
                      ? 'bg-emerald-500 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-orange-500 to-rose-500 bg-orange-500 shadow-orange-500/30'
                  }`}
                >
                  {sending ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white font-black text-lg uppercase tracking-wider ml-1">
                        Sending...
                      </Text>
                    </>
                  ) : sent ? (
                    <>
                      <CheckCircle2 size={24} color="#fff" />
                      <Text className="text-white font-black text-lg uppercase tracking-wider ml-1">
                        Duel Sent!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Send size={20} color="#fff" />
                      <Text className="text-white font-black text-lg uppercase tracking-widest ml-1">
                        Send Challenge
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
