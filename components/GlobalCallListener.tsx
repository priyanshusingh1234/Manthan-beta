'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { IncomingCallKit } from '@capgo/capacitor-incoming-call-kit';
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
  const incomingCallRef = useRef<IncomingCall | null>(null);
  const userRef = useRef<any>(null);
  const pathnameRef = useRef(pathname);
  const channelsRef = useRef<any[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const dismissCall = () => {
    if (Capacitor.isNativePlatform() && incomingCallRef.current) {
      IncomingCallKit.endCall({ callId: incomingCallRef.current.roomId }).catch(() => {});
    }
    setIncomingCall(null);
    incomingCallRef.current = null;
    if ((window as any)._activeCallHapticInterval) {
      clearInterval((window as any)._activeCallHapticInterval);
      delete (window as any)._activeCallHapticInterval;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  const acceptCall = () => {
    const call = incomingCallRef.current;
    if (!call) return;
    const roomId = call.roomId;
    
    // Stop ringing
    dismissCall();

    // Unsubscribe THIS room's channel BEFORE navigating so the chat page
    // gets a clean, sole subscription — prevents duplicate call-ended firing
    const roomChannelIndex = channelsRef.current.findIndex(
      ch => ch.topic === `realtime:room-${roomId}`
    );
    if (roomChannelIndex !== -1) {
      supabaseRealtime.removeChannel(channelsRef.current[roomChannelIndex]);
      channelsRef.current.splice(roomChannelIndex, 1);
    }

    // Embed callType and callerId so the chat page can startCall immediately
    // without having to look up variables that are out of scope.
    router.push(`/chat/${roomId}?incoming=1&autoAccept=1&callType=${call.type}&callerId=${call.callerId}&callerName=${encodeURIComponent(call.callerName)}`);
  };

  const declineCall = async () => {
    const call = incomingCallRef.current;
    if (call && userRef.current) {
      await supabase.from('chat_messages').insert({
        room_id: call.roomId,
        sender_id: userRef.current.id,
        content: '__CALL_ENDED__: Call declined',
        message_type: 'text'
      }).catch(() => {});
      
      const roomChannelIndex = channelsRef.current.findIndex(
        ch => ch.topic === `realtime:room-${call.roomId}`
      );
      if (roomChannelIndex !== -1) {
        channelsRef.current[roomChannelIndex].send({
          type: 'broadcast',
          event: 'call-ended',
          payload: { roomId: call.roomId }
        }).catch(() => {});
      }
    }
    dismissCall();
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      IncomingCallKit.addListener('callAccepted', (event) => {
        const roomId = event.call.callId;
        const roomChannelIndex = channelsRef.current.findIndex(ch => ch.topic === `realtime:room-${roomId}`);
        if (roomChannelIndex !== -1) {
          supabaseRealtime.removeChannel(channelsRef.current[roomChannelIndex]);
          channelsRef.current.splice(roomChannelIndex, 1);
        }
        const call = incomingCallRef.current;
        dismissCall();
        const callType = call?.type || 'voice';
        const callerId = call?.callerId || '';
        const callerName = encodeURIComponent(call?.callerName || 'Scholar');
        router.push(`/chat/${roomId}?incoming=1&autoAccept=1&callType=${callType}&callerId=${callerId}&callerName=${callerName}`);
      });

      IncomingCallKit.addListener('callDeclined', async (event) => {
        const roomId = event.call.callId;
        if (userRef.current) {
          await supabase.from('chat_messages').insert({
            room_id: roomId,
            sender_id: userRef.current.id,
            content: '__CALL_ENDED__: Call declined',
            message_type: 'text'
          }).catch(() => {});
          const roomChannelIndex = channelsRef.current.findIndex(ch => ch.topic === `realtime:room-${roomId}`);
          if (roomChannelIndex !== -1) {
            channelsRef.current[roomChannelIndex].send({
              type: 'broadcast',
              event: 'call-ended',
              payload: { roomId }
            }).catch(() => {});
          }
        }
        dismissCall();
      });
    }
  }, [router]);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userRef.current = user;

      // Fetch all room IDs this user is part of
      supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id)
        .then(({ data: rooms }) => {
          if (!rooms || rooms.length === 0) return;

          // Subscribe to each room's broadcast for call-invite
          rooms.forEach((room: { room_id: string }) => {
            const channel = supabaseRealtime.channel(`room-${room.room_id}`);
            channel.on('broadcast', { event: 'call-invite' }, async ({ payload }) => {
              // Ignore if already on that chat page or if we are the caller
              const isOnChatPage = pathnameRef.current === `/chat/${room.room_id}`;
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
              
              // Start a haptic loop for ringing feel
              const hapticInterval = setInterval(() => {
                Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
              }, 1500);

              if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
              }

              const newCall: IncomingCall = {
                roomId: room.room_id,
                callerId: payload.callerId,
                callerName: payload.callerName || 'Scholar',
                callerAvatar,
                type: payload.type || 'voice',
              };
              
              setIncomingCall(newCall);
              incomingCallRef.current = newCall;

              if (Capacitor.isNativePlatform()) {
                IncomingCallKit.showIncomingCall({
                  callId: newCall.roomId,
                  callerName: newCall.callerName,
                  hasVideo: newCall.type === 'video',
                  timeoutMs: 45000,
                  appName: 'Dheeyudha',
                  android: {
                    showFullScreen: true,
                    isHighPriority: true,
                  }
                }).catch(() => {});
              }

              // Auto-dismiss after 45 seconds
              callTimeoutRef.current = setTimeout(() => {
                clearInterval(hapticInterval);
                setIncomingCall(null);
              }, 45000);

              // We need to store the interval somewhere to clear it if call is accepted/declined
              (window as any)._activeCallHapticInterval = hapticInterval;
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
      if ((window as any)._activeCallHapticInterval) clearInterval((window as any)._activeCallHapticInterval);
    };
  }, []); // Run once on mount — intentionally no pathname dep

  return (
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {incomingCall && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2147483647] flex flex-col items-center justify-between bg-slate-900/97 backdrop-blur-2xl text-white py-20 px-8"
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
          </AnimatePresence>,
          document.body,
        )
      : null
  );
}
