import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from '@/lib/next-navigation';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { Image } from 'react-native';

interface NewMessageInfo {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export default function GlobalChatListener() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<NewMessageInfo | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let audioBuffer: AudioBuffer | null = null;

    // Preload audio securely via fetch
    fetch('/universfield-new-notification-040-493469.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        return audioCtx.decodeAudioData(buffer);
      })
      .then(decoded => {
        audioBuffer = decoded;
      })
      .catch(() => {});

    const unlockAudio = () => {
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    
    // Attach to window so we can trigger it anywhere if needed
    (window as any).playGlobalNotifSound = () => {
      if (!audioCtx || !audioBuffer) {
        // Fallback to HTML Audio
        const fallback = new Audio('/universfield-new-notification-040-493469.mp3');
        fallback.volume = 1.0;
        fallback.play().catch(() => {});
        return;
      }
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start(0);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      delete (window as any).playGlobalNotifSound;
    };
  }, []);

  // Performance Fix: Replaced global poll interval with Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseRealtime
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const msg = payload.new as NewMessageInfo;
          
          // Don't notify if message is from self
          if (msg.sender_id === user.id) return;
          
          // Don't notify if user is already in this chat room
          if (pathname === `/chat/${msg.room_id}`) return;

          // Play Sound via Web Audio API (Highly reliable on mobile)
          if (typeof window !== 'undefined' && (window as any).playGlobalNotifSound) {
            (window as any).playGlobalNotifSound();
          }

          // Fetch sender profile for the notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          const info: NewMessageInfo = {
            ...msg,
            sender_name: profile?.full_name || 'Scholar',
            sender_avatar: profile?.avatar_url
          };

          setToastMessage(info);
          
          // Auto dismiss notification after 5s
          setTimeout(() => {
            setToastMessage(prev => prev?.id === msg.id ? null : prev);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [user?.id, pathname]);

  return (
    <>
      {toastMessage && (
        <View
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-2 left-0 right-0 z-[9999] mx-auto w-[94%] max-w-[400px]"
          onPress={() => {
            setToastMessage(null);
            router.push(`/chat/${toastMessage.room_id}`);
          }}
        >
          {/* Native Android/Material Design Notification style */}
          <View className="flex items-center gap-3 p-3 bg-white dark:bg-[#202c33] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl cursor-pointer active:scale-95 transition-transform flex-row">
            <View className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative bg-gray-200 dark:bg-gray-700">
              {toastMessage.sender_avatar ? (
                <Image source={{ uri: toastMessage.sender_avatar }} alt="Avatar" fill className="object-cover" />
              ) : (
                <View className="w-full h-full flex items-center justify-center font-bold text-[#075e54] dark:text-teal-400 flex-row">
                  {toastMessage.sender_name?.[0]?.toUpperCase()}
                </View>
              )}
            </View>
            <View className="flex-1 min-w-0 flex-row">
              <View className="flex justify-between items-center flex-row">
                <Text className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {toastMessage.sender_name}
                </Text>
                <Text className="text-[10px] text-gray-500 font-medium">Just now</Text>
              </View>
              <Text className="text-[13px] text-gray-600 dark:text-gray-400 truncate">
                New message
              </Text>
            </View>
          </View>
        </View>
      )}
      <audio ref={audioRef} src="/universfield-new-notification-040-493469.mp3" preload="auto" />
    </>
  );
}
