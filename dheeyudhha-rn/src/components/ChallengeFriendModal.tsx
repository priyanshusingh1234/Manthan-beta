import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, FlatList, Image, Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { X, Search, Users, Trophy } from 'lucide-react-native';

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
}

interface ChallengeFriendModalProps {
  visible: boolean;
  onClose: () => void;
  questionId: string;
  currentUserId: string;
}

export default function ChallengeFriendModal({ visible, onClose, questionId, currentUserId }: ChallengeFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      searchUsers('');
    } else {
      setSearchQuery('');
      setUsers([]);
    }
  }, [visible]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        searchUsers(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      let reqUrl = '';
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      if (query.trim() === '') {
        // If empty, let's just fetch random users or followers. For now, fetch top users from supabase directly as a fallback
        const { data, error } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .neq('id', currentUserId)
          .limit(10);
        if (data) setUsers(data);
      } else {
        const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query.trim())}&exclude=${currentUserId}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async (partnerId: string) => {
    setSendingTo(partnerId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

      const res = await fetch(`${API_URL}/api/coop/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questionId,
          partnerId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        Alert.alert('Error', errorData.error || 'Failed to send request');
      } else {
        Alert.alert('Success', 'Help request sent! If they solve it, you both get points.');
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Full Screen Header */}
        <View 
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 pb-6 relative shadow-lg"
          style={{ paddingTop: 60 }}
        >
          {/* Header Controls */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-10 h-10" /> 
            
            <View className="flex-row items-center gap-2">
              <Users size={22} color="#fff" />
              <Text className="text-xl font-black text-white tracking-widest uppercase">
                CO-OP RECOVERY
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-2.5 bg-white/20 rounded-full backdrop-blur-md"
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-center text-indigo-100 mt-2 font-medium">Tag a friend to help you solve this and split the points!</Text>
        </View>

        {/* Content Area */}
        <View className="flex-1 px-4 pt-4">
          {/* Search */}
          <View className="mb-4">
            <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
              <Search size={20} className="text-slate-400 dark:text-slate-500" />
              <TextInput
                className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                placeholder="Search friends..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* List */}
          <FlatList
            data={users}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={() => (
              <View className="py-10 items-center justify-center">
                {loading ? (
                  <ActivityIndicator color="#4f46e5" />
                ) : (
                  <Text className="text-slate-500 dark:text-slate-400">No users found</Text>
                )}
              </View>
            )}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-3 border border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center flex-1">
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} className="w-12 h-12 rounded-full mr-3" />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3">
                      <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        {item.name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 pr-2">
                    <Text className="font-bold text-slate-900 dark:text-white text-base" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs" numberOfLines={1}>@{item.username}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleChallenge(item.id)}
                  disabled={sendingTo === item.id}
                  className={`px-4 py-2.5 rounded-xl ${
                    sendingTo === item.id ? 'bg-indigo-400' : 'bg-indigo-600'
                  }`}
                >
                  {sendingTo === item.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-sm">Send Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
