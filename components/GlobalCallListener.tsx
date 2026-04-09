'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const userRef = useRef<any>(null);
  const channelsRef = useRef<any[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref mirrors incomingCall state so callbacks always see the latest value
  const incomingCallRef = useRef<IncomingCall | null>(null);
  // Tracks the DB call_invites row id for the currently-displayed invite
  const currentInviteIdRef = useRef<string | null>(null);

  const setIncomingCallWithRef = (call: IncomingCall | null) => {
    incomingCallRef.current = call;
    setIncomingCall(call);
  };

  const dismissCall = () => {
    setIncomingCallWithRef(null);
    currentInviteIdRef.current = null;
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  const acceptCall = async () => {
    if (!incomingCallRef.current) return;
    const roomId = incomingCallRef.current.roomId;
    const inviteId = currentInviteIdRef.current;

    // Update DB invite status to accepted
    if (inviteId) {
      try {
        await supabase
          .from('call_invites')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', inviteId);
        if (process.env.NODE_ENV === 'development') {
          console.log('[GlobalCallListener] Call accepted, invite id:', inviteId);
        }
      } catch { }
    }

    // Unsubscribe THIS room's broadcast channel BEFORE navigating so the
    // chat page gets a clean sole subscription and avoids duplicate events
    const roomChannelIndex = channelsRef.current.findIndex(
      ch => ch.topic === `realtime:room-${roomId}`
    );
    if (roomChannelIndex !== -1) {
      supabaseRealtime.removeChannel(channelsRef.current[roomChannelIndex]);
      channelsRef.current.splice(roomChannelIndex, 1);
    }

    dismissCall();
    router.push(`/chat/${roomId}?incoming=1`);
  };

  const declineCall = async () => {
    const inviteId = currentInviteIdRef.current;
    if (inviteId) {
      try {
        await supabase
          .from('call_invites')
          .update({ status: 'declined' })
          .eq('id', inviteId);
        if (process.env.NODE_ENV === 'development') {
          console.log('[GlobalCallListener] Call declined, invite id:', inviteId);
        }
      } catch { }
    }
    dismissCall();
  };

  const showIncomingCall = async (
    roomId: string,
    callerId: string,
    callerName: string,
    callType: 'voice' | 'video',
    inviteId: string | null
  ) => {
    // Skip if we are already showing a call overlay
    if (incomingCallRef.current) return;

    // Fetch caller avatar
    let callerAvatar: string | undefined;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', callerId)
        .single();
      callerAvatar = profile?.avatar_url ?? undefined;
    } catch { }

    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

    currentInviteIdRef.current = inviteId;
    setIncomingCallWithRef({
      roomId,
      callerId,
      callerName: callerName || 'Scholar',
      callerAvatar,
      type: callType,
    });

    // Auto-dismiss after 45 seconds if not answered
    callTimeoutRef.current = setTimeout(() => {
      setIncomingCallWithRef(null);
      currentInviteIdRef.current = null;
    }, 45000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userRef.current = user;

      // ─── DB-based signaling (primary, durable) ────────────────────────────
      // Subscribe to new call_invites rows addressed to this user.
      // Uses supabaseRealtime (direct URL) since postgres_changes needs a
      // reliable WebSocket connection — supabase uses an HTTP proxy here.
      const dbChannel = supabaseRealtime
        .channel(`call-invites-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'call_invites',
            filter: `receiver_id=eq.${user.id}`,
          },
          async (payload) => {
            const invite = payload.new as {
              id: string;
              room_id: string;
              caller_id: string;
              type: string;
              status: string;
            };
            if (invite.status !== 'ringing') return;

            if (process.env.NODE_ENV === 'development') {
              console.log('[GlobalCallListener] DB invite received', invite);
            }

            // If broadcast already showed the overlay for this room but without
            // an invite id, update the ref so accept/decline can update the DB row
            if (
              incomingCallRef.current?.roomId === invite.room_id &&
              !currentInviteIdRef.current
            ) {
              currentInviteIdRef.current = invite.id;
              return;
            }

            // Fetch caller name from profiles
            let callerName = 'Scholar';
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', invite.caller_id)
                .single();
              callerName = profile?.full_name || 'Scholar';
            } catch { }

            await showIncomingCall(
              invite.room_id,
              invite.caller_id,
              callerName,
              invite.type as 'voice' | 'video',
              invite.id
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'call_invites',
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            const invite = payload.new as { id: string; status: string };
            // If the active invite was ended/missed by the caller, dismiss UI
            if (
              invite.id === currentInviteIdRef.current &&
              ['ended', 'missed'].includes(invite.status)
            ) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[GlobalCallListener] Invite updated, dismissing', invite);
              }
              dismissCall();
            }
          }
        )
        .subscribe();

      channelsRef.current.push(dbChannel);

      // ─── Broadcast-based signaling (fallback, best-effort) ────────────────
      // Subscribes to the room broadcast channels so calls still work even if
      // the postgres_changes event is slightly delayed.
      supabase
        .from('chat_rooms')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .then(({ data: rooms }) => {
          if (!rooms) return;

          rooms.forEach((room: { id: string }) => {
            const channel = supabaseRealtime.channel(`room-${room.id}`);

            channel.on('broadcast', { event: 'call-invite' }, async ({ payload }) => {
              // Skip if we are the caller
              const isCaller = payload.callerId === userRef.current?.id;
              if (isCaller) return;

              if (process.env.NODE_ENV === 'development') {
                console.log('[GlobalCallListener] Broadcast invite received', payload);
              }

              // DB subscription may have already shown the overlay; skip if so
              await showIncomingCall(
                room.id,
                payload.callerId,
                payload.callerName || 'Scholar',
                payload.type || 'voice',
                null // invite id not available from broadcast
              );
            });

            channel.on('broadcast', { event: 'call-ended' }, () => {
              if (process.env.NODE_ENV === 'development') {
                console.log('[GlobalCallListener] call-ended broadcast received');
              }
              dismissCall();
            });

            channel.subscribe();
            channelsRef.current.push(channel);
          });
        });
    });

    return () => {
      channelsRef.current.forEach(ch => supabaseRealtime.removeChannel(ch));
      channelsRef.current = [];
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };
  }, []); // Subscriptions are set up once on mount. `router` is a stable Next.js ref
         // and all other captures (userRef, channelsRef, etc.) are refs — safe to omit.

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
