import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Vibration,
  Animated,
  PanResponder,
  Keyboard,
  TouchableWithoutFeedback,
  Clipboard,
  FlatList,
  Linking,
  ImageBackground
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  X,
  Reply,
  Edit2,
  Trash2,
  Copy,
  Ban,
  MessageSquare,
  Phone,
  Video,
  Plus,
  ArrowUp,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import BadgedName from '@/components/BadgedName';
import ShareModal from '../../components/ShareModal';
import LinkPreview from '../../components/LinkPreview';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { setActiveChatRoomId } from '@/lib/pushUtils';
import { useMessageSound } from '@/hooks/useMessageSound';

const WEB_URL = 'https://manthan-beta-c975.vercel.app';
const { width } = Dimensions.get('window');

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'file' | 'image_once';
}

interface Participant {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  username: string;
  is_teacher?: boolean;
}

const BG_MAP: Record<string, any> = {
  doodle: require('../../../assets/images/chat_bg_doodle.jpg'),
  geometric: require('../../../assets/images/chat_bg_geometric.jpg'),
  blur: require('../../../assets/images/chat_bg_blur.jpg'),
};

// ─── Helper for Dates ──────────────────────────────────────────────
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
};

const formatDateBanner = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const getCleanMessageText = (rawText: string) => {
  if (!rawText) return '';
  let text = rawText;
  if (text.includes('|||META|||')) text = text.split('|||META|||')[0];
  if (text.startsWith('> Replying to **')) {
    const splitIndex = text.indexOf('\n\n');
    if (splitIndex !== -1) {
      text = text.substring(splitIndex + 2);
    }
  }
  return text;
};

