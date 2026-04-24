"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, SwitchCamera, Minimize2, Maximize2 } from 'lucide-react';

interface CallContextType {
  callState: 'idle' | 'calling' | 'incoming' | 'active';
  callType: 'voice' | 'video';
  roomId: string | null;
  participantName: string;
  isMuted: boolean;
  isCamOff: boolean;
  isMinimized: boolean;
  remoteVideoTrack: any;
  localVideoTrack: any;
  startCall: (roomId: string, type: 'voice' | 'video', participantUserId: string | undefined, participantName: string, isAnswering?: boolean) => Promise<void>;
  endCall: (skipBroadcast?: boolean) => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  flipCamera: () => void;
  setIsMinimized: (val: boolean) => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error('useCallContext must be used within a CallProvider');
    return ctx;
};

// Remote/Local wrappers
function RemoteVideoPlayer({ track }: { track: any }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (track && ref.current) track.play(ref.current);
        return () => { track?.stop(); };
    }, [track]);
    return <div ref={ref} className="w-full h-full object-cover" />;
}

function LocalVideoPlayer({ track }: { track: any }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (track && ref.current) track.play(ref.current);
        return () => { track?.stop(); };
    }, [track]);
    return <div ref={ref} className="w-full h-full object-cover shadow-inner bg-slate-800" />;
}


