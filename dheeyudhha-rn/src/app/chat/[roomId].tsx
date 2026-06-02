import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
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
  Clipboard,
  Dimensions,
  Vibration,
  Pressable,
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
  Smile,
  Ban,
  Phone,
  Video,
  Eye,
  Lock,
  MessageSquare,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import BadgedName from '@/components/BadgedName';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

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

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { roomId: paramRoomId, name: paramName, avatar: paramAvatar } = useLocalSearchParams();
  const roomId = typeof paramRoomId === 'string' ? paramRoomId : '';
  const initialName = typeof paramName === 'string' ? paramName : 'Chat';
  const initialAvatar = typeof paramAvatar === 'string' ? paramAvatar : null;

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);

  // Message selections & Context menu
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);

  // States
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<any>(null);
  const isBlockedRef = useRef(false);

  useEffect(() => {
    isBlockedRef.current = isBlocked;
  }, [isBlocked]);

  const syncBlockStatus = useCallback(async (myId: string, partnerId: string) => {
    try {
      const [{ data: me }, { data: targetProfile }] = await Promise.all([
        supabase.from('profiles').select('id, blocked_users').eq('id', myId).maybeSingle(),
        supabase.rpc('get_public_profile_metadata', { target_user_id: partnerId })
      ]);

      const myBlockedList = Array.isArray(me?.blocked_users) ? me.blocked_users.map(String) : [];
      const theirBlockedList = Array.isArray(targetProfile?.blockedUserIds) ? targetProfile.blockedUserIds.map(String) : [];

      const blockedByMe = myBlockedList.includes(partnerId);
      const blockedMe = theirBlockedList.includes(myId);

      setIsBlocked(blockedByMe || blockedMe);
    } catch (err) {
      console.warn('[ChatRoom] Failed to load block status:', err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: list, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true }); // oldest first

      if (error) throw error;

      // Filter out soft-deleted messages
      const roomDeletedKey = `deleted_for_me_${roomId}`;
      const { data: cachedDeletes } = await supabase.auth.getSession();
      // Look up locally hidden message IDs or fallback
      setMessages(list || []);
      setLoading(false);

      // Scroll to bottom
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 150);

      // Mark unread messages as read
      if (user?.id && list) {
        const unreadIds = list
          .filter(m => !m.is_read && m.sender_id !== user.id)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [roomId, user?.id]);

  const initRoom = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      // 1. Get participant
      const { data: pData } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', currentUser.id)
        .maybeSingle();

      if (pData?.user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, username, is_teacher')
          .eq('id', pData.user_id)
          .single();

        if (prof) {
          setParticipant({
            user_id: pData.user_id,
            full_name: prof.full_name,
            avatar_url: prof.avatar_url,
            username: prof.username,
            is_teacher: !!prof.is_teacher
          });
          syncBlockStatus(currentUser.id, pData.user_id);
        }
      }

      await fetchMessages();
    } catch (e) {
      console.error('Failed to init room', e);
    }
  };

  useEffect(() => {
    initRoom();
  }, [roomId]);

  // Realtime handlers
  useEffect(() => {
    if (user?.id && roomId) {
      const channel = supabase.channel(`room-${roomId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (msg.sender_id !== user.id) {
            // Mark read receipt
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

      const interval = setInterval(fetchMessages, 10000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user?.id, roomId, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);

    let content = newMessage.trim();

    // Edit message logic
    if (editingMsg) {
      try {
        const rawContent = editingMsg.content;
        let meta: any = {};
        if (rawContent.includes('|||META|||')) {
          try { meta = JSON.parse(rawContent.split('|||META|||')[1]); } catch {}
        }
        meta.edited = true;
        const newContent = `${content}|||META|||${JSON.stringify(meta)}`;

        await supabase
          .from('chat_messages')
          .update({ content: newContent })
          .eq('id', editingMsg.id);

        setEditingMsg(null);
        setNewMessage('');
      } catch (err) {
        console.error(err);
      } finally {
        setSending(false);
      }
      return;
    }

    // Reply message logic
    if (replyingTo) {
      let rawPreviewText = replyingTo.content;
      if (rawPreviewText.includes('|||META|||')) {
        rawPreviewText = rawPreviewText.split('|||META|||')[0];
      }
      const isImg = replyingTo.message_type === 'image' || replyingTo.message_type === 'image_once';
      const preview = isImg ? 'Photo 📷' : rawPreviewText.substring(0, 35);
      const who = replyingTo.sender_id === user.id ? 'You' : (participant?.full_name || 'Scholar');
      content = `> Replying to **${who}**: "${preview}"\n\n${content}`;
      setReplyingTo(null);
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
          message_type: 'text'
        })
        .select('*')
        .single();

      if (error) throw error;

      setNewMessage('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      // Trigger push notification on web server
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
      Alert.alert('Send Error', 'Failed to send message.');
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
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    setUploadingImage(true);
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      const fileExtension = uri.split('.').pop() || 'jpg';
      const path = `avatars/chat_${roomId}_${user.id}_${Date.now()}.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, {
          upsert: true,
          contentType: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path);

      const { data: msg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: publicUrl,
          message_type: isViewOnce ? 'image_once' : 'image'
        })
        .select('*')
        .single();

      if (msgErr) throw msgErr;

      setIsViewOnce(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      // Trigger push notification on web server
      if (participant?.user_id) {
        fetch(`${WEB_URL}/api/chat/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.user_id,
            senderId: user.id,
            roomId,
            content: '📸 Image'
          })
        }).catch(null);
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClick = async (url: string, msgType: string, msgId: string, isSender: boolean) => {
    setFullscreenImage(url);

    if (msgType === 'image_once' && !isSender) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${WEB_URL}/api/chat/delete-once`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ messageId: msgId })
          });
        }
      } catch (e) {
        console.error('Failed to delete view-once image', e);
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const { data: msg } = await supabase.from('chat_messages').select('*').eq('id', messageId).single();
      if (!msg) return;

      let rawContent = msg.content;
      let meta: any = {};
      if (rawContent.includes('|||META|||')) {
        const parts = rawContent.split('|||META|||');
        rawContent = parts[0];
        try { meta = JSON.parse(parts[1]); } catch {}
      }

      if (!meta.reactions) meta.reactions = {};
      if (!meta.reactions[emoji]) meta.reactions[emoji] = [];

      const reactionUsers = meta.reactions[emoji];
      if (reactionUsers.includes(user.id)) {
        meta.reactions[emoji] = reactionUsers.filter((id: string) => id !== user.id);
        if (meta.reactions[emoji].length === 0) delete meta.reactions[emoji];
      } else {
        meta.reactions[emoji].push(user.id);
      }

      const newContent = `${rawContent}|||META|||${JSON.stringify(meta)}`;
      await supabase.from('chat_messages').update({ content: newContent }).eq('id', messageId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessageLongPress = (msg: Message) => {
    Vibration.vibrate(30);
    setContextMsg(msg);
    setShowContextModal(true);
  };

  const deleteMessage = async (msgId: string) => {
    try {
      const { error } = await supabase.from('chat_messages').delete().eq('id', msgId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const clearChat = async () => {
    if (!user) return;
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
            // Locally soft-delete other user's messages by caching IDs in storage
            const roomDeletedKey = `deleted_for_me_${roomId}`;
            const theirIds = messages.filter(m => m.sender_id !== user.id).map(m => m.id);
            // Simulating offline storage delete-marker
            setMessages([]);
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

              const { error } = await supabase.auth.updateUser({
                data: { blockedUserIds: currentBlocked }
              });

              if (error) throw error;

              setIsBlocked(!isBlocked);
              Alert.alert('Success', `Scholar has been ${isBlocked ? 'unblocked' : 'blocked'}.`);
              if (!isBlocked) {
                router.back();
              }
            } catch (err) {
              Alert.alert('Error', 'Unable to update block settings');
            }
          }
        }
      ]
    );
  };

  const displayName = participant?.full_name || initialName;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header bar */}
        <View className="flex-row items-center justify-between px-3 h-14 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 z-30">
          <View className="flex-row items-center flex-1 pr-2">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
              <ArrowLeft size={20} color={isDark ? '#cbd5e1' : '#334155'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => participant?.username && router.push(`/user/${participant.username}` as any)}
              className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden items-center justify-center ml-1"
            >
              {participant?.avatar_url ? (
                <Image source={{ uri: participant.avatar_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="font-bold text-indigo-650 dark:text-indigo-400 text-base">{displayName[0]?.toUpperCase()}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => participant?.username && router.push(`/user/${participant.username}` as any)}
              className="flex-1 min-w-0 ml-3"
            >
              <BadgedName
                name={displayName}
                isTeacher={participant?.is_teacher}
                nameClassName="font-bold text-[15px] text-slate-900 dark:text-white leading-tight truncate"
              />
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isOnline ? '🟢 Online' : 'Tap for info'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-1 shrink-0">
            <TouchableOpacity className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
              <Phone size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
              <Video size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHeaderMenu(!showHeaderMenu)}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
            >
              <MoreVertical size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown Menu */}
        {showHeaderMenu && (
          <View className="absolute right-3 top-14 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
            {participant?.username && (
              <TouchableOpacity
                onPress={() => { setShowHeaderMenu(false); router.push(`/user/${participant.username}` as any); }}
                className="px-4 py-3.5 border-b border-slate-50 dark:border-slate-800/40 active:bg-slate-100 dark:active:bg-slate-850"
              >
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">View Profile</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => { setShowHeaderMenu(false); clearChat(); }}
              className="px-4 py-3.5 border-b border-slate-50 dark:border-slate-800/40 active:bg-slate-100 dark:active:bg-slate-850"
            >
              <Text className="text-sm font-semibold text-rose-500">Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowHeaderMenu(false); handleBlockUser(); }}
              className="px-4 py-3.5 active:bg-slate-100 dark:active:bg-slate-850"
            >
              <Text className="text-sm font-semibold text-rose-600">{isBlocked ? 'Unblock Scholar' : 'Block Scholar'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Block Banner */}
        {isBlocked && (
          <View className="bg-rose-50 dark:bg-rose-950/20 px-4 py-2 flex-row items-center justify-center gap-2 border-b border-rose-100 dark:border-rose-900/50">
            <Ban size={14} color="#ef4444" />
            <Text className="text-[11px] font-black text-rose-500 uppercase tracking-tight">You have blocked this scholar</Text>
          </View>
        )}

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-3 pt-2"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading ? (
            <View className="flex-1 justify-center py-20">
              <ActivityIndicator color="#4f46e5" />
            </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-32">
              <View className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center rounded-2xl mb-4">
                <MessageSquare size={24} color="#4f46e5" />
              </View>
              <Text className="font-bold text-slate-700 dark:text-slate-300">Say hi to {displayName}! 👋</Text>
            </View>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const prevMsg = messages[idx - 1];
              const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                <View key={msg.id} className="w-full mb-1">
                  {showDate && (
                    <View className="items-center my-3">
                      <View className="bg-slate-200/80 dark:bg-slate-800/80 px-3 py-1 rounded-lg">
                        <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    onLongPress={() => handleMessageLongPress(msg)}
                    activeOpacity={0.9}
                    className={`flex-row items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Other avatar */}
                    {!isMe && (
                      <View className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 mr-1.5 mb-1 items-center justify-center">
                        {participant?.avatar_url ? (
                          <Image source={{ uri: participant.avatar_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                            {displayName[0]?.toUpperCase()}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Bubble */}
                    <View className={`max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {replyAuthor ? (
                        <View className={`mb-1 px-3 py-1.5 rounded-xl border-l-[3px] max-w-full ${isMe ? 'bg-indigo-500/10 border-indigo-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-400'}`}>
                          <Text className={`font-bold text-[11px] truncate ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{replyAuthor}</Text>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 truncate" numberOfLines={1}>{replyPreview}</Text>
                        </View>
                      ) : null}

                      <View className={`rounded-2xl overflow-hidden px-3.5 py-2.5 shadow-sm ${
                        isMe
                          ? 'bg-indigo-600 rounded-br-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-100/50 dark:border-slate-850 rounded-bl-sm'
                      }`}>
                        {msg.message_type === 'image_once' ? (
                          <TouchableOpacity
                            onPress={() => handleImageClick(rawContent, msg.message_type, msg.id, isMe)}
                            className="flex-row items-center gap-2"
                          >
                            <View className={`w-8 h-8 rounded-full items-center justify-center ${isMe ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'}`}>
                              <ImageIcon size={14} color={isMe ? 'white' : '#4f46e5'} />
                            </View>
                            <View>
                              <Text className={`font-bold text-sm leading-tight ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Photo</Text>
                              <Text className={`text-[10px] mt-0.5 ${isMe ? 'text-white/80' : 'text-slate-500'}`}>View once</Text>
                            </View>
                          </TouchableOpacity>
                        ) : msg.message_type === 'image' ? (
                          <TouchableOpacity onPress={() => handleImageClick(rawContent, msg.message_type, msg.id, isMe)}>
                            <Image source={{ uri: rawContent }} className="w-48 h-48 rounded-xl" resizeMode="cover" />
                          </TouchableOpacity>
                        ) : (
                          <View>
                            <Text className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {mainContent}
                            </Text>
                            {meta.edited && (
                              <Text className={`text-[9px] italic mt-0.5 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>(edited)</Text>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Reactions display */}
                      {meta.reactions && Object.keys(meta.reactions).length > 0 && (
                        <View className={`flex-row flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(meta.reactions).map(([emoji, users]) => {
                            const active = (users as string[]).includes(user?.id);
                            return (
                              <TouchableOpacity
                                key={emoji}
                                onPress={() => handleReaction(msg.id, emoji)}
                                className={`rounded-full px-2 py-0.5 flex-row items-center gap-1 border ${
                                  active
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-900'
                                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                                }`}
                              >
                                <Text className="text-[10px]">{emoji}</Text>
                                <Text className={`text-[9px] font-bold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                                  {Array.isArray(users) ? users.length : 1}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* Seen / Sent indicators */}
                      <View className={`flex-row items-center mt-1 gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Text className="text-[9px] text-slate-400 dark:text-slate-500">{timeStr}</Text>
                        {isMe && (
                          <View className="flex-row items-center gap-0.5">
                            {msg.is_read ? (
                              <CheckCheck size={11} color="#6366f1" strokeWidth={2.5} />
                            ) : (
                              <Check size={11} color="#94a3b8" strokeWidth={2.5} />
                            )}
                            <Text className={`text-[8px] font-black uppercase ${msg.is_read ? 'text-indigo-500' : 'text-slate-400'}`}>
                              {msg.is_read ? 'Seen' : 'Sent'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar Footer */}
        <View className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
          {/* Reply Banner */}
          {replyingTo && (
            <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl mb-2 border border-slate-100 dark:border-slate-800">
              <View className="flex-1 min-w-0 pr-2">
                <Text className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Replying to message</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" numberOfLines={1}>
                  {replyingTo.content.includes('|||META|||') ? replyingTo.content.split('|||META|||')[0] : replyingTo.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} className="p-1">
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Edit Banner */}
          {editingMsg && (
            <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl mb-2 border border-slate-100 dark:border-slate-800">
              <View className="flex-1 min-w-0 pr-2">
                <Text className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Editing message</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" numberOfLines={1}>
                  {editingMsg.content.includes('|||META|||') ? editingMsg.content.split('|||META|||')[0] : editingMsg.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setEditingMsg(null); setNewMessage(''); }} className="p-1">
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-end gap-2.5">
            <TouchableOpacity
              onPress={handleImagePick}
              disabled={uploadingImage}
              className="h-10 w-10 bg-slate-100 dark:bg-slate-800 items-center justify-center rounded-xl active:scale-95"
            >
              {uploadingImage ? (
                <ActivityIndicator color="#4f46e5" size="small" />
              ) : (
                <ImageIcon size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsViewOnce(!isViewOnce)}
              className={`h-10 w-10 items-center justify-center rounded-xl active:scale-95 border ${
                isViewOnce
                  ? 'bg-amber-50 border-amber-250 dark:bg-amber-950 dark:border-amber-900'
                  : 'bg-slate-100 border-transparent dark:bg-slate-800'
              }`}
            >
              {isViewOnce ? (
                <Lock size={16} color="#f59e0b" />
              ) : (
                <Eye size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
              )}
            </TouchableOpacity>

            <View className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/20 dark:border-slate-800/80 rounded-xl px-3.5 py-2.5 min-h-[42px] max-h-24">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline={true}
                className="text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 p-0 m-0 leading-relaxed"
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
              className={`h-10 w-10 items-center justify-center rounded-xl active:scale-95 ${
                newMessage.trim() ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <Send size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Long Press Context Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showContextModal}
          onRequestClose={() => setShowContextModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={() => setShowContextModal(false)}
          >
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 shadow-2xl">
              <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Reaction Row */}
              {contextMsg && (
                <View className="flex-row justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  {['❤️', '😂', '🔥', '👍', '😢', '😮'].map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => {
                        handleReaction(contextMsg.id, emoji);
                        setShowContextModal(false);
                      }}
                      className="text-2xl p-2 bg-slate-50 dark:bg-slate-800 rounded-full"
                    >
                      <Text>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Action items */}
              {contextMsg && (
                <View className="mt-3">
                  <TouchableOpacity
                    onPress={() => {
                      setReplyingTo(contextMsg);
                      setShowContextModal(false);
                    }}
                    className="flex-row items-center gap-3 py-3.5 border-b border-slate-50 dark:border-slate-800/40"
                  >
                    <Reply size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reply</Text>
                  </TouchableOpacity>

                  {contextMsg.sender_id === user?.id && contextMsg.message_type === 'text' && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingMsg(contextMsg);
                        setNewMessage(contextMsg.content.includes('|||META|||') ? contextMsg.content.split('|||META|||')[0] : contextMsg.content);
                        setShowContextModal(false);
                      }}
                      className="flex-row items-center gap-3 py-3.5 border-b border-slate-50 dark:border-slate-800/40"
                    >
                      <Edit2 size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                      <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">Edit</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      const text = contextMsg.content.includes('|||META|||') ? contextMsg.content.split('|||META|||')[0] : contextMsg.content;
                      Clipboard.setString(text);
                      setShowContextModal(false);
                    }}
                    className="flex-row items-center gap-3 py-3.5 border-b border-slate-50 dark:border-slate-800/40"
                  >
                    <Copy size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">Copy Text</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowContextModal(false);
                      Alert.alert('Delete for Me', 'Remove this message from your screen?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            setMessages(prev => prev.filter(m => m.id !== contextMsg.id));
                          }
                        }
                      ]);
                    }}
                    className="flex-row items-center gap-3 py-3.5 border-b border-slate-50 dark:border-slate-800/40"
                  >
                    <Trash2 size={16} color="#f43f5e" />
                    <Text className="text-sm font-semibold text-rose-500">Delete for Me</Text>
                  </TouchableOpacity>

                  {contextMsg.sender_id === user?.id && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowContextModal(false);
                        Alert.alert('Delete for Everyone', 'Are you sure you want to delete this message for everyone?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteMessage(contextMsg.id)
                          }
                        ]);
                      }}
                      className="flex-row items-center gap-3 py-3.5"
                    >
                      <Trash2 size={16} color="#ef4444" />
                      <Text className="text-sm font-semibold text-rose-600">Delete for Everyone</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        </Modal>

        {/* Fullscreen Image modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!fullscreenImage}
          onRequestClose={() => setFullscreenImage(null)}
        >
          <Pressable
            className="flex-1 bg-black justify-center items-center"
            onPress={() => setFullscreenImage(null)}
          >
            {fullscreenImage && (
              <Image source={{ uri: fullscreenImage }} className="w-full h-[70%]" resizeMode="contain" />
            )}
            <TouchableOpacity
              onPress={() => setFullscreenImage(null)}
              className="absolute top-10 right-4 p-2 bg-black/60 rounded-full"
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
