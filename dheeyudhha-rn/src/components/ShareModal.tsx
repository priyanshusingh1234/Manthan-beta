import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator, Share, Clipboard, Dimensions } from 'react-native';
import { X, Send, CheckCircle2, Copy, Share2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

const { height } = Dimensions.get('window');

interface ShareModalProps {
  url: string;
  visible: boolean;
  onClose: () => void;
}

export default function ShareModal({ url, visible, onClose }: ShareModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<Record<string, boolean>>({});
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) return;
    
    async function loadRooms() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: myRooms } = await supabase
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', user.id);

        if (!myRooms?.length) {
          setRooms([]);
          return;
        }
        
        const roomIds = myRooms.map(r => r.room_id);
        const { data: otherParticipants } = await supabase
          .from('chat_participants')
          .select('room_id, user_id')
          .in('room_id', roomIds)
          .neq('user_id', user.id);

        if (otherParticipants && otherParticipants.length > 0) {
          const userIds = [...new Set(otherParticipants.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          const profileMap = new Map((profiles || []).map(p => [p.id, p]));
          const joinedRooms = otherParticipants.map(p => ({
            room_id: p.room_id,
            user_id: p.user_id,
            profiles: profileMap.get(p.user_id) || { full_name: 'Unknown', avatar_url: null }
          }));
          
          setRooms(joinedRooms);
        } else {
          setRooms([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadRooms();
  }, [visible]);

  const handleSend = async (roomId: string, receiverId: string) => {
    if (sendingTo[roomId] || sentTo[roomId]) return;
    setSendingTo(p => ({ ...p, [roomId]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roomId, content: url, messageType: 'text' }),
      });

      if (!res.ok) throw new Error('Send failed');
      
      setSentTo(p => ({ ...p, [roomId]: true }));
      
      // Attempt notification
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         fetch(`${API_URL}/api/chat/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId, senderId: user.id, roomId, content: "Shared a new question or post in chat" })
         }).catch(()=>{});
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send link');
    } finally {
      setSendingTo(p => ({ ...p, [roomId]: false }));
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({ url, message: url, title: "Check this out!" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(url);
    alert('Link copied to clipboard!');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/40 justify-end">
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-8" style={{ maxHeight: height * 0.8 }}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-black text-xl text-slate-900 dark:text-white">Share</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity onPress={handleCopyLink} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center flex-row justify-center gap-2">
              <Copy size={16} color="#475569" />
              <Text className="font-bold text-slate-700 dark:text-slate-300 text-sm">Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNativeShare} className="flex-1 py-3 bg-indigo-600 rounded-xl items-center flex-row justify-center gap-2">
              <Share2 size={16} color="white" />
              <Text className="font-bold text-white text-sm">More Options</Text>
            </TouchableOpacity>
          </View>

          <Text className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-3">Send to Chat</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ marginVertical: 40 }} />
          ) : rooms.length === 0 ? (
            <Text className="text-center py-10 text-slate-500 font-medium">You don't have any active chats yet.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {rooms.map(room => {
                const profile = room.profiles;
                const isSent = sentTo[room.room_id];
                const isSending = sendingTo[room.room_id];
                return (
                  <View key={room.room_id} className="flex-row items-center justify-between p-3 mb-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      {profile.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} className="w-10 h-10 rounded-full bg-slate-200" />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
                          <Text className="font-bold text-indigo-600 dark:text-indigo-400">{profile.full_name?.[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text className="font-bold text-slate-900 dark:text-white" numberOfLines={1}>{profile.full_name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleSend(room.room_id, room.user_id)}
                      disabled={isSent || isSending}
                      className={`px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 ${isSent ? 'bg-emerald-50 dark:bg-emerald-900/30' : isSending ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-600'}`}
                    >
                      {isSent ? (
                        <>
                          <CheckCircle2 size={14} color="#059669" />
                          <Text className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Sent</Text>
                        </>
                      ) : isSending ? (
                        <>
                          <ActivityIndicator size="small" color="#94a3b8" />
                          <Text className="font-bold text-slate-500 dark:text-slate-400 text-xs">Sending</Text>
                        </>
                      ) : (
                        <>
                          <Send size={14} color="white" />
                          <Text className="font-bold text-white text-xs">Send</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
