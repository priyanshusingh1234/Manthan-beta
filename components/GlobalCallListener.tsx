'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import Image from 'next/image';

interface IncomingCall {
  roomId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  type: 'voice' | 'video';
}

export default function GlobalCallListener() {
  const pathname = usePathname();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const userRef = useRef<any>(null);
  const channelsRef = useRef<any[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissCall = () => {
    setIncomingCall(null);
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    const roomId = incomingCall.roomId;
    dismissCall();
    // Navigate into the chat room — the page's own acceptCall will handle Agora join
    router.push(`/chat/${roomId}?incoming=1`);
  };

  const declineCall = () => {
    dismissCall();
  };

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userRef.current = user;

      // Fetch all room IDs this user is part of
      supabase
        .from('chat_rooms')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .then(({ data: rooms }) => {
          if (!rooms) return;

          // Subscribe to each room's broadcast for call-invite
          rooms.forEach((room: { id: string }) => {
            const channel = supabaseRealtime.channel(`room-${room.id}`);
            channel.on('broadcast', { event: 'call-invite' }, async ({ payload }) => {
              // Ignore if already on that chat page or if we are the caller
              const isOnChatPage = pathname === `/chat/${room.id}`;
              const isCaller = payload.callerId === userRef.current?.id;
              if (isOnChatPage || isCaller) return;

              // Fetch caller profile for display
              let callerAvatar: string | undefined;
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('avatar_url')
                  .eq('id', payload.callerId)
                  .single();
                callerAvatar = profile?.avatar_url;
              } catch { }

              Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

              setIncomingCall({
                roomId: room.id,
                callerId: payload.callerId,
                callerName: payload.callerName || 'Scholar',
                callerAvatar,
                type: payload.type || 'voice',
              });

              // Auto-dismiss after 45 seconds
              callTimeoutRef.current = setTimeout(() => {
                setIncomingCall(null);
              }, 45000);
            });

            channel.on('broadcast', { event: 'call-ended' }, () => {
              dismissCall();
            });

            channel.subscribe();
            channelsRef.current.push(channel);
          });
        });
    });

    return () => {
      // Cleanup all channels on unmount
      channelsRef.current.forEach(ch => supabaseRealtime.removeChannel(ch));
      channelsRef.current = [];
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };
  }, []); // Run once on mount — intentionally no pathname dep

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-between bg-slate-900/97 backdrop-blur-2xl text-white py-20 px-8"
        >
          {/* Animated ring effect */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-8 rounded-full bg-green-500/20"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                className="absolute -inset-4 rounded-full bg-green-500/30"
              />
              <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                {incomingCall.callerAvatar ? (
                  <Image src={incomingCall.callerAvatar} alt={incomingCall.callerName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black">
                    {incomingCall.callerName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-white/60 text-sm font-semibold tracking-widest uppercase mb-2">
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call
              </p>
              <h2 className="text-3xl font-black tracking-tight">{incomingCall.callerName}</h2>
            </div>

            <motion.p
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/50 text-sm font-medium"
            >
              Ringing...
            </motion.p>
          </div>

          {/* Accept / Decline buttons */}
          <div className="flex items-center justify-center gap-16 w-full">
            {/* Decline */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={declineCall}
                className="h-18 w-18 flex items-center justify-center h-[72px] w-[72px] rounded-full bg-red-500 shadow-xl shadow-red-500/30 active:scale-95 transition-transform"
              >
                <PhoneOff className="h-8 w-8" />
              </button>
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={acceptCall}
                className="h-18 w-18 flex items-center justify-center h-[72px] w-[72px] rounded-full bg-green-500 shadow-xl shadow-green-500/30 active:scale-95 transition-transform"
              >
                {incomingCall.type === 'video' ? <Video className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
              </button>
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Accept</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
