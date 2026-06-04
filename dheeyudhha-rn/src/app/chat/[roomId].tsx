import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
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
  Clipboard
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
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import BadgedName from '@/components/BadgedName';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  let rawContent = msg.content;
  let meta: any = {};
  if (rawContent.includes('|||META|||')) {
    const parts = rawContent.split('|||META|||');
    rawContent = parts[0];
    try { meta = JSON.parse(parts[1]); } catch {}
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
        replyPreview = match[2];
        mainContent = rest;
      }
    }
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
              <Image source={{ uri: participant.avatar_url }} className="w-full h-full" />
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

            <View className={`rounded-2xl overflow-hidden shadow-sm ${
              isMe ? 'bg-indigo-600 rounded-br-sm' : 'bg-white dark:bg-slate-800 rounded-bl-sm border border-slate-100 dark:border-slate-700/50'
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
                <TouchableOpacity onPress={() => onImageClick(rawContent, msg.message_type, msg.id, isMe)}>
                  <Image source={{ uri: rawContent }} style={{ width: 200, height: 200 }} resizeMode="cover" />
                  <View className="absolute bottom-1 right-2 flex-row items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full">
                    <Text className="text-[10px] text-white font-medium">{timeStr}</Text>
                    {isMe && (
                      msg.is_read ? <CheckCheck size={12} color="#60a5fa" strokeWidth={2.5} /> : <Check size={12} color="#cbd5e1" strokeWidth={2.5} />
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="px-3 py-2 flex-row flex-wrap items-end justify-between min-w-[80px]">
                  <Text className={`text-[15px] leading-5 mr-3 mb-1 ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {mainContent}
                    {meta.edited && <Text className={`text-[10px] italic ${isMe ? 'text-white/70' : 'text-slate-500'}`}> (edited)</Text>}
                  </Text>
                  <View className="flex-row items-center justify-end flex-1 gap-1 min-w-[45px]">
                    <Text className={`text-[10px] font-medium ${isMe ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {timeStr}
                    </Text>
                    {isMe && (
                      msg.is_read ? (
                        <CheckCheck size={12} color="#38bdf8" strokeWidth={2.5} />
                      ) : (
                        <Check size={12} color="#c7d2fe" strokeWidth={2.5} />
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
  
  // States
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // Modals
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  const syncBlockStatus = useCallback(async (myId: string, partnerId: string) => {
    try {
      const [{ data: me }, { data: targetProfile }] = await Promise.all([
        supabase.from('profiles').select('id, blocked_users').eq('id', myId).maybeSingle(),
        supabase.rpc('get_public_profile_metadata', { target_user_id: partnerId })
      ]);

      const myBlockedList = Array.isArray(me?.blocked_users) ? me.blocked_users.map(String) : [];
      const theirBlockedList = Array.isArray(targetProfile?.blockedUserIds) ? targetProfile.blockedUserIds.map(String) : [];

      setIsBlocked(myBlockedList.includes(partnerId) || theirBlockedList.includes(myId));
    } catch (err) {
      console.warn('Failed to load block status:', err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: list, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const roomDeletedKey = `deleted_for_me_${roomId}`;
      const deletedIdsStr = await AsyncStorage.getItem(roomDeletedKey);
      const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
      
      const filtered = (list || []).filter(m => !deletedIds.includes(m.id));
      setMessages(filtered);
      setLoading(false);

      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 150);

      if (user?.id && list) {
        const unreadIds = list.filter(m => !m.is_read && m.sender_id !== user.id).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [roomId, user?.id]);

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
            setParticipant({ user_id: pData.user_id, ...prof });
            syncBlockStatus(currentUser.id, pData.user_id);
          }
        }
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
            return [...prev, msg];
          });

          if (msg.sender_id !== user.id) {
            supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id).then(null);
            Vibration.vibrate(40);
          }
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          const upd = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === upd.id ? { ...m, ...upd } : m));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          const delId = (payload.old as any)?.id;
          if (delId) setMessages(prev => prev.filter(m => m.id !== delId));
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
      let rawPreviewText = replyingTo.content;
      if (rawPreviewText.includes('|||META|||')) rawPreviewText = rawPreviewText.split('|||META|||')[0];
      const isImg = replyingTo.message_type === 'image' || replyingTo.message_type === 'image_once';
      const preview = isImg ? 'Photo 📷' : rawPreviewText.substring(0, 35);
      const who = replyingTo.sender_id === user.id ? 'You' : (participant?.full_name || 'Scholar');
      content = `> Replying to **${who}**: "${preview}"\n\n${content}`;
      setReplyingTo(null);
    }

    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type: 'text'
      });

      if (error) throw error;

      setNewMessage('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      if (participant?.user_id) {
        fetch(`${WEB_URL}/api/chat/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.user_id,
            senderId: user.id,
            roomId,
            content: content.substring(0, 50)
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
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUploadingImage(true);
        const uri = result.assets[0].uri;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not signed in');

        const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
        const fileName = `chat_${roomId}_${user.id}_${Date.now()}.${fileExtension}`;
        
        const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
        const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

        const formData = new FormData();
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          formData.append('', blob, fileName);
        } else {
          formData.append('', { uri, name: fileName, type: mimeType } as any);
        }

        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${fileName}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY, 'x-upsert': 'true' },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

        await supabase.from('chat_messages').insert({
          room_id: roomId,
          sender_id: user.id,
          content: publicUrl,
          message_type: 'image'
        });

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
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

  const handleLongPress = (msg: Message) => {
    Vibration.vibrate(30);
    setContextMsg(msg);
    setShowContextModal(true);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    setShowContextModal(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const displayName = participant?.full_name || initialName;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header bar */}
        <View className="flex-row items-center justify-between px-3 h-14 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 z-30">
          <View className="flex-row items-center flex-1 pr-2">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
              <ArrowLeft size={20} color={isDark ? '#cbd5e1' : '#334155'} />
            </TouchableOpacity>

            <TouchableOpacity className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden items-center justify-center ml-1">
              {participant?.avatar_url ? (
                <Image source={{ uri: participant.avatar_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{displayName[0]?.toUpperCase()}</Text>
              )}
            </TouchableOpacity>

            <View className="flex-1 min-w-0 ml-3">
              <BadgedName name={displayName} isTeacher={participant?.is_teacher} nameClassName="font-bold text-[15px] text-slate-900 dark:text-white leading-tight truncate" />
              {isOnline && <Text className="text-[11px] text-emerald-500 font-semibold mt-0.5">Online</Text>}
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
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Message List */}
        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator color="#6366f1" size="large" /></View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{ paddingVertical: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.id}
                msg={msg}
                user={user}
                participant={participant}
                prevMsg={index > 0 ? messages[index - 1] : null}
                onLongPress={handleLongPress}
                onReply={handleReply}
                onImageClick={(url: string) => setFullscreenImage(url)}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        )}

        {/* Context Menu Modal */}
        <Modal visible={showContextModal} transparent animationType="slide" onRequestClose={() => setShowContextModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowContextModal(false)}>
            <View className="flex-1 justify-end bg-black/40">
              <TouchableWithoutFeedback>
                <View className="bg-white dark:bg-slate-900 rounded-t-3xl pb-8 pt-4 px-6 border-t border-slate-200 dark:border-slate-800">
                  <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-6" />
                  
                  <TouchableOpacity onPress={() => handleReply(contextMsg!)} className="flex-row items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
                    <Reply size={22} color={isDark ? '#e2e8f0' : '#1e293b'} />
                    <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reply</Text>
                  </TouchableOpacity>

                  {contextMsg?.message_type === 'text' && (
                    <TouchableOpacity onPress={async () => {
                      let text = contextMsg.content;
                      if (text.includes('|||META|||')) text = text.split('|||META|||')[0];
                      if (text.startsWith('> Replying to **')) text = text.split('\n\n').slice(1).join('\n\n');
                      await Clipboard.setStringAsync(text);
                      setShowContextModal(false);
                    }} className="flex-row items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
                      <Copy size={22} color={isDark ? '#e2e8f0' : '#1e293b'} />
                      <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">Copy Text</Text>
                    </TouchableOpacity>
                  )}

                  {contextMsg?.sender_id === user?.id && contextMsg?.message_type === 'text' && (
                    <TouchableOpacity onPress={() => {
                      let text = contextMsg.content;
                      if (text.includes('|||META|||')) text = text.split('|||META|||')[0];
                      if (text.startsWith('> Replying to **')) text = text.split('\n\n').slice(1).join('\n\n');
                      setEditingMsg(contextMsg);
                      setNewMessage(text);
                      setShowContextModal(false);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }} className="flex-row items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
                      <Edit2 size={22} color={isDark ? '#e2e8f0' : '#1e293b'} />
                      <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit</Text>
                    </TouchableOpacity>
                  )}

                  {contextMsg?.sender_id === user?.id && (
                    <TouchableOpacity onPress={async () => {
                      await supabase.from('chat_messages').delete().eq('id', contextMsg.id);
                      setMessages(prev => prev.filter(m => m.id !== contextMsg.id));
                      setShowContextModal(false);
                    }} className="flex-row items-center gap-4 py-4">
                      <Trash2 size={22} color="#ef4444" />
                      <Text className="text-lg font-semibold text-red-500">Delete</Text>
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
            {fullscreenImage && <Image source={{ uri: fullscreenImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          </View>
        </Modal>

        {/* Input Area */}
        <View className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60 px-3 py-2 pb-5 z-20">
          {replyingTo && (
            <View className="mb-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex-row justify-between items-center border-l-4 border-indigo-500">
              <View className="flex-1">
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-0.5">
                  Replying to {replyingTo.sender_id === user?.id ? 'Yourself' : participant?.full_name}
                </Text>
                <Text className="text-slate-600 dark:text-slate-300 text-xs" numberOfLines={1}>
                  {replyingTo.content.includes('|||META|||') ? replyingTo.content.split('|||META|||')[0] : replyingTo.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700">
                <X size={14} color={isDark ? '#cbd5e1' : '#475569'} />
              </TouchableOpacity>
            </View>
          )}

          {editingMsg && (
            <View className="mb-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 flex-row justify-between items-center border-l-4 border-orange-500">
              <View className="flex-1">
                <Text className="text-orange-600 dark:text-orange-400 font-bold text-xs mb-0.5">Editing Message</Text>
              </View>
              <TouchableOpacity onPress={() => { setEditingMsg(null); setNewMessage(''); }} className="p-1 rounded-full bg-orange-200 dark:bg-orange-800/50">
                <X size={14} color={isDark ? '#fdba74' : '#c2410c'} />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-end gap-2">
            <TouchableOpacity onPress={handleImagePick} disabled={uploadingImage} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-0.5">
              {uploadingImage ? <ActivityIndicator size="small" color="#6366f1" /> : <ImageIcon size={20} color={isDark ? '#cbd5e1' : '#64748b'} />}
            </TouchableOpacity>

            <View className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-3xl flex-row items-end px-4 py-1.5 border border-slate-200 dark:border-slate-700">
              <TextInput
                ref={inputRef}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={isBlocked ? "You blocked this user" : "Type a message..."}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                multiline
                maxLength={500}
                editable={!isBlocked}
                className="flex-1 max-h-32 text-base text-slate-900 dark:text-slate-50 pt-2 pb-2 min-h-[38px]"
              />
            </View>

            {newMessage.trim().length > 0 && (
              <TouchableOpacity onPress={handleSend} disabled={sending} className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center mb-0.5 active:scale-95 shadow-sm shadow-indigo-200 dark:shadow-none">
                {sending ? <ActivityIndicator size="small" color="white" /> : <Send size={18} color="white" style={{ marginLeft: 2 }} />}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
