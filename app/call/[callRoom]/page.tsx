'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Phone } from 'lucide-react';
import Image from 'next/image';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '@/lib/supabaseClient';

type JitsiApi = {
  addListener: (event: string, cb: (payload?: any) => void) => void;
  executeCommand: (command: string, ...args: any[]) => void;
  dispose: () => void;
  getNumberOfParticipants?: () => number;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: any) => JitsiApi;
  }
}

export default function CallPage() {
  const { callRoom } = useParams() as { callRoom: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const callerName = searchParams.get('caller') || 'Scholar';
  const callerAvatar = searchParams.get('avatar') || '';
  // 'outgoing' = you called, 'incoming' = someone is calling you
  const mode = searchParams.get('mode') || 'outgoing';

  type Phase = 'ringing' | 'connected' | 'ended' | 'declined';
  const [phase, setPhase] = useState<Phase>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiApi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRemoteParticipantRef = useRef(false);
  const hasMarkedCallStatusRef = useRef(false);

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

  const markCallStatus = useCallback(async (status: 'ended' | 'declined') => {
    if (hasMarkedCallStatusRef.current) return;
    hasMarkedCallStatusRef.current = true;
    const marker = status === 'declined' ? '__CALL_DECLINED__:' : '__CALL_ENDED__:';
    try {
      await supabase
        .from('chat_messages')
        .update({ content: `${marker}${callRoom}` })
        .eq('content', `__CALL__:${callRoom}`);
    } catch (err) {
      console.warn('[Call] Unable to sync call status:', err);
    }
  }, [callRoom]);

  const disposeJitsi = useCallback(() => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch {}
      jitsiApiRef.current = null;
    }
  }, []);

  const loadJitsiScript = useCallback(async () => {
    if (window.JitsiMeetExternalAPI) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-jitsi-external-api="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Jitsi script')), { once: true });
        if (window.JitsiMeetExternalAPI) resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.defer = true;
      script.dataset.jitsiExternalApi = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi script'));
      document.body.appendChild(script);
    });
  }, []);

  const createJitsiInstance = useCallback(async () => {
    if (jitsiApiRef.current || !jitsiContainerRef.current) return;

    await loadJitsiScript();
    if (!window.JitsiMeetExternalAPI) throw new Error('Jitsi API unavailable');

    const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: `Dheeyudha_${callRoom}`,
      parentNode: jitsiContainerRef.current,
      width: 1,
      height: 1,
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        startWithVideoMuted: true,
        startWithAudioMuted: false,
        disableInviteFunctions: true,
        notifications: [],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        TOOLBAR_BUTTONS: ['microphone', 'hangup'],
      },
      userInfo: {
        displayName: mode === 'incoming' ? 'Receiver' : 'Caller',
      },
    });

    api.addListener('audioMuteStatusChanged', (payload?: { muted?: boolean }) => {
      if (typeof payload?.muted === 'boolean') {
        setIsMuted(payload.muted);
      }
    });

    api.addListener('videoConferenceJoined', () => {
      // Incoming accept should become active immediately after local join.
      // Outgoing still waits for a remote participant (handled below).
      if (mode === 'incoming') {
        setPhase('connected');
        startTimer();
      }
    });

    api.addListener('participantJoined', () => {
      hasRemoteParticipantRef.current = true;
      setPhase('connected');
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      startTimer();
    });

    api.addListener('participantLeft', async () => {
      hasRemoteParticipantRef.current = false;
      if (phase === 'connected') {
        setPhase('ended');
        clearTimer();
        await markCallStatus('ended');
        setTimeout(() => router.back(), 1000);
      }
    });

    api.addListener('readyToClose', () => {
      clearTimer();
    });

    jitsiApiRef.current = api;
  }, [callRoom, clearTimer, loadJitsiScript, markCallStatus, mode, phase, router, startTimer]);

  const startCall = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    setPhase('ringing');
    try {
      // On mobile webviews, explicitly requesting mic in a user gesture makes
      // accept/join far more reliable than relying on iframe-internal prompts.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach((t) => t.stop());
      } catch (micErr) {
        console.warn('[Call] Mic preflight failed:', micErr);
      }

      await createJitsiInstance();

      // Fallback: if we successfully initialized Jitsi from incoming accept,
      // move UI to active state even if event timing is delayed on device.
      if (mode === 'incoming') {
        setPhase('connected');
        startTimer();
      }
    } catch (err) {
      console.error('[Call] Failed to start Jitsi call:', err);
      setPhase('ended');
      setTimeout(() => router.back(), 1200);
    } finally {
      setIsStarting(false);
    }
  }, [createJitsiInstance, isStarting, mode, router, startTimer]);

  const handleEndCall = useCallback(async () => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    setPhase('ended');
    clearTimer();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    try {
      jitsiApiRef.current?.executeCommand('hangup');
    } catch {}
    disposeJitsi();
    await markCallStatus('ended');
    setTimeout(() => router.back(), 900);
  }, [clearTimer, disposeJitsi, markCallStatus, router]);

  const handleDecline = useCallback(async () => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    setPhase('declined');
    clearTimer();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    disposeJitsi();
    await markCallStatus('declined');
    setTimeout(() => router.back(), 900);
  }, [clearTimer, disposeJitsi, markCallStatus, router]);

  useEffect(() => {
    // Caller joins immediately, receiver waits to accept.
    if (mode === 'outgoing') {
      startCall();
      ringTimeoutRef.current = setTimeout(async () => {
        if (hasRemoteParticipantRef.current) return;
        setPhase('ended');
        clearTimer();
        await markCallStatus('ended');
        disposeJitsi();
        setTimeout(() => router.back(), 1200);
      }, 45000);
    }

    return () => {
      clearTimer();
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      disposeJitsi();
    };
  }, [clearTimer, disposeJitsi, markCallStatus, mode, router, startCall]);

  const toggleMute = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    try {
      jitsiApiRef.current?.executeCommand('toggleAudio');
    } catch {
      setIsMuted((prev) => !prev);
    }
  };

  const toggleSpeaker = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    setIsSpeakerOn((prev) => !prev);
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-[#0a0f1a]">
      {/* Hidden Jitsi mount point */}
      <div ref={jitsiContainerRef} className="pointer-events-none absolute left-[-9999px] top-[-9999px] h-px w-px opacity-0" />

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0a0f1a] to-slate-950" />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
      </div>

      {/* Top status badge */}
      <div className="relative z-10 flex w-full items-center justify-center pt-[calc(env(safe-area-inset-top)+2rem)]">
        <AnimatePresence mode="wait">
          {phase === 'ringing' && mode === 'outgoing' && (
            <motion.span key="ringing" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-md">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-amber-400" />
              Ringing...
            </motion.span>
          )}
          {phase === 'ringing' && mode === 'incoming' && (
            <motion.span key="incoming-badge" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-emerald-400" />
              Incoming Voice Call
            </motion.span>
          )}
          {phase === 'connected' && (
            <motion.span key="connected" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {formatDuration(callDuration)}
            </motion.span>
          )}
          {(phase === 'ended' || phase === 'declined') && (
            <motion.span key="ended" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 backdrop-blur-md border border-rose-500/30">
              {phase === 'declined' ? 'Call Declined' : 'Call Ended'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Center: Avatar + Name */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          {phase === 'ringing' && (
            <>
              <motion.div animate={{ scale: [1, 1.5], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-indigo-500/40" />
              <motion.div animate={{ scale: [1, 1.3], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-indigo-400/30" />
            </>
          )}
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl shadow-indigo-900/50">
            {callerAvatar ? (
              <Image src={safeDecode(callerAvatar)} alt={callerName} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-5xl font-black text-white">
                {safeDecode(callerName)[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">{safeDecode(callerName)}</h1>
          <p className="text-sm font-medium text-white/50">
            {phase === 'connected' ? 'Voice Call'
              : phase === 'ringing' && mode === 'incoming' ? 'is calling you...'
              : 'Calling...'}
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 w-full pb-[calc(env(safe-area-inset-bottom)+2.5rem)] px-8">
        <AnimatePresence mode="wait">

          {/* INCOMING: Accept + Decline */}
          {phase === 'ringing' && mode === 'incoming' && (
            <motion.div key="incoming-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-end justify-center gap-16">
              <div className="flex flex-col items-center gap-3">
                <motion.button whileTap={{ scale: 0.85 }} onClick={handleDecline}
                  className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/40">
                  <PhoneOff className="h-8 w-8" />
                </motion.button>
                <span className="text-xs font-bold text-rose-400">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <motion.button whileTap={{ scale: 0.85 }} onClick={startCall} disabled={isStarting}
                  className={`flex h-[80px] w-[80px] items-center justify-center rounded-full text-white shadow-xl shadow-emerald-500/40 ${isStarting ? 'bg-emerald-400/70' : 'bg-emerald-500 animate-pulse'}`}>
                  <Phone className="h-8 w-8" />
                </motion.button>
                <span className="text-xs font-bold text-emerald-400">{isStarting ? 'Connecting...' : 'Accept'}</span>
              </div>
            </motion.div>
          )}

          {/* OUTGOING RINGING: Cancel only */}
          {phase === 'ringing' && mode === 'outgoing' && (
            <motion.div key="outgoing-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3">
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleEndCall}
                className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/40">
                <PhoneOff className="h-8 w-8" />
              </motion.button>
              <span className="text-xs font-bold text-rose-400">Cancel</span>
            </motion.div>
          )}

          {/* CONNECTED: Mute / End / Speaker */}
          {phase === 'connected' && (
            <motion.div key="connected-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-6">
              <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMute}
                className={`flex h-[68px] w-[68px] flex-col items-center justify-center gap-1.5 rounded-full border transition-all ${isMuted ? 'border-rose-500/50 bg-rose-500/20 text-rose-300' : 'border-white/15 bg-white/10 text-white/80'}`}>
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                <span className="text-[10px] font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleEndCall}
                className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/40">
                <PhoneOff className="h-7 w-7" />
                <span className="text-[10px] font-semibold">End</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSpeaker}
                className={`flex h-[68px] w-[68px] flex-col items-center justify-center gap-1.5 rounded-full border transition-all ${isSpeakerOn ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-300' : 'border-white/15 bg-white/10 text-white/80'}`}>
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                <span className="text-[10px] font-semibold">Speaker</span>
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
