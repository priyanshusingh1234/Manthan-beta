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
  StyleSheet,
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
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta.vercel.app';
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
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta.vercel.app';
      
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

  const renderAvatar = (opp: UserType, size = 40) => {
    if (opp.avatar) {
      return (
        <Image
          source={{ uri: opp.avatar }}
          alt={opp.name}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="border border-slate-200 dark:border-slate-800"
        />
      );
    }
    const initials = opp.name.substring(0, 1).toUpperCase();
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-orange-100 dark:bg-orange-950/50 items-center justify-center border border-orange-200 dark:border-orange-900/50"
      >
        <Text className="text-orange-600 dark:text-orange-400 font-extrabold text-sm">{initials}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-slate-900/60 dark:bg-slate-950/75">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full bg-white dark:bg-slate-950 rounded-t-[2.5rem] overflow-hidden"
          style={{ maxHeight: '90%', paddingBottom: Math.max(insets.bottom, 20) }}
        >
          {/* Header Strip with Gradients */}
          <View className="bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 p-6 relative">
            {/* Top Indicator */}
            <View className="w-12 h-1 bg-white/30 rounded-full self-center mb-4" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                {step === 2 && (
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    className="p-1.5 rounded-full bg-white/20 mr-1"
                  >
                    <ArrowLeft size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
                  {step === 1 ? (
                    <Swords size={20} color="#fff" />
                  ) : (
                    <MessageSquare size={20} color="#fff" />
                  )}
                </View>
                <View>
                  <Text className="text-base font-black text-white">
                    {step === 1 ? 'Challenge a Friend' : 'Send your taunt'}
                  </Text>
                  <Text className="text-[11px] text-white/80">
                    {step === 1
                      ? 'Pick an opponent to duel'
                      : `Dueling ${selectedOpponent?.name?.split(' ')[0]} — 24h expiry`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 bg-white/20 rounded-full"
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {questionTitle && (
              <View className="mt-4 bg-white/10 rounded-xl px-3 py-2 flex-row items-center gap-2">
                <Flame size={14} color="#ffedd5" />
                <Text className="text-xs font-semibold text-orange-50 flex-1" numberOfLines={1}>
                  {questionTitle}
                </Text>
              </View>
            )}

            <View className="flex-row gap-2 mt-4">
              <View className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
              <View className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            </View>
          </View>

          {/* Modal Content */}
          <View className="p-5 bg-white dark:bg-slate-950">
            {step === 1 ? (
              <View className="space-y-4">
                {/* Search Input */}
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm mb-4">
                  <Search size={18} color={isDark ? '#94a3b8' : '#64748b'} className="mr-3" />
                  <TextInput
                    placeholder="Search by name or @username..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 text-sm text-slate-950 dark:text-slate-50 font-medium"
                    autoFocus
                  />
                  {loading && <ActivityIndicator size="small" color="#f97316" />}
                </View>

                {/* Results Area */}
                {searchQuery.trim().length < 2 ? (
                  <View className="items-center justify-center py-12 gap-3">
                    <View className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 items-center justify-center">
                      <Swords size={26} color={isDark ? '#ea580c' : '#fdba74'} />
                    </View>
                    <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Search for an opponent
                    </Text>
                    <Text className="text-xs text-slate-400 text-center">
                      They'll receive a notification and have 24 hours to respond.
                    </Text>
                  </View>
                ) : results.length === 0 && !loading ? (
                  <View className="items-center justify-center py-12">
                    <Text className="text-sm font-medium text-slate-400">
                      No students found for "{searchQuery}"
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    className="h-64"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedOpponent(item);
                          setStep(2);
                        }}
                        className="flex-row items-center justify-between p-3 rounded-2xl border border-transparent active:border-orange-100 dark:active:border-orange-900/30 active:bg-orange-50/50 dark:active:bg-orange-950/20 mb-2"
                      >
                        <View className="flex-row items-center gap-3">
                          {renderAvatar(item)}
                          <View>
                            <Text className="font-bold text-slate-950 dark:text-slate-50 text-sm">
                              {item.name}
                            </Text>
                            <Text className="text-xs text-slate-400">@{item.username}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900/30">
                          <Swords size={12} color="#ea580c" />
                          <Text className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                            Duel
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            ) : (
              // Step 2: Taunt Screen
              selectedOpponent && (
                <View className="space-y-5">
                  {/* Selected Card */}
                  <View className="flex-row items-center gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                    {renderAvatar(selectedOpponent)}
                    <View className="flex-1">
                      <Text className="font-black text-slate-950 dark:text-slate-50 text-sm">
                        {selectedOpponent.name}
                      </Text>
                      <Text className="text-xs text-slate-400">@{selectedOpponent.username}</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900/40">
                      <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                        24h challenge
                      </Text>
                    </View>
                  </View>

                  {/* Quick Taunts */}
                  <View>
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Sparkles size={14} color="#ea580c" />
                      <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Quick taunts
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {QUICK_TAUNTS.map((t) => {
                        const isSelected = taunt === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            onPress={() => setTaunt(t)}
                            className={`px-3 py-1.5 rounded-full border ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
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

                  {/* Write Taunt */}
                  <View>
                    <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Write your own taunt
                    </Text>
                    <TextInput
                      value={taunt}
                      onChangeText={setTaunt}
                      maxLength={120}
                      multiline
                      numberOfLines={3}
                      placeholder="Optional smack talk..."
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-950 dark:text-slate-50 font-medium"
                      style={{ textAlignVertical: 'top', height: 80 }}
                    />
                    <Text className="text-right text-[10px] text-slate-400 mt-1">
                      {taunt.length}/120
                    </Text>
                  </View>

                  {error ? (
                    <Text className="text-xs text-red-500 font-semibold text-center">{error}</Text>
                  ) : null}

                  {/* CTA button */}
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={sending || sent}
                    className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                      sent
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-orange-500 to-rose-500 bg-orange-600'
                    }`}
                  >
                    {sending ? (
                      <>
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white font-black text-base uppercase tracking-wider ml-2">
                          Sending...
                        </Text>
                      </>
                    ) : sent ? (
                      <>
                        <CheckCircle2 size={18} color="#fff" />
                        <Text className="text-white font-black text-base uppercase tracking-wider ml-1">
                          Duel Sent! ⚔️
                        </Text>
                      </>
                    ) : (
                      <>
                        <Send size={16} color="#fff" />
                        <Text className="text-white font-black text-base uppercase tracking-wider ml-1">
                          Send Duel Challenge
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text className="text-center text-[10px] text-slate-400 mb-4">
                    Challenges are live for 24h. You will be notified when they accept.
                  </Text>
                </View>
              )
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
