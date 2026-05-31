'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react-native';
import { Image } from 'react-native';
import { Share } from 'react-native';
import { Platform } from 'react-native';

interface ShareToChatModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

let globalRoomsCache: any[] | null = null;
let globalRoomsPromise: Promise<any[]> | null = null;

async function getCachedRooms() {
  if (globalRoomsCache) return globalRoomsCache;
  if (globalRoomsPromise) return globalRoomsPromise;

  globalRoomsPromise = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: myRooms } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (!myRooms?.length) return [];
      
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
        
        globalRoomsCache = joinedRooms;
        return joinedRooms;
      }
      globalRoomsCache = [];
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  })();

  return globalRoomsPromise;
}

if (typeof window !== 'undefined') {
  // Fire and forget prefetch as soon as this component module is evaluated on client
  getCachedRooms().catch(() => {});
}

export default function ShareToChatModal({ url, isOpen, onClose }: ShareToChatModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<Record<string, boolean>>({});
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    
    async function loadRooms() {
      if (globalRoomsCache) {
        setRooms(globalRoomsCache);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const data = await getCachedRooms();
      setRooms(data);
      setLoading(false);
    }
    
    loadRooms();
  }, [isOpen]);

  const handleSend = async (roomId: string, receiverId: string) => {
    if (sendingTo[roomId] || sentTo[roomId]) return;
    setSendingTo(p => ({ ...p, [roomId]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/chat/send', {
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
         fetch('/api/chat/notify', {
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <>
      <View className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm" onPress={onClose} />
      <View className="fixed bottom-0 left-0 right-0 z-[10000] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl p-6 sm:max-w-md sm:mx-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-[2rem] animate-in slide-in-from-bottom duration-300">
        <View className="flex justify-between items-center mb-6 flex-row">
          <Text className="font-black text-xl text-slate-900 dark:text-white">Share to Chat</Text>
          <View onPress={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </View>
        </View>

        <View className="flex gap-3 mb-6 flex-row">
          <View
            onPress={() => {
              navigator.clipboard.writeText(url);
              alert('Link copied to clipboard!');
            }}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-row"
          >
            Copy Link
          </View>
          {((typeof navigator !== 'undefined' && navigator.share) || (Platform.OS !== 'web')) && (
            <View
              onPress={async () => {
                try {
                  if ((Platform.OS !== 'web')) {
                    await Share.share({ url, dialogTitle: "Share this link" });
                    return;
                  }
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    await navigator.share({ url });
                    return;
                  }
                } catch (e) {}
              }}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-row"
            >
              More Options
            </View>
          )}
        </View>

        {loading ? (
          <View className="flex justify-center py-12 flex-row">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </View>
        ) : rooms.length === 0 ? (
          <View className="text-center py-10 text-slate-500 dark:text-slate-400 font-medium">
            You don&apos;t have any active chats yet.
          </View>
        ) : (
          <View className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
            {rooms.map((room) => {
              const profile = room.profiles;
              const isSent = sentTo[room.room_id];
              const isSending = sendingTo[room.room_id];
              
              return (
                <View key={room.room_id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex-row">
                  <View className="flex items-center gap-3 min-w-0 flex-row">
                    {profile.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} alt="" className="rounded-full object-cover w-10 h-10 shrink-0" />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 shrink-0 flex-row">
                        {profile.full_name?.[0]?.toUpperCase()}
                      </View>
                    )}
                    <View className="min-w-0">
                      <Text className="font-bold text-sm text-slate-900 dark:text-white truncate">{profile.full_name}</Text>
                    </View>
                  </View>
                  <View
                    onPress={() => handleSend(room.room_id, room.user_id)}
                    disabled={isSent || isSending}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      isSent ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : isSending ? 'bg-slate-100 text-slate-400' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isSent ? (
                      <><CheckCircle2 className="w-4 h-4" /> Sent</>
                    ) : isSending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send</>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </>,
    document.body
  );
}