export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'active'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('Scholar');
  const [participantId, setParticipantId] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  
  const rtcClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const currentCameraIdxRef = useRef(0);
  
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
     supabase.auth.getUser().then(({ data }) => {
         if (data?.user) currentUserRef.current = data.user;
     });
  }, []);

  useEffect(() => {
      if (!roomId) return;
      const channel = supabase.channel(`call-watcher-${roomId}`);
      channel.on('broadcast', { event: 'call-ended' }, () => {
          endCall(true);
      });
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          const msg = payload.new as any;
          if (msg.content.startsWith('__CALL_ENDED__') && msg.sender_id !== currentUserRef.current?.id) {
              endCall(true);
          }
      });
      channel.subscribe();
      return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const startCall = async (rid: string, type: 'voice' | 'video', pUserId: string | undefined, pName: string, isAnswering = false) => {
    setCallType(type);
    setRoomId(rid);
    setParticipantName(pName);
    setParticipantId(pUserId || null);
    setCallState('calling');
    setIsMinimized(false);

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtcClientRef.current = client;
      
      client.on('user-published', async (remoteUser: any, mediaType: 'video' | 'audio') => {
        await client.subscribe(remoteUser, mediaType as any);
        if (mediaType === 'video') setRemoteVideoTrack(remoteUser.videoTrack);
        if (mediaType === 'audio') remoteUser.audioTrack?.play();
      });
      
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
      const uid = Math.floor(Math.random() * 100000);
      let token: string | null = null;
      try {
        const tokenRes = await fetch(`/api/agora/token?channel=${encodeURIComponent(rid)}&uid=${uid}`, { cache: 'no-store' });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          token = tokenData?.token || null;
        } else {
          throw new Error('Failed to fetch Agora token');
        }
      } catch (tokenError: any) {
        throw new Error(tokenError?.message || 'Failed to fetch Agora token');
      }
      
      if (!appId || !token) throw new Error('Missing Agora App ID or token.');
      
      await client.join(appId, rid, token, uid);
      
      let audioTrack, videoTrack;
      if (type === 'video') {
          const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
          audioTrack = tracks[0];
          videoTrack = tracks[1];
      } else {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      }
      
      localAudioTrackRef.current = audioTrack;
      if (videoTrack) {
          localVideoTrackRef.current = videoTrack;
          setLocalVideoTrack(videoTrack);
      }
      
      await client.publish([audioTrack, ...(videoTrack ? [videoTrack] : [])]);
      
      try {
         const devices = await AgoraRTC.getCameras();
         if (devices.length > 0) currentCameraIdxRef.current = 0;
      } catch(e) {}
      
      setCallState('active');

      const user = currentUserRef.current;
      if (!isAnswering && user) {
        await supabase.from('chat_messages').insert({ room_id: rid, sender_id: user.id, content: `__CALL_STARTED__:${type}`, message_type: 'text' });
        
        supabase.channel(`room-${rid}`).send({
          type: 'broadcast',
          event: 'call-invite',
          payload: {
            callerId: user.id,
            callerName: user.user_metadata?.fullName || 'Scholar',
            type,
          }
        }).catch(() => {});
        
        if (pUserId) {
            fetch('/api/chat/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: pUserId, senderId: user.id, roomId: rid, content: `📞 Incoming ${type} call` })
            }).catch(() => {});
        }
      }
    } catch (err: any) { 
      console.error('[Agora]', err); 
      setCallState('idle'); 
      if (err.message?.includes('Permission') || err.name === 'NotAllowedError') {
        alert('Permission Denied: Please allow Camera and Microphone access in your Android settings to use this feature.');
      } else {
        alert(`Call failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const endCall = async (skipBroadcast = false) => {
    try {
      localAudioTrackRef.current?.stop(); localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.stop(); localVideoTrackRef.current?.close();
      await rtcClientRef.current?.leave();
    } catch {}
    
    setCallState('idle');
    setRemoteVideoTrack(null);
    setLocalVideoTrack(null);
    const rid = roomId; // save locally
    setRoomId(null);
    setIsMinimized(false);
    
    const user = currentUserRef.current;
    if (!skipBroadcast && user && rid) {
        await supabase.from('chat_messages').insert({ room_id: rid, sender_id: user.id, content: `__CALL_ENDED__: ${callType} call ended`, message_type: 'text' });
        if (participantId) {
            fetch('/api/chat/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: participantId, senderId: user.id, roomId: rid, content: `__CALL_ENDED__` })
            }).catch(() => {});
        }
        supabase.channel(`room-${rid}`).send({ type: 'broadcast', event: 'call-ended', payload: { roomId: rid } }).catch(() => {});
        supabase.channel(`call-watcher-${rid}`).send({ type: 'broadcast', event: 'call-ended', payload: { roomId: rid } }).catch(() => {});
    }
  };

  const toggleMute = () => {
    localAudioTrackRef.current?.setEnabled(isMuted);
    setIsMuted(v => !v);
  };
  
  const toggleCamera = () => {
    localVideoTrackRef.current?.setEnabled(isCamOff);
    setIsCamOff(v => !v);
  };

  const flipCamera = async () => {
    if (!localVideoTrackRef.current) return;
    try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        const devices = await AgoraRTC.getCameras();
        if (devices.length > 1) {
            const nextIdx = (currentCameraIdxRef.current + 1) % devices.length;
            await localVideoTrackRef.current.setDevice(devices[nextIdx].deviceId);
            currentCameraIdxRef.current = nextIdx;
        }
    } catch (err) {
        console.error('Failed to flip camera:', err);
    }
  };

  return (
    <CallContext.Provider value={{
        callState, callType, roomId, participantName, isMuted, isCamOff, isMinimized, setIsMinimized,
        remoteVideoTrack, localVideoTrack, startCall, endCall, toggleMute, toggleCamera, flipCamera
    }}>
      {children}
      
      {/* GLOBAL CALL UI OVERLAY */}
      <AnimatePresence>
          {callState !== 'idle' && (
              isMinimized ? (
                  /* MINIMIZED WHATSAPP-STYLE BANNER */
                  <motion.div 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-14 left-4 right-4 sm:left-1/2 sm:-ml-48 sm:w-96 z-[2147483647] bg-emerald-500 rounded-full shadow-2xl flex items-center justify-between p-3 cursor-pointer ring-4 ring-emerald-500/30 backdrop-blur-xl"
                    onClick={() => setIsMinimized(false)}
                  >
                      <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                              {callType === 'video' ? <Video className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
                          </div>
                          <div className="truncate">
                              <p className="text-white font-bold text-sm tracking-tight truncate">Ongoing • {participantName}</p>
                              <p className="text-emerald-100 text-xs font-semibold">Tap to return to call</p>
                          </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); endCall(); }} className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center shrink-0 shadow-sm transition-colors text-white">
                          <PhoneOff className="w-5 h-5" />
                      </button>
                  </motion.div>
              ) : (
                  /* FULL SCREEN CALL UI */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2147483647] bg-slate-900 flex flex-col items-center justify-between py-16"
                    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
                  >
                        {callType === 'video' && remoteVideoTrack ? (
                          <div className="absolute inset-0"><RemoteVideoPlayer track={remoteVideoTrack} /></div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-4 border-indigo-500/40 flex items-center justify-center text-5xl font-black text-indigo-300 shadow-2xl bg-indigo-600/20 backdrop-blur-sm">
                              {participantName[0]?.toUpperCase()}
                            </div>
                          </div>
                        )}
                        
                        {/* Local PiP */}
                        {callType === 'video' && localVideoTrack && !isCamOff && (
                          <div className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 transition-all">
                            <LocalVideoPlayer track={localVideoTrack} />
                          </div>
                        )}

                        <div className="relative z-10 text-center flex-1 flex flex-col pt-8">
                             <div className="flex items-center justify-center gap-4 mb-2">
                                <button onClick={() => setIsMinimized(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors">
                                    <Minimize2 className="w-5 h-5" />
                                </button>
                                <h2 className="text-white text-3xl font-black tracking-tight drop-shadow-md">{participantName}</h2>
                             </div>
                             <p className="text-slate-300 font-medium tracking-wide drop-shadow-sm bg-black/20 px-4 py-1 rounded-full self-center">
                                {callState === 'calling' ? 'Calling...' : callState === 'incoming' ? `Incoming ${callType} call` : `Secure ${callType === 'video' ? 'Video' : 'Voice'} Call`}
                             </p>
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-6 mb-8 w-full px-8">
                             <div className="flex items-center justify-center gap-6 py-4 px-6 rounded-[2.5rem] bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
                                <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isMuted ? 'bg-amber-500/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </button>

                                {callType === 'video' ? (
                                  <>
                                    <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isCamOff ? 'bg-amber-500/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                      {isCamOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                    </button>
                                    <button onClick={flipCamera} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white shadow-lg transition-all">
                                      <SwitchCamera className="w-6 h-6" />
                                    </button>
                                  </>
                                ) : null}

                                <button onClick={endCall} className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all ml-2">
                                  <PhoneOff className="w-7 h-7 text-white" />
                                </button>
                             </div>
                        </div>
                  </motion.div>
              )
          )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}
