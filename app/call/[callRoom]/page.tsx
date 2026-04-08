'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Mic, MicOff, Phone, PhoneOff, Radio, Sparkles, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';

type Phase = 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'error';
type SignalKind = 'accepted' | 'offer' | 'answer' | 'ice' | 'hangup' | 'declined';

type SignalPayload = {
  from: string;
  kind: SignalKind;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME;
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

if (TURN_URL) {
  ICE_SERVERS.push({
    urls: TURN_URL,
    username: TURN_USERNAME,
    credential: TURN_CREDENTIAL,
  });
}

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `peer_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export default function CallPage() {
  const { callRoom } = useParams() as { callRoom: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const callerName = searchParams.get('caller') || 'Scholar';
  const callerAvatar = searchParams.get('avatar') || '';
  const mode = searchParams.get('mode') || 'outgoing';

  const [phase, setPhase] = useState<Phase>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [statusText, setStatusText] = useState('Preparing call room...');

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const sessionIdRef = useRef<string>(randomId());
  const phaseRef = useRef<Phase>('ringing');
  const endingRef = useRef(false);
  const callStatusSavedRef = useRef(false);
  const channelReadyPromiseRef = useRef<Promise<void> | null>(null);
  const channelReadyResolveRef = useRef<(() => void) | null>(null);

  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const syncCallStatus = useCallback(async (status: 'ended' | 'declined') => {
    if (callStatusSavedRef.current) return;
    callStatusSavedRef.current = true;
    const marker = status === 'declined' ? '__CALL_DECLINED__:' : '__CALL_ENDED__:';

    try {
      await supabase
        .from('chat_messages')
        .update({ content: `${marker}${callRoom}` })
        .eq('content', `__CALL__:${callRoom}`);
    } catch (error) {
      console.warn('[Call] Could not sync call status:', error);
    }
  }, [callRoom]);

  const sendSignal = useCallback((kind: SignalKind, data: Partial<SignalPayload> = {}) => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        from: sessionIdRef.current,
        kind,
        ...data,
      },
    });
  }, []);

  const waitForChannelReady = useCallback(async () => {
    if (channelReadyPromiseRef.current) {
      await channelReadyPromiseRef.current;
    }
  }, []);

  const attachLocalTracks = useCallback((peer: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const existingTrackIds = new Set(peer.getSenders().map((sender) => sender.track?.id).filter(Boolean) as string[]);
    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) {
        peer.addTrack(track, stream);
      }
    });
  }, []);

  const connectPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice', { candidate: event.candidate.toJSON() });
      }
    };

    peer.ontrack = (event) => {
      remoteStreamRef.current.addTrack(event.track);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.volume = isSpeakerOn ? 1 : 0;
        remoteAudioRef.current.play().catch(() => {});
      }
      setPhase('connected');
      setStatusText('Connected');
      startTimer();
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === 'connected') {
        setPhase('connected');
        setStatusText('Connected');
        startTimer();
      }
      if ((state === 'failed' || state === 'disconnected') && !endingRef.current) {
        void endCall('ended', { broadcast: false });
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'failed' && !endingRef.current) {
        void endCall('ended', { broadcast: false });
      }
    };

    attachLocalTracks(peer);
    peerRef.current = peer;
    return peer;
  }, [attachLocalTracks, isSpeakerOn, sendSignal, startTimer]);

  const flushPendingIce = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) return;

    while (pendingIceRef.current.length > 0) {
      const candidate = pendingIceRef.current.shift();
      if (!candidate) continue;
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn('[Call] Failed to add ICE candidate:', error);
      }
    }
  }, []);

  const createOutgoingOffer = useCallback(async () => {
    const peer = connectPeer();
    attachLocalTracks(peer);
    setPhase('connecting');
    setStatusText('Building connection...');

    const offer = await peer.createOffer({ offerToReceiveAudio: true });
    await peer.setLocalDescription(offer);
    sendSignal('offer', { sdp: offer });
    setStatusText('Waiting for answer...');
  }, [attachLocalTracks, connectPeer, sendSignal]);

  const handleIncomingOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const peer = connectPeer();
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    await flushPendingIce();

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    sendSignal('answer', { sdp: answer });
    setPhase('connecting');
    setStatusText('Connecting...');
  }, [connectPeer, flushPendingIce, sendSignal]);

  const endCall = useCallback(async (
    status: 'ended' | 'declined',
    options: { broadcast?: boolean; navigate?: boolean } = {},
  ) => {
    if (endingRef.current) return;
    endingRef.current = true;

    const shouldBroadcast = options.broadcast !== false;
    const shouldNavigate = options.navigate !== false;

    clearTimer();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    setPhase(status);
    setStatusText(status === 'declined' ? 'Call declined' : 'Call ended');

    if (shouldBroadcast) {
      sendSignal(status === 'declined' ? 'declined' : 'hangup');
    }

    try {
      peerRef.current?.close();
    } catch {}
    peerRef.current = null;

    stopLocalMedia();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (channelRef.current) {
      try {
        await supabaseRealtime.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }
    channelReadyPromiseRef.current = null;
    channelReadyResolveRef.current = null;

    await syncCallStatus(status);

    if (shouldNavigate) {
      setTimeout(() => router.back(), 900);
    }
  }, [clearTimer, router, sendSignal, stopLocalMedia, syncCallStatus]);

  const handleSignal = useCallback(async (payload: SignalPayload) => {
    if (!payload || payload.from === sessionIdRef.current || endingRef.current) return;

    switch (payload.kind) {
      case 'accepted':
        if (mode === 'outgoing') {
          setPhase('connecting');
          setStatusText('Accepted. Connecting...');
          try {
            await createOutgoingOffer();
          } catch (error) {
            console.error('[Call] Failed to create offer:', error);
            await endCall('ended', { broadcast: false });
          }
        }
        break;
      case 'offer':
        if (payload.sdp) {
          try {
            await handleIncomingOffer(payload.sdp);
          } catch (error) {
            console.error('[Call] Failed to handle offer:', error);
            await endCall('ended', { broadcast: false });
          }
        }
        break;
      case 'answer':
        if (payload.sdp && peerRef.current) {
          try {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await flushPendingIce();
          } catch (error) {
            console.error('[Call] Failed to apply answer:', error);
          }
        }
        break;
      case 'ice':
        if (payload.candidate) {
          if (peerRef.current?.remoteDescription) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (error) {
              console.warn('[Call] Failed to add ICE candidate:', error);
            }
          } else {
            pendingIceRef.current.push(payload.candidate);
          }
        }
        break;
      case 'hangup':
        await endCall('ended', { broadcast: false });
        break;
      case 'declined':
        await endCall('declined', { broadcast: false });
        break;
    }
  }, [createOutgoingOffer, endCall, flushPendingIce, handleIncomingOffer, mode]);

  const connectChannel = useCallback(() => {
    if (channelRef.current) return channelRef.current;

    channelReadyPromiseRef.current = new Promise<void>((resolve) => {
      channelReadyResolveRef.current = resolve;
    });

    const channel = supabaseRealtime.channel(`voice-call:${callRoom}`);
    channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        void handleSignal(payload as SignalPayload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelReadyResolveRef.current?.();
          channelReadyResolveRef.current = null;
          setStatusText(mode === 'incoming' ? 'Tap accept to answer' : 'Waiting for answer...');
        }
      });

    channelRef.current = channel;
    return channel;
  }, [callRoom, handleSignal, mode]);

  const acceptCall = useCallback(async () => {
    if (isAccepting || endingRef.current) return;
    setIsAccepting(true);
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

    try {
      connectChannel();
      await waitForChannelReady();
      await ensureLocalStream();
      connectPeer();
      sendSignal('accepted');
      setPhase('connecting');
      setStatusText('Answering...');
    } catch (error) {
      console.error('[Call] Accept failed:', error);
      setPhase('error');
      setStatusText('Microphone permission required');
    } finally {
      setIsAccepting(false);
    }
  }, [connectChannel, connectPeer, ensureLocalStream, isAccepting, sendSignal, waitForChannelReady]);

  const startOutgoingSession = useCallback(async () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    try {
      connectChannel();
      await ensureLocalStream();
      setPhase('ringing');
      setStatusText('Ringing...');

      ringTimeoutRef.current = setTimeout(() => {
        if (!endingRef.current && phaseRef.current !== 'connected') {
          void endCall('ended', { broadcast: false });
        }
      }, 45000);
    } catch (error) {
      console.error('[Call] Outgoing mic setup failed:', error);
      setPhase('error');
      setStatusText('Microphone permission required');
      setTimeout(() => router.back(), 1200);
    }
  }, [connectChannel, ensureLocalStream, endCall, router]);

  useEffect(() => {
    if (mode === 'outgoing') {
      void startOutgoingSession();
    } else {
      connectChannel();
      setPhase('ringing');
      setStatusText('Incoming call');
    }

    return () => {
      clearTimer();
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      stopLocalMedia();
      try {
        peerRef.current?.close();
      } catch {}
      peerRef.current = null;
      if (channelRef.current) {
        void supabaseRealtime.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      channelReadyPromiseRef.current = null;
      channelReadyResolveRef.current = null;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, [clearTimer, connectChannel, mode, startOutgoingSession, stopLocalMedia]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 1 : 0;
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  const toggleMute = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const toggleSpeaker = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    setIsSpeakerOn((prev) => !prev);
  };

  const topLabel = phase === 'connected'
    ? 'Connected'
    : phase === 'connecting'
      ? 'Connecting'
      : phase === 'declined'
        ? 'Call declined'
        : phase === 'error'
          ? 'Setup failed'
          : mode === 'incoming'
            ? 'Incoming voice call'
            : 'Voice call';

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-[#07111f] text-white">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.24),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(135deg,_#020617_0%,_#07111f_50%,_#0f172a_100%)]" />
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.22, 0.42, 0.22] }} transition={{ duration: 4.8, repeat: Infinity }}
          className="absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
        <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.32, 0.18] }} transition={{ duration: 5.6, repeat: Infinity, delay: 0.9 }}
          className="absolute -bottom-36 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[110px]" />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.24)]"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${phase === 'connected' ? 'bg-emerald-400 animate-pulse' : phase === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-sky-400 animate-pulse'}`} />
          {topLabel}
          {phase === 'connected' && <span className="text-white/40">•</span>}
          {phase === 'connected' && <span className="font-mono text-white/70">{formatDuration(callDuration)}</span>}
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="relative mb-8">
          <motion.div
            animate={phase === 'ringing' || phase === 'connecting' ? { scale: [1, 1.16, 1], opacity: [0.55, 0.18, 0.55] } : { scale: 1, opacity: 0.28 }}
            transition={{ duration: 1.9, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-cyan-500/35 blur-2xl"
          />
          <motion.div
            animate={phase === 'ringing' || phase === 'connecting' ? { scale: [1, 1.08, 1], opacity: [0.42, 0.12, 0.42] } : { scale: 1, opacity: 0.18 }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
            className="absolute inset-0 rounded-full bg-emerald-500/25 blur-2xl"
          />
          <div className="relative h-40 w-40 overflow-hidden rounded-full border border-white/15 shadow-[0_20px_60px_rgba(15,23,42,0.45)] ring-8 ring-white/5">
            {callerAvatar ? (
              <Image src={safeDecode(callerAvatar)} alt={safeDecode(callerName)} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 via-sky-500 to-emerald-500 text-6xl font-black text-white">
                {safeDecode(callerName)[0]?.toUpperCase()}
              </div>
            )}
          </div>
          {phase === 'connected' && (
            <div className="absolute -right-2 -bottom-2 rounded-full border border-white/10 bg-emerald-500 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-500/30">
              Live
            </div>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{safeDecode(callerName)}</h1>
          <p className="mt-2 text-sm font-medium text-white/60">
            {statusText}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/60 backdrop-blur-xl">
          <Radio className="h-4 w-4 text-cyan-300" />
          Raw WebRTC voice
          <Sparkles className="h-4 w-4 text-emerald-300" />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
          {Array.from({ length: 7 }).map((_, index) => (
            <motion.span
              key={index}
              animate={phase === 'connected' ? { height: [10, 22, 12], opacity: [0.45, 1, 0.55] } : { height: [8, 16, 8], opacity: [0.28, 0.72, 0.28] }}
              transition={{ duration: 0.85, repeat: Infinity, delay: index * 0.08 }}
              className="w-2 rounded-full bg-gradient-to-t from-cyan-400 via-sky-400 to-emerald-300"
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <AnimatePresence mode="wait">
          {phase === 'ringing' && mode === 'incoming' && (
            <motion.div
              key="incoming-controls"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-2xl shadow-[0_22px_80px_rgba(15,23,42,0.4)]"
            >
              <button
                onClick={() => void endCall('declined', { broadcast: true })}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
              >
                <PhoneOff className="h-7 w-7" />
              </button>

              <div className="text-center">
                <p className="text-sm font-bold text-white">Incoming call</p>
                <p className="text-[11px] text-white/45">Decline or answer</p>
              </div>

              <button
                onClick={() => void acceptCall()}
                disabled={isAccepting}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 ${isAccepting ? 'bg-emerald-400/70' : 'bg-emerald-500'}`}
              >
                {isAccepting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Phone className="h-7 w-7" />}
              </button>
            </motion.div>
          )}

          {phase === 'ringing' && mode === 'outgoing' && (
            <motion.div
              key="outgoing-controls"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 backdrop-blur-2xl shadow-[0_22px_80px_rgba(15,23,42,0.4)]"
            >
              <button
                onClick={() => void endCall('ended', { broadcast: true })}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
              >
                <PhoneOff className="h-7 w-7" />
              </button>
              <p className="text-sm font-semibold text-white">Cancel call</p>
              <p className="text-xs text-white/45">Waiting for the other person to answer</p>
            </motion.div>
          )}

          {phase === 'connecting' && (
            <motion.div
              key="connecting-controls"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 backdrop-blur-2xl shadow-[0_22px_80px_rgba(15,23,42,0.4)]"
            >
              <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              <p className="text-sm font-semibold text-white">Connecting secure audio</p>
            </motion.div>
          )}

          {phase === 'connected' && (
            <motion.div
              key="connected-controls"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-[28px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-2xl shadow-[0_22px_80px_rgba(15,23,42,0.4)]"
            >
              <button
                onClick={toggleMute}
                className={`flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full border transition-transform active:scale-95 ${isMuted ? 'border-rose-400/40 bg-rose-500/20 text-rose-200' : 'border-white/10 bg-white/10 text-white/80'}`}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                <span className="text-[10px] font-bold">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                onClick={() => void endCall('ended', { broadcast: true })}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-rose-500 px-6 text-white shadow-xl shadow-rose-500/30 transition-transform active:scale-95"
              >
                <PhoneOff className="h-8 w-8" />
              </button>

              <button
                onClick={toggleSpeaker}
                className={`flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full border transition-transform active:scale-95 ${isSpeakerOn ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100' : 'border-white/10 bg-white/10 text-white/80'}`}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                <span className="text-[10px] font-bold">Speaker</span>
              </button>
            </motion.div>
          )}

          {(phase === 'ended' || phase === 'declined' || phase === 'error') && (
            <motion.div
              key="finished-controls"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-auto flex max-w-sm items-center justify-center rounded-[28px] border border-white/10 bg-white/10 px-6 py-4 backdrop-blur-2xl shadow-[0_22px_80px_rgba(15,23,42,0.4)]"
            >
              <button
                onClick={() => router.back()}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition-transform active:scale-95"
              >
                Back to chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
