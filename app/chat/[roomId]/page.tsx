'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Paperclip,
  CheckCheck,
  Check,
  Loader2,
  MessageCirclePlus,
  Trash2,
  Reply,
  X,
  VolumeX,
  Ban,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'file';
}

interface Participant {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  username: string;
}

const MESSAGES_CACHE_KEY = (roomId: string) => `chat_msgs_${roomId}`;
const PARTICIPANT_CACHE_KEY = (roomId: string) => `chat_part_${roomId}`;

// --- FIX 3: Safe Video Player Components ---
// These prevent the React re-render loop from crashing Agora's .play() method
const RemoteVideoPlayer = ({ track }: { track: any }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && videoRef.current) {
      track.play(videoRef.current);
    }
    return () => {
      if (track) track.stop();
    };
  }, [track]);

  return <div ref={videoRef} className="h-full w-full object-cover opacity-60" />;
};

const LocalVideoPlayer = ({ track }: { track: any }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && videoRef.current) {
      track.play(videoRef.current);
    }
  }, [track]);

  return <div ref={videoRef} className="h-full w-full scale-x-[-1] object-cover" />;
};


function ChatRoomContent() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const initialName = searchParams.get('name');
  const isIncomingFromNav = searchParams.get('incoming') === '1';

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deletedForMe, setDeletedForMe] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStats, setProfileStats] = useState({ followers: 0, following: 0, loaded: false });
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // --- Calling States ---
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isIncomingCall, setIsIncomingCall] = useState(false);

  // UI States for Tracks
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  // --- FIX 2: Refs for guaranteed cleanup regardless of React State ---
  const localAudioRef = useRef<any>(null);
  const localVideoRef = useRef<any>(null);
  const rtcClientRef = useRef<any>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callStatusRef = useRef<'ringing' | 'connected' | 'ended'>('ringing');

  const updateCallStatus = (status: 'ringing' | 'connected' | 'ended') => {
    setCallStatus(status);
    callStatusRef.current = status;
  };

  const toggleSelection = (id: string) => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleMultiDelete = async (type: 'me' | 'everyone') => {
    if (selectedIds.length === 0) return;
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

    try {
      if (type === 'everyone') {
        const mySelectedIds = messages.filter(m => selectedIds.includes(m.id) && m.sender_id === user.id).map(m => m.id);
        if (mySelectedIds.length > 0) {
          await supabase.from('chat_messages').delete().in('id', mySelectedIds);
        }
      }

      const newDeleted = [...new Set([...deletedForMe, ...selectedIds])];
      setDeletedForMe(newDeleted);
      localStorage.setItem(`deleted_${roomId}`, JSON.stringify(newDeleted));

      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
    } catch (e) {
      console.error("Delete error", e);
    } finally {
      exitSelectionMode();
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBlockedRef = useRef(false);
  const isMutedRef = useRef(false);

  const openProfileModal = async () => {
    if (!participant?.user_id) return;
    setShowProfileModal(true);
    if (profileStats.loaded) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', participant.user_id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', participant.user_id),
      ]);
      setProfileStats({
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        loaded: true
      });
    } catch (e) {
      console.error("Error fetching stats", e);
    }
  };

  const playNotificationSound = () => {
    if (isMutedRef.current) return;
    if (!audioRef.current) {
      audioRef.current = new Audio('/universfield-new-notification-040-493469.mp3');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => { });
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`deleted_${roomId}`);
      if (stored) {
        setDeletedForMe(JSON.parse(stored));
      }
    } catch (e) { }
  }, [roomId]);

  useEffect(() => {
    if (participant?.user_id) {
      const blocked = localStorage.getItem(`blocked_${participant.user_id}`) === 'true';
      const muted = localStorage.getItem(`muted_${participant.user_id}`) === 'true';
      setIsBlocked(blocked);
      setIsMuted(muted);
      isBlockedRef.current = blocked;
      isMutedRef.current = muted;
    }
  }, [participant?.user_id]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (router && typeof router.push === 'function') {
          router.push('/login');
        } else {
          window.location.href = '/login';
        }
        return;
      }
      setUser(user);

      try {
        const cachedMsgs = localStorage.getItem(MESSAGES_CACHE_KEY(roomId));
        const cachedPart = localStorage.getItem(PARTICIPANT_CACHE_KEY(roomId));
        if (cachedMsgs) {
          setMessages(JSON.parse(cachedMsgs));
          setLoading(false);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
        if (cachedPart) {
          setParticipant(JSON.parse(cachedPart));
        } else if (initialName) {
          setParticipant({ user_id: '', full_name: initialName, avatar_url: null, username: '' });
        }
      } catch { }

      const [participantsRes, messagesRes] = await Promise.all([
        supabase.from('chat_participants').select('user_id').eq('room_id', roomId).neq('user_id', user.id),
        supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(60)
      ]);

      const otherUserId = participantsRes.data?.[0]?.user_id;

      if (otherUserId) {
        supabase.from('profiles').select('full_name, avatar_url, username').eq('id', otherUserId).single()
          .then(({ data: profile }) => {
            if (profile) {
              const p = { user_id: otherUserId, full_name: profile.full_name, avatar_url: profile.avatar_url, username: profile.username };
              setParticipant(p);
              try { localStorage.setItem(PARTICIPANT_CACHE_KEY(roomId), JSON.stringify(p)); } catch { }
            }
          });
      }

      const freshMessages = messagesRes.data || [];
      setMessages(freshMessages);
      setLoading(false);

      try { localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(freshMessages)); } catch { }

      const unreadIds = freshMessages.filter(m => !m.is_read && m.sender_id !== user.id).map(m => m.id);
      if (unreadIds.length > 0) {
        supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds);
      }

      setTimeout(() => scrollToBottom('auto'), 100);
    };

    initChat();
  }, [roomId, router, initialName]);

  // When navigated from GlobalCallListener, pre-show incoming call screen
  useEffect(() => {
    if (!isIncomingFromNav) return;
    // Show the incoming call UI — user still taps Accept themselves (required for mic permission)
    setIsCalling(true);
    setIsIncomingCall(true);
    updateCallStatus('ringing');
    // Clean up URL so refresh doesn't retrigger
    const url = new URL(window.location.href);
    url.searchParams.delete('incoming');
    window.history.replaceState({}, '', url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIncomingFromNav]);

  // --- Agora Calling Logic ---
  const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

  // endCall is defined first so it can be referenced by initRtc, startCall, acceptCall
  const endCall = async () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });

    // Broadcast end-call signal so the other person's UI closes
    supabaseRealtime.channel(`room-${roomId}`).send({
      type: 'broadcast',
      event: 'call-ended',
    });

    // Stop tracks using refs (guaranteed, immune to React stale state)
    if (localAudioRef.current) {
      localAudioRef.current.stop();
      localAudioRef.current.close();
      localAudioRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.stop();
      localVideoRef.current.close();
      localVideoRef.current = null;
    }
    if (rtcClientRef.current) {
      try { await rtcClientRef.current.leave(); } catch { }
      rtcClientRef.current = null;
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    setIsCalling(false);
    setIsIncomingCall(false);
    updateCallStatus('ended');
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    setRemoteUsers([]);
    setIsMicOn(true);
    setIsCamOn(true);

    // Also reset any ringing vibrations or sounds if any
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
  };

  const sendMissedCallMessage = async () => {
    if (!user || !participant) return;
    try {
      await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content: `📞 Missed ${callType} call`,
        message_type: 'text'
      });
    } catch (e) {
      console.error("Missed call log failed", e);
    }
  };

  const initRtc = async () => {
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    rtcClientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
      updateCallStatus('connected');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    client.on('user-left', () => {
      endCall();
    });

    return client;
  };

  // Fetches a short-lived token from our backend API
  const fetchAgoraToken = async (channel: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/agora/token?channel=${encodeURIComponent(channel)}&uid=0`);
      if (!res.ok) return null;
      const { token } = await res.json();
      return token || null;
    } catch {
      return null;
    }
  };

  const startCall = async (type: 'voice' | 'video') => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
    setCallType(type);
    setIsCalling(true);
    setIsIncomingCall(false);
    updateCallStatus('ringing');

    const client = await initRtc();
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

    try {
      const token = await fetchAgoraToken(roomId);
      await client.join(AGORA_APP_ID, roomId, token, 0);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      localAudioRef.current = audioTrack;
      await client.publish(audioTrack);

      if (type === 'video') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);
        localVideoRef.current = videoTrack;
        await client.publish(videoTrack);
      }

      supabaseRealtime.channel(`room-${roomId}`).send({
        type: 'broadcast',
        event: 'call-invite',
        payload: { type, callerId: user.id, callerName: user.user_metadata?.full_name || 'Scholar' }
      });

      if (participant?.user_id) {
        fetch('/api/chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.user_id,
            senderId: user.id,
            content: `📞 Incoming ${type} call...`,
            roomId: roomId
          })
        }).catch(() => { });
      }

    // Timeout: extended to 90s to allow for cross-country navigation + mic permission grant
    callTimeoutRef.current = setTimeout(() => {
      if (callStatusRef.current === 'ringing') {
        sendMissedCallMessage();
        endCall();
      }
    }, 90000);

    } catch (e) {
      console.error("Call start failed", e);
      endCall();
    }
  };

  const acceptCall = async () => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
    // Don't mark connected yet — wait until Agora join succeeds
    updateCallStatus('ringing');
    const client = await initRtc();
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

    try {
      const token = await fetchAgoraToken(roomId);
      await client.join(AGORA_APP_ID, roomId, token, 0);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      localAudioRef.current = audioTrack;
      await client.publish(audioTrack);

      if (callType === 'video') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);
        localVideoRef.current = videoTrack;
        await client.publish(videoTrack);
      }
    } catch (e) {
      console.error("Call accept failed", e);
      endCall();
    }
  };

  // FIX 4: Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (localAudioRef.current) {
        localAudioRef.current.stop();
        localAudioRef.current.close();
      }
      if (localVideoRef.current) {
        localVideoRef.current.stop();
        localVideoRef.current.close();
      }
      if (rtcClientRef.current) {
        rtcClientRef.current.leave();
      }
    };
  }, []);

  const toggleMic = () => {
    if (localAudioRef.current) {
      const newState = !isMicOn;
      localAudioRef.current.setEnabled(newState);
      setIsMicOn(newState);
    }
  };

  const toggleCam = () => {
    if (localVideoRef.current) {
      const newState = !isCamOn;
      localVideoRef.current.setEnabled(newState);
      setIsCamOn(newState);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseRealtime
      .channel(`room-${roomId}`, {
        config: { presence: { key: user.id } }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const othersOnline = Object.keys(state).some(id => id !== user.id);
        setIsOnline(othersOnline);
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const next = [...prev, msg];
            try { localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(next.slice(-60))); } catch { }
            return next;
          });

          if (msg.sender_id !== user?.id) {
            await supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id);

            if (!isBlockedRef.current) {
              scrollToBottom();
              playNotificationSound();
              Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .on('broadcast', { event: 'call-invite' }, ({ payload }) => {
        if (payload.callerId !== user.id) {
          setCallType(payload.type);
          setIsCalling(true);
          setIsIncomingCall(true);
          updateCallStatus('ringing');
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
        }
      })
      .on('broadcast', { event: 'call-ended' }, () => {
        endCall();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    const pollInterval = setInterval(async () => {
      const { data: latest } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (latest) {
        setMessages(prev => {
          if (latest.length !== prev.length || (latest.length > 0 && prev.length > 0 && latest[latest.length - 1].id !== prev[prev.length - 1].id)) {
            setTimeout(() => scrollToBottom(), 100);

            const lastMsg = latest[latest.length - 1];
            if (lastMsg && lastMsg.sender_id !== user?.id && !isBlockedRef.current) {
              playNotificationSound();
              Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
            }
            return latest;
          }
          return prev;
        });
      }
    }, 5000);

    try {
      Keyboard.addListener('keyboardWillShow', info => {
        setKeyboardHeight(info.keyboardHeight);
        setTimeout(() => scrollToBottom(), 50);
      });
      Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    } catch (e) { }

    return () => {
      supabaseRealtime.removeChannel(channel);
      clearInterval(pollInterval);
      try { Keyboard.removeAllListeners(); } catch (e) { }
    };
  }, [roomId, user?.id]);

  const handleClearChat = async () => {
    if (!user || messages.length === 0) return;

    try {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

      const myMessageIds = messages.filter(m => m.sender_id === user.id).map(m => m.id);
      if (myMessageIds.length > 0) {
        await supabase.from('chat_messages').delete().in('id', myMessageIds);
      }

      const allCurrentIds = messages.map(m => m.id);
      const newDeleted = [...new Set([...deletedForMe, ...allCurrentIds])];
      setDeletedForMe(newDeleted);
      localStorage.setItem(`deleted_${roomId}`, JSON.stringify(newDeleted));

      setMessages(prev => prev.filter(m => !allCurrentIds.includes(m.id)));

    } catch (e) {
      console.error("Error clearing chat:", e);
    } finally {
      setShowMenu(false);
    }
  };

  const toggleBlock = () => {
    if (!participant?.user_id) return;
    const nextState = !isBlocked;
    setIsBlocked(nextState);
    isBlockedRef.current = nextState;
    if (nextState) {
      localStorage.setItem(`blocked_${participant.user_id}`, 'true');
    } else {
      localStorage.removeItem(`blocked_${participant.user_id}`);
    }
    setShowMenu(false);
    setShowProfileModal(false);
  };

  const toggleMute = () => {
    if (!participant?.user_id) return;
    const nextState = !isMuted;
    setIsMuted(nextState);
    isMutedRef.current = nextState;
    if (nextState) {
      localStorage.setItem(`muted_${participant.user_id}`, 'true');
    } else {
      localStorage.removeItem(`muted_${participant.user_id}`);
    }
    setShowMenu(false);
    setShowProfileModal(false);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1080;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !user) return;
    setUploadingImage(true);

    try {
      const file = await compressImage(rawFile);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
      const { data: insertedMessage, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: user.id, content: result.publicUrl, message_type: 'image' })
        .select('*')
        .single();

      if (error) throw error;

      if (insertedMessage) {
        setMessages(prev => {
          if (prev.some(m => m.id === insertedMessage.id)) return prev;
          return [...prev, insertedMessage as Message];
        });

        if (participant?.user_id) {
          const appUrl = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.())
            ? (process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app')
            : '';

          fetch(`${appUrl}/api/chat/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: participant.user_id,
              senderId: user.id,
              content: '📸 Sent you a photo',
              roomId: roomId
            })
          }).catch(console.error);
        }
      }
      scrollToBottom();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    let content = newMessage.trim();
    if (replyingTo) {
      const isImage = replyingTo.message_type === 'image';
      const isFile = replyingTo.message_type === 'file';
      const replyPreview = isImage ? '📸 Photo' : isFile ? '📁 File' : (replyingTo.content.length > 50 ? replyingTo.content.substring(0, 50) + '...' : replyingTo.content);
      content = `> Replying to **${replyingTo.sender_id === user.id ? 'You' : participant?.full_name || 'User'}**: "${replyPreview.replace(/\n/g, ' ')}"\n\n${content}`;
      setReplyingTo(null);
    }
    setNewMessage('');
    setSending(true);

    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
      const { data: insertedMessage, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: user.id, content, message_type: 'text' })
        .select('*')
        .single();
      if (error) throw error;

      if (insertedMessage) {
        setMessages(prev => {
          if (prev.some(m => m.id === insertedMessage.id)) return prev;
          return [...prev, insertedMessage as Message];
        });

        if (participant?.user_id) {
          const appUrl = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.())
            ? (process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app')
            : '';

          fetch(`${appUrl}/api/chat/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: participant.user_id,
              senderId: user.id,
              content: content,
              roomId: roomId
            })
          }).catch(console.error);
        }
      }

      scrollToBottom();
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0b0f14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,153,240,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(241,245,249,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,153,240,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(to_bottom,rgba(2,6,23,0.96),rgba(9,14,20,0.96))]" />

      {/* Action Sheet */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedMessage(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-800" />
              <div className="space-y-3 pb-8">
                <button
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
                    setReplyingTo(selectedMessage);
                    setSelectedMessage(null);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="flex w-full items-center justify-between rounded-[20px] bg-slate-100 p-4 font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reply
                  <Reply className="h-5 w-5 text-slate-500" />
                </button>
                <button
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
                    const newDeleted = [...deletedForMe, selectedMessage.id];
                    setDeletedForMe(newDeleted);
                    localStorage.setItem(`deleted_${roomId}`, JSON.stringify(newDeleted));
                    setSelectedMessage(null);
                  }}
                  className="flex w-full items-center justify-between rounded-[20px] bg-slate-100 p-4 font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Delete for me
                  <Trash2 className="h-5 w-5 text-slate-500" />
                </button>
                {selectedMessage.sender_id === user?.id && (
                  <button
                    onClick={async () => {
                      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

                      if (selectedMessage.message_type === 'image') {
                        try {
                          const pathSegments = selectedMessage.content.split('/public/avatars/');
                          if (pathSegments.length > 1) {
                            const storagePath = decodeURIComponent(pathSegments[1]);
                            await supabase.storage.from('avatars').remove([storagePath]);
                          }
                        } catch (e) {
                          console.error("Failed to scrub storage file:", e);
                        }
                      }

                      await supabase.from('chat_messages').delete().eq('id', selectedMessage.id);
                      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
                      setSelectedMessage(null);
                    }}
                    className="flex w-full items-center justify-between rounded-[20px] bg-red-50 p-4 font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40"
                  >
                    Delete for everyone
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                )}
                <button
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
                    setIsSelectionMode(true);
                    setSelectedIds([selectedMessage.id]);
                    setSelectedMessage(null);
                  }}
                  className="flex w-full items-center justify-between rounded-[20px] bg-slate-100 p-4 font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Select
                  <Check className="h-5 w-5 text-slate-500" />
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="mt-2 w-full p-4 font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && participant && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-[2px]"
              onClick={() => setShowProfileModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-white dark:bg-slate-900 rounded-t-[28px] px-6 pt-3 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
            >
              <div className="mx-auto mb-6 h-1.5 w-10 rounded-full bg-slate-300/80 dark:bg-slate-700" />

              <div className="flex flex-col items-center pb-6">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 mb-4 shadow-sm relative">
                  {participant.avatar_url ? (
                    <Image src={participant.avatar_url} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400">
                      {participant.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {participant.full_name}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                  @{participant.username || 'user'}
                </p>

                <div className="flex w-full max-w-xs justify-center gap-8 border-y border-slate-100 dark:border-slate-800/50 py-4 mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {profileStats.followers}
                    </span>
                    <span className="text-xs font-medium text-slate-500">Followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {profileStats.following}
                    </span>
                    <span className="text-xs font-medium text-slate-500">Following</span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      router.push(`/user/${participant.username || participant.user_id}`);
                    }}
                    className="w-full rounded-2xl bg-sky-500 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-600 active:scale-95"
                  >
                    View Full Profile
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={toggleMute}
                      className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition-colors active:scale-95 ${isMuted
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {isMuted ? 'Unmute User' : 'Mute User'}
                    </button>
                    <button
                      onClick={toggleBlock}
                      className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition-colors active:scale-95 ${isBlocked
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                        }`}
                    >
                      {isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="fixed top-0 inset-x-0 z-[100] px-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {isSelectionMode ? (
            <motion.div
              key="selection-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-[28px] border border-blue-200/50 bg-blue-600 px-4 py-3 shadow-xl backdrop-blur-2xl dark:border-blue-500/30 dark:bg-blue-600/90"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={exitSelectionMode}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="text-lg font-bold text-white">
                  {selectedIds.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allMine = messages.filter(m => selectedIds.includes(m.id)).every(m => m.sender_id === user.id);
                    if (allMine) {
                      if (confirm(`Delete ${selectedIds.length} messages for everyone?`)) handleMultiDelete('everyone');
                    } else {
                      if (confirm(`Delete ${selectedIds.length} messages for me?`)) handleMultiDelete('me');
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="normal-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-[28px] border border-white/60 bg-white/85 px-3 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/85"
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
                    if (router && typeof router.push === 'function') {
                      router.push('/chat');
                    } else {
                      window.location.href = '/chat';
                    }
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-700 transition-all active:scale-95 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>

                <button
                  type="button"
                  onClick={openProfileModal}
                  className="flex min-w-0 items-center gap-3 rounded-[22px] px-2 py-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                >
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                      {participant?.avatar_url ? (
                        <Image src={participant.avatar_url} alt="User" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">
                          {participant?.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    {isOnline && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[16px]">
                        {participant?.full_name || 'Scholar'}
                      </h2>
                    </div>
                    <p className="truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {isOnline ? 'Active now' : 'Tap for info'}
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => startCall('voice')}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all active:scale-95 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-blue-500"
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all active:scale-95 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-blue-500"
                >
                  <Video className="h-5 w-5" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                        >
                          <button onClick={handleClearChat} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                            <Trash2 className="h-4 w-4" /> Clear Chat
                          </button>
                          <button onClick={toggleMute} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                            <VolumeX className={`h-4 w-4 ${isMuted ? 'text-emerald-500' : ''}`} /> {isMuted ? 'Unmute' : 'Mute'}
                          </button>
                          <button onClick={toggleBlock} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
                            <Ban className="h-4 w-4" /> {isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top)+100px)] scroll-smooth">
        <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-5 sm:px-6 sm:py-8">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
              <div className="max-w-md rounded-[30px] border border-slate-200/80 bg-white/90 px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
                  <MessageCirclePlus className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Your conversation starts here
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  Send the first message to open the thread in this room. The design stays quiet so the conversation is the focus.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.filter(m => !deletedForMe.includes(m.id) && (!isBlocked || m.sender_id === user?.id)).map((msg, index, arr) => {
                const isMe = msg.sender_id === user?.id;
                const prevMsg = arr[index - 1];
                const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

                const nextMsg = arr[index + 1];
                const isNextSame = nextMsg && nextMsg.sender_id === msg.sender_id && format(new Date(nextMsg.created_at), 'yyyy-MM-dd') === format(new Date(msg.created_at), 'yyyy-MM-dd');
                const isPrevSame = prevMsg && prevMsg.sender_id === msg.sender_id && !showDate;

                return (
                  <div key={msg.id} className="w-full flex flex-col">
                    {/* Date Pill */}
                    {showDate && (
                      <div className="flex justify-center my-5">
                        <span className="px-4 py-1.5 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm border border-white/50 dark:border-slate-800/50">
                          {formatDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNextSame ? 'mb-0.5' : 'mb-3'} items-center gap-3`}>
                      {isSelectionMode && (
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedIds.includes(msg.id) ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-700'}`}
                          onClick={() => toggleSelection(msg.id)}
                        >
                          {selectedIds.includes(msg.id) && <Check className="h-4 w-4 text-white" strokeWidth={4} />}
                        </div>
                      )}
                      <motion.div
                        onClick={() => {
                          if (isSelectionMode) toggleSelection(msg.id);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (isSelectionMode) {
                            toggleSelection(msg.id);
                          } else {
                            Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
                            setSelectedMessage(msg);
                          }
                        }}
                        onTouchStart={() => {
                          touchTimer.current = setTimeout(() => {
                            if (isSelectionMode) {
                              toggleSelection(msg.id);
                            } else {
                              Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
                              setSelectedMessage(msg);
                            }
                          }, 500);
                        }}
                        onTouchEnd={() => {
                          if (touchTimer.current) clearTimeout(touchTimer.current);
                        }}
                        onTouchMove={() => {
                          if (touchTimer.current) clearTimeout(touchTimer.current);
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          backgroundColor: selectedIds.includes(msg.id) ? (isMe ? '#1d4ed8' : 'rgba(59, 130, 246, 0.1)') : undefined
                        }}
                        drag={!isSelectionMode ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0, right: 0.3 }}
                        onDragEnd={(_e, info) => {
                          if (info.offset.x > 50) {
                            Haptics.impact({ style: ImpactStyle.Medium }).catch(() => { });
                            setReplyingTo(msg);
                            setTimeout(() => inputRef.current?.focus(), 100);
                          }
                        }}
                        className={`
                        relative max-w-[85%] sm:max-w-[72%] px-4 py-3 group transition-colors duration-200
                        ${isMe
                            ? 'bg-gradient-to-br from-[#3897f0] to-[#1d4ed8] text-white shadow-[0_16px_35px_rgba(59,130,246,0.28)]'
                            : 'bg-white/95 dark:bg-slate-950/80 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-slate-200/80 dark:border-slate-800/80'
                          }
                        ${selectedIds.includes(msg.id) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                        ${isMe
                            ? `rounded-l-[20px] ${!isPrevSame ? 'rounded-tr-[20px]' : 'rounded-tr-[8px]'} ${!isNextSame ? 'rounded-br-[20px]' : 'rounded-br-[8px]'}`
                            : `rounded-r-[20px] ${!isPrevSame ? 'rounded-tl-[20px]' : 'rounded-tl-[8px]'} ${!isNextSame ? 'rounded-bl-[20px]' : 'rounded-bl-[8px]'}`
                          }
                      `}
                      >
                        <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                          {msg.message_type === 'image' ? (
                            <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-xl overflow-hidden mb-1 border border-black/10 dark:border-white/10">
                              <Image src={msg.content} alt="Chat Attachment" fill className="object-cover" unoptimized />
                            </div>
                          ) : msg.content.startsWith('> Replying to **') ? (
                            <>
                              <div className={`mb-2 rounded-xl border-l-4 p-2 text-sm ${isMe ? 'border-blue-200 bg-blue-500/20 text-blue-50' : 'border-blue-500 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                <span className="font-bold opacity-80">{msg.content.split('**: "')[0].replace('> Replying to **', '')}</span>
                                <p className="mt-0.5 truncate opacity-90">
                                  {(() => {
                                    const raw = msg.content.split('**: "')[1]?.split('"\n\n')[0] || '';
                                    return (raw.startsWith('http') && raw.includes('/avatars/')) ? '📸 Photo' : raw;
                                  })()}
                                </p>
                              </div>
                              <p>{msg.content.split('"\n\n').slice(1).join('"\n\n')}</p>
                            </>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>

                        <div className={`flex items-center justify-end gap-1.5 mt-0.5 select-none`}>
                          <span className={`text-[10px] font-semibold ${isMe ? 'text-blue-100/90' : 'text-slate-400 dark:text-slate-500'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                          {isMe && (
                            <span className={`flex translate-y-[1px]`}>
                              {msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-200" strokeWidth={3} />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-blue-300/80" strokeWidth={3} />
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-32" />
            </div>
          )}
        </div>
      </div>

      {/* Input Overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6"
        style={{ transform: `translateY(-${keyboardHeight}px)`, paddingBottom: `max(env(safe-area-inset-bottom), 12px)` }}
      >
        {isBlocked ? (
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center rounded-[30px] border border-white/70 bg-white/90 px-3 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/90">
            <span className="text-[15px] font-semibold text-slate-600 dark:text-slate-400">
              You blocked this user. Unblock to send messages.
            </span>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-[30px] border border-white/70 bg-white/90 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/90">
            {isSelectionMode ? (
              <div className="flex w-full items-center justify-around py-2">
                <button
                  onClick={() => handleMultiDelete('me')}
                  className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <Trash2 className="h-6 w-6" />
                  <span className="text-[10px] font-bold">Delete for me</span>
                </button>
                {messages.filter(m => selectedIds.includes(m.id)).every(m => m.sender_id === user?.id) && (
                  <button
                    onClick={() => handleMultiDelete('everyone')}
                    className="flex flex-col items-center gap-1 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Delete for everyone</span>
                  </button>
                )}
                <button
                  onClick={exitSelectionMode}
                  className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <X className="h-6 w-6" />
                  <span className="text-[10px] font-bold">Cancel</span>
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white disabled:opacity-50"
                >
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={2.2} />}
                </button>

                <div className="flex-1 rounded-[24px] border border-slate-200 bg-slate-50/90 min-h-[48px] flex flex-col justify-center shadow-inner dark:border-slate-800 dark:bg-slate-900/80 overflow-hidden">
                  <AnimatePresence>
                    {replyingTo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative flex items-center justify-between border-b border-slate-200/60 bg-slate-100/50 px-4 py-2 dark:border-slate-800/60 dark:bg-slate-800/50"
                      >
                        <div className="flex flex-1 flex-col overflow-hidden border-l-4 border-blue-500 pl-3">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {replyingTo.sender_id === user?.id ? 'You' : participant?.full_name || 'User'}
                          </span>
                          <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                            {replyingTo.message_type === 'image' ? '📸 Photo' : replyingTo.message_type === 'file' ? '📁 File' : replyingTo.content.replace(/\n/g, ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="ml-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full resize-none border-none bg-transparent px-4 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className={`
                    mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all active:scale-95
                    ${newMessage.trim()
                      ? 'bg-gradient-to-br from-[#3897f0] to-[#1d4ed8] text-white shadow-[0_12px_28px_rgba(59,130,246,0.28)]'
                      : 'border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'}
                  `}
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 translate-x-[1px] -translate-y-[1px]" />}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {keyboardHeight > 0 && <div className="absolute inset-0 z-40 bg-transparent" onClick={() => Keyboard.hide()} />}

      {/* --- PREMIUM CALLING OVERLAY --- */}
      <AnimatePresence mode="wait">
        {isCalling && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-slate-900/95 p-8 pb-16 backdrop-blur-2xl dark:bg-black/95 text-white"
          >
            <div className="mt-20 flex flex-col items-center text-center">
              <div className="relative mb-8">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-4 rounded-full bg-blue-500/20 blur-xl"
                />
                <div className="relative h-32 w-32 overflow-hidden rounded-[40px] border-4 border-slate-800/50 bg-slate-800 shadow-2xl">
                  {participant?.avatar_url ? (
                    <Image src={participant.avatar_url} alt="User" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black text-slate-500">
                      {participant?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-tight">{participant?.full_name || 'Scholar'}</h2>
              <p className="mt-2 text-lg font-medium text-slate-400">
                {isIncomingCall
                  ? `Incoming ${callType} call`
                  : callStatus === 'ringing'
                    ? `Ringing...`
                    : `Connected`}
              </p>
            </div>

            {/* Video Canvas for Video Calls */}
            {callType === 'video' && (
              <div className="absolute inset-0 z-[-1] overflow-hidden">
                {/* FIX 3: Use the RemoteVideoPlayer to stop re-render crashing */}
                {remoteUsers.length > 0 ? (
                  <RemoteVideoPlayer track={remoteUsers[0].videoTrack} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900">
                    <div className="h-full w-full bg-slate-900 animate-pulse" />
                  </div>
                )}
                {/* Local Video Preview */}
                <div className="absolute bottom-40 right-6 h-48 w-32 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-800 shadow-2xl">
                  {/* FIX 3: Safe local video rendering */}
                  <LocalVideoPlayer track={localVideoTrack} />
                </div>
              </div>
            )}

            <div className="flex w-full max-w-sm flex-col gap-6">
              {isIncomingCall && callStatus === 'ringing' ? (
                <div className="flex justify-center gap-12">
                  <button
                    onClick={endCall}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <PhoneOff className="h-8 w-8 text-white" />
                  </button>
                  <button
                    onClick={acceptCall}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Phone className="h-8 w-8 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={toggleMic}
                      className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${isMicOn ? 'bg-slate-800/80 text-white' : 'bg-red-500 text-white'}`}
                    >
                      {isMicOn ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
                    </button>
                    {callType === 'video' && (
                      <button
                        onClick={toggleCam}
                        className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${isCamOn ? 'bg-slate-800/80 text-white' : 'bg-red-500 text-white'}`}
                      >
                        {isCamOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
                      </button>
                    )}
                    <button
                      onClick={endCall}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                    >
                      <PhoneOff className="h-7 w-7" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <ChatRoomContent />
    </React.Suspense>
  )
}