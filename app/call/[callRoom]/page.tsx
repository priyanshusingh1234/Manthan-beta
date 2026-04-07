'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function CallPage() {
  const { callRoom } = useParams() as { callRoom: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const callerName = searchParams.get('caller') || 'Scholar';
  const callerAvatar = searchParams.get('avatar') || '';

  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build the Jitsi URL – audio-only voice call
  const jitsiRoom = encodeURIComponent(`Dheeyudha_${callRoom}`);
  const jitsiUrl = `https://meet.jit.si/${jitsiRoom}#config.startWithVideoMuted=true&config.startWithAudioMuted=${isMuted}&config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.notifications=[]&config.toolbarButtons=[]&config.disableInviteFunctions=true&config.hideLobbyButton=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.TOOLBAR_BUTTONS=[]`;

  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // 🎙️ Request mic permission immediately — triggers browser/Android dialog
    const requestMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        // Connection confirmed once mic granted
        setCallStatus('connected');
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('[Call] Mic permission denied or unavailable:', err);
        // Still start timer — Jitsi will handle its own permission request
        setTimeout(() => {
          setCallStatus('connected');
          timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }, 2000);
      }
    };

    requestMic();

    return () => {
      // Release mic track when leaving call page
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => router.back(), 1200);
  };

  const toggleMute = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    setIsMuted(prev => !prev);
    // Try to message the Jitsi iframe to toggle mute
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'mute-audio', value: !isMuted }, '*');
    } catch (e) {}
  };

  const toggleSpeaker = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    setIsSpeakerOn(prev => !prev);
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-[#0a0f1a]">
      {/* Background animated gradient */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0a0f1a] to-slate-950" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]"
        />
      </div>

      {/* Hidden but active Jitsi iframe (handles actual audio) */}
      <iframe
        ref={iframeRef}
        src={jitsiUrl}
        onLoad={() => setJitsiLoaded(true)}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="absolute inset-0 z-0 h-full w-full opacity-0 pointer-events-none"
        title="Jitsi Call"
      />

      {/* Top status bar */}
      <div className="relative z-10 flex w-full items-center justify-center pt-[calc(env(safe-area-inset-top)+2rem)]">
        <AnimatePresence mode="wait">
          {callStatus === 'connecting' && (
            <motion.span
              key="connecting"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-md"
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-amber-400"
              />
              Connecting...
            </motion.span>
          )}
          {callStatus === 'connected' && (
            <motion.span
              key="connected"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {formatDuration(callDuration)}
            </motion.span>
          )}
          {callStatus === 'ended' && (
            <motion.span
              key="ended"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 backdrop-blur-md border border-rose-500/30"
            >
              Call Ended
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Center: Avatar + Name */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Pulsing avatar ring */}
        <div className="relative">
          {callStatus === 'connecting' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-indigo-500/40"
              />
              <motion.div
                animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-indigo-400/30"
              />
            </>
          )}
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl shadow-indigo-900/50">
            {callerAvatar ? (
              <Image src={decodeURIComponent(callerAvatar)} alt={callerName} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-5xl font-black text-white">
                {callerName[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">{decodeURIComponent(callerName)}</h1>
          <p className="text-sm font-medium text-white/50">Voice Call</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 w-full pb-[calc(env(safe-area-inset-bottom)+2.5rem)] px-8">
        <div className="flex items-center justify-center gap-6">

          {/* Mute */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className={`flex h-[68px] w-[68px] flex-col items-center justify-center gap-1.5 rounded-full border transition-all ${
              isMuted
                ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                : 'border-white/15 bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            <span className="text-[10px] font-semibold tracking-wide">{isMuted ? 'Unmute' : 'Mute'}</span>
          </motion.button>

          {/* End Call */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleEndCall}
            className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/40 hover:bg-rose-500 transition-colors"
          >
            <PhoneOff className="h-7 w-7" />
            <span className="text-[10px] font-semibold tracking-wide">End</span>
          </motion.button>

          {/* Speaker */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleSpeaker}
            className={`flex h-[68px] w-[68px] flex-col items-center justify-center gap-1.5 rounded-full border transition-all ${
              isSpeakerOn
                ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-300'
                : 'border-white/15 bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            <span className="text-[10px] font-semibold tracking-wide">Speaker</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
