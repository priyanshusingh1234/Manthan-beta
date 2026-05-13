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
import { useCallContext } from '@/components/CallProvider';

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
  const callCtx = useCallContext();

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const incomingCallRef = useRef<IncomingCall | null>(null);
  const userRef = useRef<any>(null);
  const pathnameRef = useRef(pathname);
  const channelsRef = useRef<any[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedCallMsgIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const startHapticLoop = () => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    const hapticInterval = setInterval(() => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }, 1500);
    (window as any)._activeCallHapticInterval = hapticInterval;

    // Start Ringtone for Web
    if (!Capacitor.isNativePlatform()) {
      const ringtone = new Audio('/universfield-new-notification-040-493469.mp3');
      ringtone.loop = true;
      ringtone.play().catch(() => {});
      (window as any)._activeCallRingtone = ringtone;
    }

    return hapticInterval;
  };

  const dismissCall = () => {
    if (Capacitor.isNativePlatform() && incomingCallRef.current) {
      IncomingCallKit.endCall({ callId: incomingCallRef.current.roomId }).catch(() => {});
    }
    setIncomingCall(null);
    incomingCallRef.current = null;

    // Stop Haptics
    if ((window as any)._activeCallHapticInterval) {
      clearInterval((window as any)._activeCallHapticInterval);
      delete (window as any)._activeCallHapticInterval;
    }
    
    // Stop Ringtone
    if ((window as any)._activeCallRingtone) {
      (window as any)._activeCallRingtone.pause();
      delete (window as any)._activeCallRingtone;
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  const handleIncomingCall = async (
    roomId: string,
    callerId: string,
    callerName: string,
    callType: 'voice' | 'video',
    dedupeKey: string,
  ) => {
    if (callerId === userRef.current?.id) return;
    if (pathnameRef.current === `/chat/${roomId}`) return;
    if (processedCallMsgIdsRef.current.has(dedupeKey)) return;
    processedCallMsgIdsRef.current.add(dedupeKey);
    if (incomingCallRef.current) return;

    let callerAvatar: string | undefined;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', callerId)
        .single();
      callerAvatar = profile?.avatar_url;
    } catch {}

    const newCall: IncomingCall = {
      roomId,
      callerId,
      callerName: callerName || 'Scholar',
      callerAvatar,
      type: callType,
    };

    setIncomingCall(newCall);
    incomingCallRef.current = newCall;

    startHapticLoop();

    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      setIncomingCall(null);
      incomingCallRef.current = null;
      if ((window as any)._activeCallHapticInterval) {
        clearInterval((window as any)._activeCallHapticInterval);
        delete (window as any)._activeCallHapticInterval;
      }
      // Stop web ringtone on timeout
      if ((window as any)._activeCallRingtone) {
        (window as any)._activeCallRingtone.pause();
        (window as any)._activeCallRingtone.currentTime = 0;
        delete (window as any)._activeCallRingtone;
      }
    }, 45000);

    if (Capacitor.isNativePlatform()) {
      IncomingCallKit.showIncomingCall({
        callId: roomId,
        callerName: callerName || 'Scholar',
        hasVideo: callType === 'video',
        timeoutMs: 45000,
        appName: 'Dheeyudha',
        android: { showFullScreen: true, isHighPriority: true },
      }).catch(() => {});
    }
  };

  const acceptCall = async () => {
    const call = incomingCallRef.current;
    if (!call) return;

    const { roomId, type, callerId, callerName } = call;

    // Remove the room channel before navigating
    const roomChannelIndex = channelsRef.current.findIndex(
      ch => ch.topic === `realtime:room-${roomId}`
    );
    if (roomChannelIndex !== -1) {
      supabaseRealtime.removeChannel(channelsRef.current[roomChannelIndex]);
      channelsRef.current.splice(roomChannelIndex, 1);
    }

    dismissCall();

    if (!Capacitor.isNativePlatform()) {
      // ── WEB PATH ─────────────────────────────────────────────────────────
      // Browser AudioContext REQUIRES a user gesture to start. We are currently
      // INSIDE a button onClick (user gesture), so we must call startCall()
      // RIGHT HERE — before any navigation — otherwise the audio context will
      // be blocked when init() tries to start it asynchronously after page load.
      await callCtx.startCall(roomId, type, callerId, callerName, true);
      // Navigate without autoAccept — call is already running
      router.push(`/chat/${roomId}`);
    } else {
      // ── NATIVE PATH ───────────────────────────────────────────────────────
      // No AudioContext restriction on native. Navigate first, let chat page
      // handle Agora join via autoAccept URL param.
      router.push(
        `/chat/${roomId}?autoAccept=1&callType=${type}&callerId=${callerId}&callerName=${encodeURIComponent(callerName)}`
      );
    }
  };

  const declineCall = async () => {
    const call = incomingCallRef.current;
    if (call && userRef.current) {
      await supabase.from('chat_messages').insert({
        room_id: call.roomId,
        sender_id: userRef.current.id,
        content: '__CALL_ENDED__: Call declined',
        message_type: 'text'
      }).then(null, () => {});

      const ch = channelsRef.current.find(
        c => c.topic === `realtime:room-${call.roomId}`
      );
      if (ch) {
        ch.send({
          type: 'broadcast',
          event: 'call-ended',
          payload: { roomId: call.roomId }
        }).catch(() => {});
      }
    }
    dismissCall();
  };

  // Native-only: handle system call screen accept/decline
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    IncomingCallKit.addListener('callAccepted', (event) => {
      const roomId = event.call.callId;
      const roomChannelIndex = channelsRef.current.findIndex(
        ch => ch.topic === `realtime:room-${roomId}`
      );
      if (roomChannelIndex !== -1) {
        supabaseRealtime.removeChannel(channelsRef.current[roomChannelIndex]);
        channelsRef.current.splice(roomChannelIndex, 1);
      }
      const call = incomingCallRef.current;
      dismissCall();
      const callType = call?.type || 'voice';
      const callerId = call?.callerId || '';
      const callerName = encodeURIComponent(call?.callerName || 'Scholar');
      router.push(`/chat/${roomId}?autoAccept=1&callType=${callType}&callerId=${callerId}&callerName=${callerName}`);
    });

    IncomingCallKit.addListener('callDeclined', async (event) => {
      const roomId = event.call.callId;
      if (userRef.current) {
        await supabase.from('chat_messages').insert({
          room_id: roomId,
          sender_id: userRef.current.id,
          content: '__CALL_ENDED__: Call declined',
          message_type: 'text'
        }).then(null, () => {});
        const ch = channelsRef.current.find(c => c.topic === `realtime:room-${roomId}`);
        if (ch) {
          ch.send({ type: 'broadcast', event: 'call-ended', payload: { roomId } }).catch(() => {});
        }
      }
      dismissCall();
    });
  }, [router]);

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userRef.current = user;

      // Sync auth session to supabaseRealtime
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabaseRealtime.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      const { data: rooms } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (!rooms || rooms.length === 0) return;

      rooms.forEach((room: { room_id: string }) => {
        const channel = supabaseRealtime.channel(`room-${room.room_id}`, {
          config: { broadcast: { ack: false } }
        });

        // Fast path: broadcast
        channel.on('broadcast', { event: 'call-invite' }, ({ payload }) => {
          const dedupe = `broadcast-${room.room_id}-${payload.callerId}-${payload.ts || ''}`;
          handleIncomingCall(
            room.room_id,
            payload.callerId,
            payload.callerName,
            payload.type || 'voice',
            dedupe,
          );
        });

        // Reliable fallback: postgres_changes on __CALL_STARTED__ message
        channel.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.room_id}` },
          (payload) => {
            const msg = payload.new as any;
            if (!msg.content?.startsWith('__CALL_STARTED__')) return;
            const age = Date.now() - new Date(msg.created_at).getTime();
            if (age > 45000) return;

            // Fetch caller name, then show incoming call UI
            const callType = (msg.content.split(':')[1] || 'voice') as 'voice' | 'video';
            supabase.from('profiles').select('full_name').eq('id', msg.sender_id).single()
              .then(({ data: prof }) => {
                handleIncomingCall(
                  room.room_id,
                  msg.sender_id,
                  prof?.full_name || 'Scholar',
                  callType,
                  msg.id,
                );
              });
          }
        );

        channel.on('broadcast', { event: 'call-ended' }, () => {
          dismissCall();
        });

        channel.subscribe();
        channelsRef.current.push(channel);
      });
    };

    setup();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await supabaseRealtime.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        // Re-setup listeners if signed in or session initials
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setup();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      channelsRef.current.forEach(ch => supabaseRealtime.removeChannel(ch));
      channelsRef.current = [];
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if ((window as any)._activeCallHapticInterval) clearInterval((window as any)._activeCallHapticInterval);
      // Stop web ringtone on unmount
      if ((window as any)._activeCallRingtone) {
        (window as any)._activeCallRingtone.pause();
        (window as any)._activeCallRingtone.currentTime = 0;
        delete (window as any)._activeCallRingtone;
      }
    };
  }, []);

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

                <div className="flex items-center justify-center gap-16 w-full">
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={declineCall}
                      className="flex items-center justify-center h-[72px] w-[72px] rounded-full bg-red-500 shadow-xl shadow-red-500/30 active:scale-95 transition-transform"
                    >
                      <PhoneOff className="h-8 w-8" />
                    </button>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Decline</span>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={acceptCall}
                      className="flex items-center justify-center h-[72px] w-[72px] rounded-full bg-green-500 shadow-xl shadow-green-500/30 active:scale-95 transition-transform"
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
