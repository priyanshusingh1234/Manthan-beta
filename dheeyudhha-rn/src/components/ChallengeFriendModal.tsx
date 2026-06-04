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
  Users,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Zap,
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

const QUICK_MESSAGES = [
  "Need your brain on this one 🧠",
  "Let's crush this together 💪",
  "I failed — rescue me! 🆘",
  "Tag! You're it 🎯",
  "Come on, we can win this 🏆",
];

interface ChallengeFriendModalProps {
  visible: boolean;
  onClose: () => void;
  questionId: string;
  currentUserId: string;
}

export default function ChallengeFriendModal({
  visible,
  onClose,
  questionId,
  currentUserId,
}: ChallengeFriendModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFriend, setSelectedFriend] = useState<UserType | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedFriend(null);
      setMessage('');
      setSearchQuery('');
      setResults([]);
      setSent(false);
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== 1) return;
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
  }, [searchQuery, visible, currentUserId, step]);

  const handleSend = async () => {
    if (!selectedFriend || sending) return;
    setSending(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const res = await fetch(`${API_URL}/api/coop/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          questionId,
          partnerId: selectedFriend.id,
          message: message.trim() || undefined,
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
        setError(d.error || 'Failed to send request');
      }
    } catch (err) {
      setError('Error connecting to co-op service');
    } finally {
      setSending(false);
    }
  };

  const renderAvatar = (user: UserType, size = 48) => {
    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          alt={user.name}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="border-2 border-white dark:border-slate-800 shadow-sm"
        />
      );
    }
    const initials = user.name.substring(0, 1).toUpperCase();
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-gradient-to-br from-indigo-400 to-purple-500 items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm"
      >
        <Text className="text-white font-black text-lg">{initials}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
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
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 pb-6 relative shadow-lg"
          style={{ paddingTop: Math.max(insets.top, 20) }}
        >
          {/* Header Controls */}
          <View className="flex-row items-center justify-between mb-2">
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
              {step === 1 ? <Users size={22} color="#fff" /> : <MessageSquare size={22} color="#fff" />}
              <Text className="text-xl font-black text-white tracking-widest uppercase">
                {step === 1 ? 'ASK FOR HELP' : 'COMPOSE MESSAGE'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-2.5 bg-white/20 rounded-full backdrop-blur-md"
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-center text-indigo-100 mt-2 font-medium">
            {step === 1 ? 'Pick a friend to help you solve this' : `Sending to ${selectedFriend?.name?.split(' ')[0]}`}
          </Text>
        </View>

        {/* Content Area */}
        <View className="flex-1 px-6 pt-6">
          {step === 1 ? (
            <View className="flex-1">
              <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Choose Partner
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 mb-6">
                Search for a friend to help you. If they get it right, you both split the points!
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
                {loading && <ActivityIndicator size="small" color="#6366f1" />}
              </View>

              {/* Results */}
              {searchQuery.trim().length < 2 ? (
                <View className="flex-1 items-center justify-center pb-20 opacity-50">
                  <Users size={48} color={isDark ? '#334155' : '#cbd5e1'} className="mb-4" />
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
                        setSelectedFriend(item);
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
                      <View className="px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex-row items-center gap-1">
                        <Users size={16} color="#4f46e5" />
                        <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">ASK</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          ) : (
            // Step 2: Message Screen
            selectedFriend && (
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
              >
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Send a Request
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-6">
                  Add a personal note so they know exactly what you need help with.
                </Text>

                {/* Selected Friend Card */}
                <View className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 items-center flex-row gap-4">
                  <View>
                    {renderAvatar(selectedFriend, 64)}
                  </View>
                  <View className="flex-1">
                    <Text className="font-black text-slate-900 dark:text-white text-xl mb-1">
                      {selectedFriend.name}
                    </Text>
                    <Text className="text-slate-400 font-medium text-base">
                      @{selectedFriend.username}
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
                    <Zap size={18} color="#4f46e5" />
                  </View>
                </View>

                {/* Quick Messages */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Sparkles size={18} color="#8b5cf6" />
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Quick Messages
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {QUICK_MESSAGES.map((q) => {
                      const isSelected = message === q;
                      return (
                        <TouchableOpacity
                          key={q}
                          onPress={() => setMessage(q)}
                          className={`px-4 py-2.5 rounded-full border-2 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/30'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <Text
                            className={`text-sm font-bold ${
                              isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {q}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Message Input Area */}
                <View className="mb-8">
                  <View className="flex-row items-center gap-2 mb-3">
                    <MessageSquare size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Or write your own
                    </Text>
                  </View>
                  
                  <View className="relative">
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      maxLength={160}
                      multiline
                      numberOfLines={3}
                      placeholder="Add a personal note to your help request..."
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-3xl p-5 text-base text-slate-900 dark:text-slate-50 font-medium min-h-[100px]"
                      style={{ textAlignVertical: 'top' }}
                    />
                    <Text className="absolute bottom-4 right-5 text-xs font-bold text-slate-400">
                      {message.length}/160
                    </Text>
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
                      : 'bg-indigo-600 shadow-indigo-600/30'
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
                        Request Sent!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Send size={20} color="#fff" />
                      <Text className="text-white font-black text-lg uppercase tracking-widest ml-1">
                        Send Help Request
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