// ─── Message Item Component ────────────────────────────────────────
const MessageItem = memo(({
  msg,
  user,
  participant,
  onLongPress,
  onReply,
  prevMsg,
  onImageClick,
  isDark
}: any) => {
  const isMe = msg.sender_id === user?.id;
  const msgDate = new Date(msg.created_at);
  const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
  const showDate = !prevDate || msgDate.toDateString() !== prevDate.toDateString();
  const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let rawContent = msg.content;
  let meta: any = {};
  if (rawContent.includes('|||META|||')) {
    const parts = rawContent.split('|||META|||');
    rawContent = parts[0];
    try { meta = JSON.parse(parts[1]); } catch { }
  }

  let replyAuthor = '', replyPreview = '', mainContent = rawContent;
  if (mainContent.startsWith('> Replying to **')) {
    const splitIndex = mainContent.indexOf('\n\n');
    if (splitIndex !== -1) {
      const firstLine = mainContent.substring(0, splitIndex);
      const rest = mainContent.substring(splitIndex + 2);
      const match = firstLine.match(/> Replying to \*\*(.+?)\*\*:\s*"?(.*?)"?$/);
      if (match) {
        replyAuthor = match[1];
        replyPreview = getCleanMessageText(match[2]);
        mainContent = rest;
      }
    }
  }

  // Resolve image URI if it's a bare path
  let imageUri = rawContent;
  if ((msg.message_type === 'image' || msg.message_type === 'image_once' || rawContent.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i)) && !imageUri.startsWith('http') && !imageUri.startsWith('file://') && !imageUri.startsWith('data:')) {
    imageUri = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-images/${imageUri}`;
  }

  const pan = useRef(new Animated.ValueXY()).current;
  const swipeThreshold = 65;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        let dx = gestureState.dx;
        const resistance = (x: number) => (x < 30 ? x : 30 + (x - 30) * 0.4);

        if (!isMe && dx > 0) {
          pan.setValue({ x: Math.min(resistance(dx), 80), y: 0 });
        } else if (isMe && dx < 0) {
          pan.setValue({ x: Math.max(-resistance(Math.abs(dx)), -80), y: 0 });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isMe && gestureState.dx > swipeThreshold) {
          Vibration.vibrate(30);
          onReply(msg);
        } else if (isMe && gestureState.dx < -swipeThreshold) {
          Vibration.vibrate(30);
          onReply(msg);
        }

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          bounciness: 12,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Call message
  if (msg.content.startsWith('__CALL_ENDED__') || msg.content.startsWith('__CALL_STARTED__')) {
    const isStarted = msg.content.startsWith('__CALL_STARTED__');
    const type = msg.content.split(':')[1] || 'voice';
    const text = isStarted ? `${type} call started` : (msg.content.replace('__CALL_ENDED__:', '').trim() || 'Call ended');

    return (
      <View className="w-full mb-1">
        {showDate && (
          <View className="items-center my-3">
            <View className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {formatDateBanner(msgDate)}
              </Text>
            </View>
          </View>
        )}
        <View className="items-center my-2 px-4">
          <View className="bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 flex-row items-center gap-1.5">
            {type === 'video' ? <Video size={12} color={isDark ? '#94a3b8' : '#64748b'} /> : <Phone size={12} color={isDark ? '#94a3b8' : '#64748b'} />}
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold capitalize">{text}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="w-full mb-1">
      {showDate && (
        <View className="items-center my-3">
          <View className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {formatDateBanner(msgDate)}
            </Text>
          </View>
        </View>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[{ transform: pan.getTranslateTransform() }]}
        className={`flex-row items-end px-3 ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        {/* Reply Icons that reveal on swipe */}
        {!isMe && (
          <Animated.View
            style={{
              position: 'absolute',
              left: 10,
              opacity: pan.x.interpolate({ inputRange: [0, 40], outputRange: [0, 1] })
            }}
          >
            <Reply size={20} color="#6366f1" />
          </Animated.View>
        )}

        {isMe && (
          <Animated.View
            style={{
              position: 'absolute',
              right: 10,
              opacity: pan.x.interpolate({ inputRange: [-40, 0], outputRange: [1, 0] })
            }}
          >
            <Reply size={20} color="#6366f1" />
          </Animated.View>
        )}

        {!isMe && (
          <View className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mr-2 mb-0.5 items-center justify-center">
            {participant?.avatar_url ? (
              <Image source={{ uri: participant.avatar_url }} style={{ width: '100%', height: '100%', position: 'absolute' }} contentFit="cover" />
            ) : (
              <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                {participant?.full_name?.[0]?.toUpperCase()}
              </Text>
            )}
          </View>
        )}

        <TouchableWithoutFeedback onLongPress={() => onLongPress(msg)}>
          <View className={`max-w-[76%] ${isMe ? 'items-end' : 'items-start'}`}>
            {replyAuthor ? (
              <View className={`mb-1 px-3 py-1.5 rounded-xl border-l-4 w-full ${isMe ? 'bg-indigo-500/10 border-indigo-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-400'}`}>
                <Text className={`font-bold text-xs ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`} numberOfLines={1}>
                  {replyAuthor}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  {replyPreview}
                </Text>
              </View>
            ) : null}

            <View className={`rounded-[18px] px-0.5 py-0.5 overflow-hidden ${isMe ? 'bg-indigo-600 dark:bg-indigo-500 rounded-br-[4px]' : 'bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-bl-[4px]'
              }`}>
              {msg.message_type === 'image_once' ? (
                <TouchableOpacity
                  className="flex-row items-center gap-2 px-4 py-3"
                  onPress={() => onImageClick(rawContent, msg.message_type, msg.id, isMe)}
                >
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${isMe ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                    <ImageIcon size={16} color={isMe ? '#fff' : '#4f46e5'} />
                  </View>
                  <View>
                    <Text className={`font-bold text-sm ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Photo</Text>
                    <Text className={`text-[10px] font-semibold ${isMe ? 'text-white/80' : 'text-slate-500'}`}>View once</Text>
                  </View>
                </TouchableOpacity>
              ) : msg.message_type === 'image' || rawContent.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ? (
                <TouchableOpacity onPress={() => onImageClick(imageUri, msg.message_type, msg.id, isMe)}>
                  <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} contentFit="cover" />
                  <View className="absolute bottom-1 right-2 flex-row items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full">
                    <Text className="text-[10px] text-white font-medium">{timeStr}</Text>
                    {isMe && (
                      msg.is_read ? <CheckCheck size={12} color="#60a5fa" strokeWidth={2.5} /> : <Check size={12} color="#cbd5e1" strokeWidth={2.5} />
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="px-3.5 py-2.5 min-w-[75px] justify-between">
                  <Text className={`text-[16px] leading-[22px] ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {mainContent}
                    {meta.edited && <Text className={`text-[11px] italic ${isMe ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}> (edited)</Text>}
                  </Text>

                  {(() => {
                    const match = mainContent.match(/https?:\/\/[^\s]+/);
                    const previewUrl = match ? match[0] : null;
                    return previewUrl ? (
                      <LinkPreview url={previewUrl} />
                    ) : null;
                  })()}

                  <View className="flex-row items-center justify-end gap-1 mt-0.5">
                    <Text className={`text-[11px] font-medium ${isMe ? 'text-white/70' : 'text-[#8e8e93]'}`}>
                      {timeStr}
                    </Text>
                    {isMe && (
                      msg.is_read ? (
                        <CheckCheck size={14} color="#34B7F1" strokeWidth={2.5} />
                      ) : (
                        <Check size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                      )
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
});

// ─── Main Chat Room Component ──────────────────────────────────────
export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { roomId: paramRoomId, name: paramName, avatar: paramAvatar } = useLocalSearchParams();
  const roomId = typeof paramRoomId === 'string' ? paramRoomId : '';
  const initialName = typeof paramName === 'string' ? paramName : 'Chat';

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const playMessageSound = useMessageSound();

  // States
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ status: string, created_by: string } | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const MESSAGES_PER_PAGE = 100;

  // Modals
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setActiveChatRoomId(roomId);
    return () => setActiveChatRoomId(null);
  }, [roomId]);

  const syncBlockStatus = useCallback(async (myId: string, partnerId: string) => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, blocked_users')
        .in('id', [myId, partnerId]);

      if (!profiles) return;
      
      const me = profiles.find(p => p.id === myId);
      const partner = profiles.find(p => p.id === partnerId);

      const myBlockedList = Array.isArray(me?.blocked_users) ? me.blocked_users.map(String) : [];
      const theirBlockedList = Array.isArray(partner?.blocked_users) ? partner.blocked_users.map(String) : [];

      setIsBlocked(myBlockedList.includes(partnerId) || theirBlockedList.includes(myId));
    } catch (err) {
      console.warn('Failed to load block status:', err);
    }
  }, []);

  const fetchMessages = useCallback(async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id;

      const currentLength = loadMore ? messages.length : 0;
      const { data: list, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(currentLength, currentLength + MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      const roomDeletedKey = `deleted_for_me_${roomId}`;
      const deletedIdsStr = await AsyncStorage.getItem(roomDeletedKey);
      const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

      const filtered = (list || []).filter(m => !deletedIds.includes(m.id));

      if (list.length < MESSAGES_PER_PAGE) setHasMore(false);

      if (loadMore) {
        setMessages(prev => [...prev, ...filtered]);
      } else {
        setMessages(filtered);
        setLoading(false);
      }

      if (currentUserId && list && !loadMore) {
        const unreadIds = list.filter(m => !m.is_read && m.sender_id !== currentUserId).map(m => m.id);
        if (unreadIds.length > 0) {
          supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds).then();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (loadMore) setLoadingMore(false);
    }
  }, [roomId, user?.id, messages.length]);

  useEffect(() => {
    const initRoom = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;
        setUser(currentUser);

        const { data: pData } = await supabase.from('chat_participants').select('user_id').eq('room_id', roomId).neq('user_id', currentUser.id).maybeSingle();

        if (pData?.user_id) {
          const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url, username, is_teacher').eq('id', pData.user_id).single();
          if (prof) {
            setParticipant({
              user_id: pData.user_id,
              ...prof,
              avatar_url: prof.avatar_url && !prof.avatar_url.includes('googleusercontent.com') ? prof.avatar_url : null
            });
            syncBlockStatus(currentUser.id, pData.user_id);
          }
        }

        const { data: rRes } = await supabase.from('chat_rooms').select('status, created_by, theme').eq('id', roomId).maybeSingle();
        if (rRes) {
          let finalStatus = rRes;
          if (rRes.theme) {
            setSelectedBg(rRes.theme);
            await AsyncStorage.setItem(`chat_bg_${roomId}`, rRes.theme);
          }
          if (rRes.status === 'pending' && pData?.user_id) {
            const { data: followData } = await supabase
              .from('follows')
              .select('follower_id')
              .or(`and(follower_id.eq.${currentUser.id},following_id.eq.${pData.user_id}),and(follower_id.eq.${pData.user_id},following_id.eq.${currentUser.id})`)
              .limit(1);
            if (followData && followData.length > 0) {
              finalStatus.status = 'approved';
              supabase.from('chat_rooms').update({ status: 'approved' }).eq('id', roomId).then();
            }
          }
          setRoomStatus(finalStatus);
        }

        const bgPref = await AsyncStorage.getItem(`chat_bg_${roomId}`);
        if (bgPref) setSelectedBg(bgPref);

        await fetchMessages();
      } catch (e) {
        console.error('Failed to init room', e);
      }
    };
    initRoom();
  }, [roomId]);

  useEffect(() => {
    if (user?.id && roomId) {
      const channel = supabase.channel(`room-${roomId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, async (payload) => {
          const msg = payload.new as Message;

          const roomDeletedKey = `deleted_for_me_${roomId}`;
          const deletedIdsStr = await AsyncStorage.getItem(roomDeletedKey);
          const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
          if (deletedIds.includes(msg.id)) return;

          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            // Optimistic UI Reconciliation
            const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.sender_id === msg.sender_id && m.content === msg.content));
            return [msg, ...filtered];
          });

          if (msg.sender_id !== user.id) {
            supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id).then();
            Vibration.vibrate(40);
            playMessageSound();
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          const upd = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === upd.id ? { ...m, ...upd } : m));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          const delId = (payload.old as any)?.id;
          if (delId) setMessages(prev => prev.filter(m => m.id !== delId));
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_rooms', filter: `id=eq.${roomId}` }, async (payload) => {
          const upd = payload.new as any;
          if (upd.theme !== undefined) {
            setSelectedBg(upd.theme);
            if (upd.theme) await AsyncStorage.setItem(`chat_bg_${roomId}`, upd.theme);
            else await AsyncStorage.removeItem(`chat_bg_${roomId}`);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user?.id, roomId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);

    let content = newMessage.trim();

    if (editingMsg) {
      try {
        const rawContent = editingMsg.content;
        let meta: any = {};
        if (rawContent.includes('|||META|||')) {
          try { meta = JSON.parse(rawContent.split('|||META|||')[1]); } catch { }
        }
        meta.edited = true;
        const newContent = `${content}|||META|||${JSON.stringify(meta)}`;

        await supabase.from('chat_messages').update({ content: newContent }).eq('id', editingMsg.id);
        setEditingMsg(null);
        setNewMessage('');
      } catch (err) {
        console.error(err);
      } finally {
        setSending(false);
      }
      return;
    }

    if (replyingTo) {
      const cleanText = getCleanMessageText(replyingTo.content);
      const isImg = replyingTo.message_type === 'image' || replyingTo.message_type === 'image_once';
      const preview = isImg ? 'Photo 📷' : cleanText.substring(0, 35);
      const who = replyingTo.sender_id === user.id ? 'You' : (participant?.full_name || 'Scholar');
      content = `> Replying to **${who}**: "${preview}"\n\n${content}`;
      setReplyingTo(null);
    }

    try {
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type: 'text',
        created_at: new Date().toISOString(),
        is_read: false
      };

      setMessages(prev => [optimisticMsg, ...prev]);
      setNewMessage('');
      playMessageSound();

      const { error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type: 'text'
      });

      if (error) {
        // Revert optimistic insert on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        setNewMessage(content); // restore input
        throw error;
      }

      if (participant?.user_id) {
        fetch(`${WEB_URL}/api/chat/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.user_id,
            senderId: user.id,
            roomId,
            content: getCleanMessageText(content).substring(0, 50)
          })
        }).catch(null);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async () => {
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1, // keep high quality before manipulation
      });

      if (!result.canceled && result.assets[0].uri) {
        setUploadingImage(true);
        const asset = result.assets[0];

        // Compress and resize image like in profile.tsx
        const maxW = 1200;
        const maxH = 1200;
        const needsResize = (asset.width || 0) > maxW || (asset.height || 0) > maxH;

        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          needsResize ? [{ resize: { width: maxW, height: maxH } }] : [],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const uriToUpload = Platform.OS === 'android' && !manipulated.uri.startsWith('file://')
          ? `file://${manipulated.uri}`
          : manipulated.uri;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not signed in');

        const uploadRes = await FileSystem.uploadAsync(
          `${WEB_URL}/api/chat/upload`,
          uriToUpload,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            parameters: { roomId },
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (uploadRes.status < 200 || uploadRes.status >= 300) throw new Error('Upload failed');

        const data = JSON.parse(uploadRes.body);
        const publicUrl = data.publicUrl;

        await supabase.from('chat_messages').insert({
          room_id: roomId,
          sender_id: user.id,
          content: publicUrl,
          message_type: 'image'
        });

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const clearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const myMsgIds = messages.filter(m => m.sender_id === user.id).map(m => m.id);
            if (myMsgIds.length > 0) {
              await supabase.from('chat_messages').delete().in('id', myMsgIds);
            }

            const roomDeletedKey = `deleted_for_me_${roomId}`;
            const deletedIdsStr = await AsyncStorage.getItem(roomDeletedKey);
            const existingDeletes = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
            const theirIds = messages.filter(m => m.sender_id !== user.id).map(m => m.id);

            await AsyncStorage.setItem(roomDeletedKey, JSON.stringify([...existingDeletes, ...theirIds]));
            setMessages([]);
            setShowHeaderMenu(false);
          } catch (e) {
            Alert.alert('Error', 'Failed to clear chat');
          }
        }
      }
    ]);
  };

  const handleBlockUser = async () => {
    if (!user || !participant) return;
    const action = isBlocked ? 'unblock' : 'block';
    Alert.alert(
      isBlocked ? 'Unblock Scholar' : 'Block Scholar',
      `Are you sure you want to ${action} ${participant.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const myMeta = user.user_metadata || {};
              let currentBlocked = Array.isArray(myMeta.blockedUserIds) ? myMeta.blockedUserIds.map(String) : [];
              if (isBlocked) {
                currentBlocked = currentBlocked.filter((id: string) => id !== participant.user_id);
              } else {
                currentBlocked.push(participant.user_id);
              }

              await supabase.auth.updateUser({ data: { blockedUserIds: currentBlocked } });
              setIsBlocked(!isBlocked);
              setShowHeaderMenu(false);
              Alert.alert('Success', `Scholar has been ${isBlocked ? 'unblocked' : 'blocked'}.`);
              if (!isBlocked) router.back();
            } catch (err) {
              Alert.alert('Error', 'Unable to update block settings');
            }
          }
        }
      ]
    );
  };

  const changeBackground = async (bg: string | null) => {
    try {
      if (bg) {
        await AsyncStorage.setItem(`chat_bg_${roomId}`, bg);
      } else {
        await AsyncStorage.removeItem(`chat_bg_${roomId}`);
      }
      setSelectedBg(bg);
      setShowBgModal(false);
 
      await supabase.from('chat_rooms').update({ theme: bg }).eq('id', roomId);
    } catch (err) {
      console.warn('Failed to save background preference', err);
    }
  };

  const handleLongPress = useCallback((msg: Message) => {
    Vibration.vibrate(30);
    setContextMsg(msg);
    setShowContextModal(true);
  }, []);

  const handleReply = useCallback((msg: Message) => {
    setReplyingTo(msg);
    setShowContextModal(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleImageClick = useCallback((url: string) => {
    setFullscreenImage(url);
  }, []);

  const displayName = participant?.full_name || initialName;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F2F2F7] dark:bg-slate-950"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ─── iOS Style Fixed Header ─── */}
      <View
        className="flex-row items-center px-4 pt-4 pb-3 bg-white/95 dark:bg-slate-950/95 border-b border-[#E5E5EA] dark:border-slate-800/80 z-20"
        style={{ paddingTop: insets.top || 16 }}
      >
          <View className="flex-row items-center flex-1 pr-2">
            <TouchableOpacity onPress={() => router.back()} className="p-1.5 -ml-1 flex-row items-center active:opacity-70">
              <ArrowLeft size={24} color="#6366f1" />
            </TouchableOpacity>

            <TouchableOpacity className="h-[40px] w-[40px] rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden items-center justify-center ml-2">
              {participant?.avatar_url ? (
                <Image source={{ uri: participant.avatar_url }} style={{ width: '100%', height: '100%', position: 'absolute' }} contentFit="cover" />
              ) : (
                <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{displayName[0]?.toUpperCase()}</Text>
              )}
            </TouchableOpacity>

            <View className="flex-1 min-w-0 ml-3">
              <BadgedName name={displayName} isTeacher={participant?.is_teacher} nameClassName="font-semibold text-[17px] text-slate-900 dark:text-white leading-tight truncate" />
              {isOnline ? <Text className="text-[13px] text-[#8e8e93] font-medium mt-0.5">Online</Text> : <Text className="text-[13px] text-[#8e8e93] font-medium mt-0.5">Tap here for info</Text>}
            </View>
          </View>

          <TouchableOpacity onPress={() => setShowHeaderMenu(true)} className="p-2 -mr-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <MoreVertical size={20} color={isDark ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
        </View>

        {/* Header Menu Modal */}
        <Modal visible={showHeaderMenu} transparent animationType="fade" onRequestClose={() => setShowHeaderMenu(false)}>
          <TouchableWithoutFeedback onPress={() => setShowHeaderMenu(false)}>
            <View className="flex-1 bg-black/20 justify-start items-end" style={{ paddingTop: insets.top + 50, paddingRight: 10 }}>
              <TouchableWithoutFeedback>
                <View className="bg-white dark:bg-slate-900 rounded-2xl w-48 shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <TouchableOpacity onPress={clearChat} className="flex-row items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/50">
                    <Trash2 size={18} color="#ef4444" />
                    <Text className="text-red-500 font-semibold text-sm">Clear Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBlockUser} className="flex-row items-center gap-3 px-4 py-3.5">
                    <Ban size={18} color="#f97316" />
                    <Text className="text-orange-500 font-semibold text-sm">{isBlocked ? 'Unblock Scholar' : 'Block Scholar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowHeaderMenu(false); setShowBgModal(true); }} className="flex-row items-center justify-between px-4 py-3.5 border-t border-slate-100 dark:border-slate-800/50 bg-indigo-50/50 dark:bg-indigo-900/20 active:opacity-70">
                    <View className="flex-row items-center gap-3">
                      <ImageIcon size={18} color="#6366f1" />
                      <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">Background</Text>
                    </View>
                    <View className="bg-indigo-500 rounded-full px-2 py-0.5">
                      <Text className="text-[9px] font-black text-white tracking-wider">NEW</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Background Selection Modal */}
        <Modal visible={showBgModal} animationType="slide" transparent onRequestClose={() => setShowBgModal(false)}>
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl pt-5 pb-8 px-6 shadow-2xl h-[60%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">Chat Background</Text>
                <TouchableOpacity onPress={() => setShowBgModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <X size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  <TouchableOpacity onPress={() => changeBackground(null)} className={`w-[48%] aspect-[9/16] rounded-2xl border-4 overflow-hidden items-center justify-center bg-[#F2F2F7] dark:bg-slate-950 ${selectedBg === null ? 'border-indigo-500' : 'border-transparent'}`}>
                    <Text className="text-slate-500 dark:text-slate-400 font-semibold">Default (Solid)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeBackground('doodle')} className={`w-[48%] aspect-[9/16] rounded-2xl border-4 overflow-hidden ${selectedBg === 'doodle' ? 'border-indigo-500' : 'border-transparent'}`}>
                    <ImageBackground source={BG_MAP.doodle} style={{ width: '100%', height: '100%' }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeBackground('geometric')} className={`w-[48%] aspect-[9/16] rounded-2xl border-4 overflow-hidden ${selectedBg === 'geometric' ? 'border-indigo-500' : 'border-transparent'}`}>
                    <ImageBackground source={BG_MAP.geometric} style={{ width: '100%', height: '100%' }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeBackground('blur')} className={`w-[48%] aspect-[9/16] rounded-2xl border-4 overflow-hidden ${selectedBg === 'blur' ? 'border-indigo-500' : 'border-transparent'}`}>
                    <ImageBackground source={BG_MAP.blur} style={{ width: '100%', height: '100%' }} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator color="#6366f1" size="large" /></View>
        ) : (
          <View className="flex-1">
            {selectedBg ? (
              <ImageBackground source={BG_MAP[selectedBg]} style={{ flex: 1 }} resizeMode="cover">
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  inverted={true}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ paddingVertical: 16 }}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={20}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={false}
                  renderItem={({ item: msg, index }) => (
                    <MessageItem
                      msg={msg}
                      user={user}
                      participant={participant}
                      onLongPress={handleLongPress}
                      onReply={handleReply}
                      prevMsg={messages[index + 1]}
                      onImageClick={handleImageClick}
                      isDark={isDark}
                    />
                  )}
                  onEndReached={() => {
                    if (hasMore && !loadingMore && messages.length > 0) {
                      fetchMessages(true);
                    }
                  }}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={loadingMore ? <ActivityIndicator color="#6366f1" style={{ marginVertical: 16 }} /> : null}
                />
              </ImageBackground>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                inverted={true}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingVertical: 16 }}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={20}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={false}
                renderItem={({ item: msg, index }) => (
                  <MessageItem
                    msg={msg}
                    user={user}
                    participant={participant}
                    prevMsg={index < messages.length - 1 ? messages[index + 1] : null}
                    onLongPress={handleLongPress}
                    onReply={handleReply}
                    onImageClick={handleImageClick}
                    isDark={isDark}
                  />
                )}
                ListFooterComponent={() => (
                  hasMore ? (
                    <TouchableOpacity
                      onPress={() => fetchMessages(true)}
                      disabled={loadingMore}
                      className="py-6 items-center justify-center"
                    >
                      {loadingMore ? <ActivityIndicator color="#6366f1" /> : (
                        <View className="bg-[#E5E5EA] dark:bg-[#2C2C2E] w-[1px] h-14" />
                      )}
                    </TouchableOpacity>
                  ) : null
                )}
              />
            )}
          </View>
        )}

        {/* Context Menu Modal */}
        <Modal visible={showContextModal} transparent animationType="fade" onRequestClose={() => setShowContextModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowContextModal(false)}>
            <View className="flex-1 justify-center items-center bg-black/50 px-6">
              <TouchableWithoutFeedback>
                <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 w-full max-w-[280px] shadow-2xl">
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Options</Text>

                  <TouchableOpacity onPress={() => handleReply(contextMsg!)} className="flex-row items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800/80 active:opacity-70">
                    <Reply size={20} color={isDark ? '#cbd5e1' : '#334155'} />
                    <Text className="text-[16px] font-bold text-slate-800 dark:text-slate-200">Reply</Text>
                  </TouchableOpacity>

                  {contextMsg?.message_type === 'text' && (
                    <TouchableOpacity onPress={async () => {
                      const text = getCleanMessageText(contextMsg.content);
                      Clipboard.setString(text);
                      setShowContextModal(false);
                    }} className="flex-row items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800/80 active:opacity-70">
                      <Copy size={20} color={isDark ? '#cbd5e1' : '#334155'} />
                      <Text className="text-[16px] font-bold text-slate-800 dark:text-slate-200">Copy Text</Text>
                    </TouchableOpacity>
                  )}

                  {contextMsg?.sender_id === user?.id && contextMsg?.message_type === 'text' && (
                    <TouchableOpacity onPress={() => {
                      const text = getCleanMessageText(contextMsg.content);
                      setEditingMsg(contextMsg);
                      setNewMessage(text);
                      setShowContextModal(false);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }} className="flex-row items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800/80 active:opacity-70">
                      <Edit2 size={20} color={isDark ? '#cbd5e1' : '#334155'} />
                      <Text className="text-[16px] font-bold text-slate-800 dark:text-slate-200">Edit</Text>
                    </TouchableOpacity>
                  )}

                  {contextMsg?.sender_id === user?.id && (
                    <TouchableOpacity onPress={async () => {
                      await supabase.from('chat_messages').delete().eq('id', contextMsg!.id);
                      setMessages(prev => prev.filter(m => m.id !== contextMsg!.id));
                      setShowContextModal(false);
                    }} className="flex-row items-center gap-3 py-3 active:opacity-70">
                      <Trash2 size={20} color="#ef4444" />
                      <Text className="text-[16px] font-bold text-red-500">Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Fullscreen Image Modal */}
        <Modal visible={!!fullscreenImage} transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
          <View className="flex-1 bg-black justify-center items-center">
            <TouchableOpacity className="absolute top-12 right-6 z-50 p-2 bg-white/20 rounded-full" onPress={() => setFullscreenImage(null)}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            {fullscreenImage && <Image source={{ uri: fullscreenImage }} style={{ width: '100%', height: '80%' }} contentFit="contain" />}
          </View>
        </Modal>

        {/* Input Area */}
        {roomStatus?.status === 'pending' ? (
          <View
            className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60 px-4 pt-6 z-20"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            {roomStatus.created_by === user?.id ? (
              <View className="items-center">
                <Text className="font-bold text-slate-900 dark:text-white mb-1 text-lg">Message Request Sent</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  {participant?.full_name} will need to accept your request before you can chat.
                </Text>
              </View>
            ) : (
              <View>
                <Text className="font-bold text-slate-900 dark:text-white mb-1 text-center text-lg">Message Request</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">
                  If you accept, they will be able to message you and see when you've read messages.
                </Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={async () => {
                      const { error } = await supabase.from('chat_rooms').update({ status: 'approved' }).eq('id', roomId);
                      if (!error) {
                        setRoomStatus({ ...roomStatus, status: 'approved' });
                      }
                    }}
                    className="flex-1 py-3 bg-indigo-600 rounded-xl items-center active:scale-95"
                  >
                    <Text className="text-white font-bold">Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await supabase.from('chat_rooms').delete().eq('id', roomId);
                      router.back();
                    }}
                    className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl items-center active:scale-95"
                  >
                    <Text className="text-slate-900 dark:text-white font-bold">Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="bg-white dark:bg-slate-950 border-t border-[#E5E5EA] dark:border-slate-800" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            {replyingTo && (
              <View className="px-4 py-2 border-b border-[#E5E5EA] dark:border-slate-800 flex-row items-center justify-between bg-slate-50 dark:bg-slate-900">
                <View className="flex-1">
                  <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-[13px] mb-0.5">
                    Replying to {replyingTo.sender_id === user?.id ? 'Yourself' : participant?.full_name}
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-300 text-[14px]" numberOfLines={1}>
                    {getCleanMessageText(replyingTo.content)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)} className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                  <X size={16} color={isDark ? '#cbd5e1' : '#475569'} />
                </TouchableOpacity>
              </View>
            )}

            {editingMsg && (
              <View className="mb-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 flex-row justify-between items-center mx-2 border-l-4 border-orange-500">
                <View className="flex-1">
                  <Text className="text-orange-600 dark:text-orange-400 font-bold text-[13px] mb-0.5">Editing Message</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditingMsg(null); setNewMessage(''); }} className="p-1.5 rounded-full bg-orange-200 dark:bg-orange-800/50">
                  <X size={16} color={isDark ? '#fdba74' : '#c2410c'} />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-end gap-2 px-1">
              <TouchableOpacity onPress={handleImagePick} disabled={uploadingImage} className="w-[36px] h-[36px] rounded-full items-center justify-center mb-1 active:opacity-70 bg-slate-100 dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-800">
                {uploadingImage ? <ActivityIndicator size="small" color="#6366f1" /> : <Plus size={20} color="#8e8e93" />}
              </TouchableOpacity>

              <View className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-[20px] flex-row items-end px-4 py-1 border border-[#E5E5EA] dark:border-[#2C2C2E] mb-1">
                <TextInput
                  ref={inputRef}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder={isBlocked ? "Blocked" : "iMessage"}
                  placeholderTextColor="#8e8e93"
                  multiline
                  maxLength={3000}
                  editable={!isBlocked}
                  className="flex-1 max-h-32 text-[17px] leading-snug text-slate-900 dark:text-slate-50 pt-2.5 pb-2.5 min-h-[40px]"
                />
              </View>

              {newMessage.trim().length > 0 && (
                <TouchableOpacity onPress={handleSend} disabled={sending} className="w-[36px] h-[36px] rounded-full bg-blue-500 items-center justify-center mb-1 active:opacity-80">
                  {sending ? <ActivityIndicator size="small" color="white" /> : <ArrowUp size={20} color="white" />}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
    </KeyboardAvoidingView>
  );
}
