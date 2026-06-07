import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, MessageSquare, Loader2, Check, CheckCheck, MessageCirclePlus } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import BadgedName from '@/components/BadgedName';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  status?: string;
  participant: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
    is_teacher?: boolean;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
    message_type?: string;
  };
}

function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  } catch {
    return '';
  }
}

function formatPreview(content: string, type?: string) {
  let text = content;
  if (text.includes('|||META|||')) {
    text = text.split('|||META|||')[0];
  }
  
  if (type === 'image' || type === 'image_once' || text.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i)) return '📷 Photo';
  if (text.startsWith('__CALL_ENDED__')) {
    const isDeclined = text.includes('declined') || text.includes('Declined');
    return isDeclined ? '📞 Call declined' : '📞 Call ended';
  }
  if (text.startsWith('__CALL_STARTED__')) {
    const callType = text.split(':')[1] || 'voice';
    return callType === 'video' ? '📹 Video call started' : '📞 Voice call started';
  }
  if (text.startsWith('> Replying to **')) {
    const parts = text.split('\n\n');
    const replyText = parts.slice(1).join(' ').trim();
    return replyText ? `↩ ${replyText}` : 'Replied to a message';
  }
  return text;
}

export default function ChatListPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchRooms = useCallback(async (userId: string) => {
    try {
      // 1. Get participant entries for this user
      const { data: participants, error } = await supabase
        .from('chat_participants')
        .select(`room_id, chat_rooms(id, name, is_group, updated_at, status, created_by)`)
        .eq('user_id', userId);

      if (error) throw error;
      const validRooms = (participants || []).filter(p => p.chat_rooms != null);
      if (!validRooms.length) {
        setRooms([]);
        return;
      }

      const roomIds = validRooms.map(p => p.room_id);
      
      // 2. Fetch other participants in these rooms
      const { data: otherPs } = await supabase
        .from('chat_participants')
        .select('room_id, user_id')
        .in('room_id', roomIds)
        .neq('user_id', userId);

      const otherUids = [...new Set((otherPs || []).map(p => p.user_id))];

      // 3. Fetch profiles of other participants
      let profileMap = new Map<string, any>();
      if (otherUids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_teacher')
          .in('id', otherUids);
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      // 4. Fetch last messages in these rooms
      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_id, is_read, message_type, room_id')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });

      const lastMsgMap = new Map<string, any>();
      (allMessages || []).forEach(m => {
        if (!lastMsgMap.has(m.room_id)) lastMsgMap.set(m.room_id, m);
      });

      // 5. Get blocked users list from auth metadata
      const rawBlocked = user?.user_metadata?.blockedUserIds || user?.user_metadata?.blockedUsers || user?.user_metadata?.blocked_ids || [];
      const blockedIds = new Set<string>(Array.isArray(rawBlocked) ? rawBlocked.map(String) : []);

      // 6. Build room models
      const roomData: ChatRoom[] = validRooms.map(p => {
        const room = p.chat_rooms as any;
        const otherUid = otherPs?.find(op => op.room_id === room.id)?.user_id;
        const prof = otherUid ? profileMap.get(otherUid) : null;
        return {
          id: room.id,
          name: room.name,
          is_group: room.is_group,
          status: room.status,
          participant: {
            user_id: otherUid || '',
            full_name: prof?.full_name || 'Scholar',
            avatar_url: prof?.avatar_url || null,
            username: prof?.username || 'scholar',
            is_teacher: !!prof?.is_teacher
          },
          last_message: lastMsgMap.get(room.id)
        };
      }).filter(r => !blockedIds.has(r.participant.user_id));

      // Sort rooms by last message timestamp
      roomData.sort((a, b) => {
        const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
        const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setRooms(roomData);
    } catch (err) {
      console.error('[FetchRooms Error]', err);
    }
  }, [user]);

  const init = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchRooms(user.id);

      // Setup realtime listener
      const channelName = `chat-list-${user.id}-${Date.now()}`;
      const channel = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchRooms(user.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` }, () => fetchRooms(user.id))
        .subscribe();

      const interval = setInterval(() => fetchRooms(user.id), 45000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user?.id, fetchRooms]);

  // Global user search
  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_teacher')
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .neq('id', user.id)
          .limit(10);
        setSearchResults(profiles || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  const startChat = async (targetUserId: string, targetName: string, targetAvatar: string | null) => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: roomId, error } = await supabase.rpc('create_chat_room', {
        target_user_id: targetUserId,
        current_user_id: user.id
      });
      if (error) throw error;

      setSearchQuery('');
      router.push({
        pathname: '/chat/[roomId]',
        params: { roomId, name: targetName, avatar: targetAvatar || '' }
      } as any);
    } catch (err: any) {
      alert('Failed to start chat: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (user?.id) {
      fetchRooms(user.id).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    return rooms.filter(r =>
      r.participant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.participant.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery]);

  const pendingRooms = useMemo(() => filteredRooms.filter(r => r.status === 'pending'), [filteredRooms]);
  const approvedRooms = useMemo(() => filteredRooms.filter(r => r.status !== 'pending'), [filteredRooms]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Custom Top Header */}
      <View className="px-4 pt-3 pb-4 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Messages</Text>
          <TouchableOpacity className="h-9 w-9 bg-indigo-600 rounded-full items-center justify-center shadow-md active:scale-95">
            <MessageCirclePlus size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View className="relative flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-transparent focus:border-indigo-400/50">
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search or start a new chat..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium py-1"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} tintColor="#4f46e5" />
        }
      >
        {/* Search Results Drawer */}
        {searchQuery ? (
          isSearching ? (
            <View className="flex-row justify-center py-12">
              <ActivityIndicator color="#4f46e5" />
            </View>
          ) : searchResults.length > 0 ? (
            <View>
              <View className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20">
                <Text className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Global Results</Text>
              </View>
              {searchResults.map(res => (
                <TouchableOpacity
                  key={res.id}
                  onPress={() => startChat(res.id, res.full_name, res.avatar_url)}
                  className="flex-row items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800/60"
                >
                  <View className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden items-center justify-center shrink-0">
                    {res.avatar_url ? (
                      <Image source={{ uri: res.avatar_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                        {(res.full_name || 'S')[0].toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <BadgedName
                      name={res.full_name}
                      isTeacher={!!res.is_teacher}
                      nameClassName="font-bold text-[15px] text-slate-900 dark:text-white"
                    />
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>@{res.username}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20 px-8">
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">No scholars found</Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">Try typing a different name or username.</Text>
            </View>
          )
        ) : (
          /* Normal Chats List */
          <View>
            {rooms.length === 0 ? (
              <View className="flex-1 items-center justify-center py-24 px-8">
                <View className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center mb-5">
                  <MessageSquare size={32} color="#4f46e5" />
                </View>
                <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">No conversations yet</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center">Search for a scholar above to start chatting.</Text>
              </View>
            ) : (
              <View>
                {/* Message Requests tab */}
                {pendingRooms.length > 0 && (
                  <View className="mb-4">
                    <View className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20">
                      <Text className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Message Requests</Text>
                    </View>
                    {pendingRooms.map(room => (
                      <ChatCard key={room.id} room={room} user={user} onPress={() => router.push({
                        pathname: '/chat/[roomId]',
                        params: { roomId: room.id, name: room.participant.full_name, avatar: room.participant.avatar_url || '' }
                      } as any)} />
                    ))}
                  </View>
                )}

                {/* Recent Chats tab */}
                {approvedRooms.length > 0 && (
                  <View>
                    <View className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/30">
                      <Text className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Recent Chats</Text>
                    </View>
                    {approvedRooms.map(room => (
                      <ChatCard key={room.id} room={room} user={user} onPress={() => router.push({
                        pathname: '/chat/[roomId]',
                        params: { roomId: room.id, name: room.participant.full_name, avatar: room.participant.avatar_url || '' }
                      } as any)} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ChatCard({ room, onPress, user }: { room: ChatRoom; onPress: () => void; user: any }) {
  const isUnread = room.last_message && !room.last_message.is_read && room.last_message.sender_id !== user?.id;
  const timeLabel = room.last_message ? formatTimeAgo(room.last_message.created_at) : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-full flex-row items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800/60"
    >
      {/* Avatar */}
      <View className="relative shrink-0">
        <View className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden items-center justify-center">
          {room.participant.avatar_url ? (
            <Image source={{ uri: room.participant.avatar_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
              {room.participant.full_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          )}
        </View>
      </View>

      {/* Preview Info */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between mb-0.5">
          <BadgedName
            name={room.participant.full_name}
            isTeacher={room.participant.is_teacher}
            nameClassName={`text-[15px] truncate pr-2 ${
              isUnread ? 'font-extrabold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'
            }`}
            containerClassName="flex-row items-center gap-1 flex-1 min-w-0 pr-2"
          />
          <Text className={`text-[11px] font-bold ${isUnread ? 'text-indigo-500' : 'text-slate-400'}`}>
            {timeLabel}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-2 mt-0.5">
          <Text
            className={`text-[13px] flex-1 ${
              isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
            }`}
            numberOfLines={1}
          >
            {room.last_message ? formatPreview(room.last_message.content, room.last_message.message_type) : 'Tap to start chatting'}
          </Text>
          <View className="flex-row items-center gap-1.5 shrink-0">
            {room.last_message && room.last_message.sender_id === user?.id && (
              <View className="flex-row items-center gap-0.5">
                {room.last_message.is_read ? (
                  <CheckCheck size={14} color="#6366f1" strokeWidth={2.5} />
                ) : (
                  <Check size={14} color="#94a3b8" strokeWidth={2.5} />
                )}
                <Text className={`text-[9px] font-black uppercase tracking-wider ${room.last_message.is_read ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {room.last_message.is_read ? 'Seen' : 'Sent'}
                </Text>
              </View>
            )}
            {isUnread && <View className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
