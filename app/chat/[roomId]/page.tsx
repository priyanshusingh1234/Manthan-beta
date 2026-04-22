'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, MoreVertical, Send, Image as ImageIcon, CheckCheck, Check,
  Loader2, Trash2, Reply, X, Ban, Phone, Video, PhoneOff, Mic, MicOff,
  VideoOff, Copy, MessageSquare, RefreshCcw, Volume2, Ear
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { format, isToday, isYesterday } from 'date-fns';

// ─── Types ─────────────────────────────────────────────────────────────────
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
  is_teacher?: boolean;
}

const MESSAGES_CACHE_KEY = (r: string) => `chat_msgs_${r}`;
const PARTICIPANT_CACHE_KEY = (r: string) => `chat_part_${r}`;

// ─── Haptics (graceful) ─────────────────────────────────────────────────────
async function vibrate(style: 'light' | 'medium' = 'light') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: style === 'light' ? ImpactStyle.Light : ImpactStyle.Medium });
  } catch {
    if (navigator.vibrate) navigator.vibrate(style === 'light' ? 30 : 60);
  }
}

// ─── Sound ──────────────────────────────────────────────────────────────────
let notifAudioUnlocked = false;
let notifAudioContext: AudioContext | null = null;
function unlockNotifAudio() {
  if (notifAudioUnlocked) return;
  notifAudioUnlocked = true;
}
function playNotifSound() {
  try {
    if (typeof window !== 'undefined' && (window as any).playGlobalNotifSound) {
      (window as any).playGlobalNotifSound();
    } else {
        const fallback = new Audio('/universfield-new-notification-040-493469.mp3');
        fallback.volume = 1.0;
        fallback.play().catch(() => {});
    }
  } catch {}
}

// ─── Agora Video Players ─────────────────────────────────────────────────────
const RemoteVideoPlayer = memo(({ track }: { track: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (track && ref.current) track.play(ref.current); return () => { if (track) track.stop(); }; }, [track]);
  return <div ref={ref} className="h-full w-full object-cover" />;
});
const LocalVideoPlayer = memo(({ track }: { track: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (track && ref.current) track.play(ref.current); }, [track]);
  return <div ref={ref} className="h-full w-full scale-x-[-1] object-cover" />;
});

// ─── Message item (memoized) ─────────────────────────────────────────────────
const MessageItem = memo(function MessageItem({
  msg, user, participant, isSelectionMode, isSelected,
  onToggleSelection, onLongPress, onReply, prevMsg,
}: {
  msg: Message; user: any; participant: Participant | null;
  isSelectionMode: boolean; isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onLongPress: (msg: Message) => void;
  onReply: (msg: Message) => void;
  prevMsg?: Message;
}) {
  const isMe = msg.sender_id === user?.id;
  const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');
  const timeStr = format(new Date(msg.created_at), 'h:mm a');

  // Swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const swiping = useRef(false);
  const isScrolling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = true;
    isScrolling.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current || isScrolling.current) return;
    
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Detect if user is scrolling vertically
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      isScrolling.current = true;
      setSwipeX(0);
      return;
    }

    // Apply resistance (logarithmic-like)
    const resistance = covers(Math.abs(dx));
    function covers(x: number) {
      if (x < 30) return x;
      return 30 + (x - 30) * 0.4;
    }

    const val = dx > 0 ? resistance : -resistance;

    if (!isMe && dx > 0) setSwipeX(Math.min(val, 80));
    if (isMe && dx < 0) setSwipeX(Math.max(val, -80));
  };
  const handleTouchEnd = () => {
    swiping.current = false;
    const triggerThreshold = 65;
    if ((!isMe && swipeX >= triggerThreshold) || (isMe && swipeX <= -triggerThreshold)) {
      vibrate('light');
      onReply(msg);
    }
    setSwipeX(0);
  };

  // Long press
  const timerRef = useRef<any>(null);
  const handlePressStart = (e: React.TouchEvent | React.MouseEvent) => {
    timerRef.current = setTimeout(() => { vibrate('medium'); onLongPress(msg); }, 420);
  };
  const handlePressEnd = () => { clearTimeout(timerRef.current); };

  // Call message
  if (msg.content.startsWith('__CALL_ENDED__') || msg.content.startsWith('__CALL_STARTED__')) {
    const isStarted = msg.content.startsWith('__CALL_STARTED__');
    const type = msg.content.split(':')[1] || 'voice';
    const text = isStarted ? `${type} call started` : (msg.content.replace('__CALL_ENDED__:', '').trim() || 'Call ended');
    
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
          {type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
          <span className="capitalize">{text}</span>
        </div>
      </div>
    );
  }

  // Parse reply
  let replyAuthor = '', replyPreview = '', mainContent = msg.content;
  if (mainContent.startsWith('> Replying to **')) {
    const firstLine = mainContent.split('\n\n')[0];
    const rest = mainContent.split('\n\n').slice(1).join('\n\n');
    const match = firstLine.match(/\*\*(.+?)\*\*:\s*"?(.*)\"?$/);
    replyAuthor = match?.[1] || '';
    replyPreview = match?.[2]?.replace(/"$/, '') || '';
    mainContent = rest;
  }

  return (
    <div className="w-full flex flex-col">
      {showDate && (
        <div className="flex justify-center my-3">
          <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isToday(new Date(msg.created_at)) ? 'Today' : isYesterday(new Date(msg.created_at)) ? 'Yesterday' : format(new Date(msg.created_at), 'MMMM d, yyyy')}
          </span>
        </div>
      )}
      <div
        className={`flex items-center gap-2 mb-0.5 px-3 ${isMe ? 'justify-end' : 'justify-start'}`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping.current ? 'none' : 'transform 0.2s ease' }}
        onTouchStart={(e) => { handleTouchStart(e); handlePressStart(e); }}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { handleTouchEnd(); handlePressEnd(); }}
        onTouchCancel={handlePressEnd}
        onContextMenu={(e) => { e.preventDefault(); onLongPress(msg); }}
      >
        {/* Swipe reply hint */}
        {!isMe && swipeX > 20 && (
          <div className="absolute left-2 opacity-70">
            <Reply className="w-5 h-5 text-indigo-500" />
          </div>
        )}
        {isMe && swipeX < -20 && (
          <div className="absolute right-2 opacity-70">
            <Reply className="w-5 h-5 text-indigo-500 scale-x-[-1]" />
          </div>
        )}

        {isSelectionMode && (
          <div
            onClick={() => onToggleSelection(msg.id)}
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}
          >
            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
          </div>
        )}

        {/* Avatar for others */}
        {!isMe && (
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 self-end mb-0.5">
            {participant?.avatar_url
              ? <Image src={participant.avatar_url} alt="" width={28} height={28} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">{participant?.full_name?.[0]?.toUpperCase()}</div>
            }
          </div>
        )}

        {/* Bubble */}
        <div
          className={`max-w-[76%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
        >
          {replyAuthor && (
            <div className={`mb-1 px-3 py-1.5 rounded-xl text-[12px] border-l-[3px] max-w-full ${isMe ? 'bg-indigo-500/10 border-indigo-400' : 'bg-slate-100 dark:bg-slate-700 border-slate-400'}`}>
              <p className={`font-bold truncate ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{replyAuthor}</p>
              <p className="truncate text-slate-500 dark:text-slate-400">{replyPreview}</p>
            </div>
          )}
          <div
            className={`rounded-2xl overflow-hidden shadow-sm ${isSelected ? 'ring-2 ring-indigo-500' : ''} ${
              isMe
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700/50'
            }`}
          >
            {msg.message_type === 'image' || msg.content.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ? (
              <div className="relative w-[200px] h-[200px]">
                <Image src={msg.content} alt="Image" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <p className="px-3.5 py-2 text-[14.5px] leading-[1.5] whitespace-pre-wrap break-words">{mainContent}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{timeStr}</span>
            {isMe && (msg.is_read
              ? <CheckCheck className="w-3.5 h-3.5 text-indigo-500" strokeWidth={2.5} />
              : <Check className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Main content component
// ═══════════════════════════════════════════════════════════════════
function ChatRoomContent() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const initialName = searchParams.get('name') || '';

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [showContextSheet, setShowContextSheet] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMultiDeleteSheet, setShowMultiDeleteSheet] = useState(false);
  const isBlockedRef = useRef(isBlocked);

  useEffect(() => { isBlockedRef.current = isBlocked; }, [isBlocked]);

  // Agora call state
  const [callState, setCallState] = useState<'idle' | 'calling' | 'active' | 'incoming'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const rtcClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const processedCallIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const syncMessages = useCallback(async (currentUserId?: string) => {
    const activeUserId = currentUserId || user?.id;
    if (!activeUserId) return;

    const { data: latestMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(80);

    if (error || !latestMessages) return;

    const roomDeletedKey = `deleted_for_me_${roomId}`;
    const deletedIds = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
    const filtered = latestMessages.filter(m => !deletedIds.includes(m.id));

    setMessages(filtered);
    setLoading(false);
    localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(filtered.slice(-80)));

    const unread = filtered.filter(m => !m.is_read && m.sender_id !== activeUserId).map(m => m.id);
    if (unread.length) {
      supabase.from('chat_messages').update({ is_read: true }).in('id', unread);
    }

    // Smart sync for call state - run dynamically during sync polling
    const lastMsg = filtered[filtered.length - 1];
    if (lastMsg && lastMsg.content.startsWith('__CALL_STARTED__') && lastMsg.sender_id !== activeUserId) {
      if (processedCallIdRef.current !== lastMsg.id) {
        const createdAt = new Date(lastMsg.created_at).getTime();
        if (Date.now() - createdAt < 45000) { // Active call timeframe
          processedCallIdRef.current = lastMsg.id;
          const type = lastMsg.content.split(':')[1] as 'voice' | 'video';
          setCallType(type);
          setCallState('incoming');
        }
      }
    }
  }, [roomId, user?.id]);

  const syncBlockStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/chat/block-status?roomId=${encodeURIComponent(roomId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });

      if (!res.ok) return;
      const data = await res.json();
      setIsBlocked(Boolean(data.isBlocked));
    } catch (err) {
      console.warn('[ChatRoom] Failed to load block status:', err);
    }
  }, [roomId]);

  // ─── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push('/login'); return; }
      setUser(u);

      try {
        const cm = localStorage.getItem(MESSAGES_CACHE_KEY(roomId));
        const cp = localStorage.getItem(PARTICIPANT_CACHE_KEY(roomId));
        if (cm) { setMessages(JSON.parse(cm)); setLoading(false); setTimeout(() => scrollToBottom('auto'), 50); }
        if (cp) setParticipant(JSON.parse(cp));
      } catch {}

      const [pRes, mRes] = await Promise.all([
        supabase.from('chat_participants').select('user_id').eq('room_id', roomId).neq('user_id', u.id),
        supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(80),
      ]);

      if (pRes.data?.[0]?.user_id) {
        const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url, username, is_teacher').eq('id', pRes.data[0].user_id).single();
        if (prof) {
          const p = { user_id: pRes.data[0].user_id, ...prof } as Participant;
          setParticipant(p);
          localStorage.setItem(PARTICIPANT_CACHE_KEY(roomId), JSON.stringify(p));
        }
      }

      if (mRes.data) {
        const roomDeletedKey = `deleted_for_me_${roomId}`;
        const deletedIds = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');

        const filtered = mRes.data.filter(m => !deletedIds.includes(m.id));

        setMessages(filtered);
        setLoading(false);
        localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(filtered.slice(-80)));
        const unread = filtered.filter(m => !m.is_read && m.sender_id !== u.id).map(m => m.id);
        if (unread.length) supabase.from('chat_messages').update({ is_read: true }).in('id', unread);

        // Resume incoming call state if the last message is a recent CALL_STARTED
        const lastMsg = filtered[filtered.length - 1];
        if (lastMsg && lastMsg.content.startsWith('__CALL_STARTED__') && lastMsg.sender_id !== u.id) {
          const createdAt = new Date(lastMsg.created_at).getTime();
          if (Date.now() - createdAt < 45000) { // Call active within last 45s
            processedCallIdRef.current = lastMsg.id;
            const type = lastMsg.content.split(':')[1] as 'voice' | 'video';
            setCallType(type);
            setCallState('incoming');
          }
        }
      }
      
      await syncBlockStatus();

      setTimeout(() => scrollToBottom('auto'), 120);
    };
    init();
  }, [roomId, router, scrollToBottom, syncBlockStatus]);

  useEffect(() => {
    const unlock = () => unlockNotifAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      void syncMessages(user.id);
      void syncBlockStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id, syncMessages, syncBlockStatus]);

  // ─── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabaseRealtime
      .channel(`room-${roomId}`, { config: { presence: { key: user.id } } })
      .on('presence', { event: 'sync' }, () => setIsOnline(Object.keys(channel.presenceState()).length > 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const msg = payload.new as Message;
        
        // Handle Call Signals
        if (isBlockedRef.current) return;
        if (msg.content.startsWith('__CALL_STARTED__')) {
          if (msg.sender_id !== user.id) {
            processedCallIdRef.current = msg.id;
            const type = msg.content.split(':')[1] as 'voice' | 'video';
            setCallType(type);
            setCallState('incoming');
            playNotifSound();
            vibrate('medium');
          }
          return;
        }
        if (msg.content.startsWith('__CALL_ENDED__')) {
          if (msg.sender_id !== user.id) setCallState('idle');
          return;
        }

        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(updated.slice(-80)));
          return updated;
        });
        if (msg.sender_id !== user.id) {
          playNotifSound();
          vibrate('light');
          supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id);
        }
        setTimeout(() => scrollToBottom(), 60);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const upd = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === upd.id ? { ...m, ...upd } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const delId = (payload.old as any)?.id;
        if (delId) setMessages(prev => prev.filter(m => m.id !== delId));
      })
      .on('broadcast', { event: 'call-ended' }, () => {
        // Caller side: receiver declined/hung up — dismiss call overlay immediately
        setCallState('idle');
        setRemoteVideoTrack(null);
        setLocalVideoTrack(null);
      })
      .on('broadcast', { event: 'call-invite' }, ({ payload }) => {
        // Receiver side (inside chat room): show incoming call overlay directly
        if (payload.callerId !== user.id) {
          const type = payload.type as 'voice' | 'video';
          setCallType(type);
          setCallState('incoming');
          playNotifSound();
          vibrate('medium');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to room:', roomId);
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    channelRef.current = channel;
    return () => { supabaseRealtime.removeChannel(channel); };
  }, [roomId, user?.id, scrollToBottom]);

  // ─── Keyboard height ─────────────────────────────────────────────────────
  useEffect(() => {
    const keyboardUp = (e: any) => {
      if (e.keyboardHeight) {
        document.documentElement.style.setProperty('--kb-height', `${e.keyboardHeight}px`);
        setTimeout(() => scrollToBottom(), 100);
      }
    };
    const keyboardDown = () => document.documentElement.style.setProperty('--kb-height', '0px');
    window.addEventListener('keyboardWillShow', keyboardUp);
    window.addEventListener('keyboardDidShow', keyboardUp);
    window.addEventListener('keyboardWillHide', keyboardDown);
    window.addEventListener('keyboardDidHide', keyboardDown);
    return () => {
      window.removeEventListener('keyboardWillShow', keyboardUp);
      window.removeEventListener('keyboardDidShow', keyboardUp);
      window.removeEventListener('keyboardWillHide', keyboardDown);
      window.removeEventListener('keyboardDidHide', keyboardDown);
    };
  }, [scrollToBottom]);

  // ─── Send message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !user || sending) return;

    let content = newMessage.trim();
    if (replyingTo) {
      const isImage = replyingTo.message_type === 'image';
      const preview = isImage ? 'Photo 📷' : replyingTo.content.slice(0, 40);
      const who = replyingTo.sender_id === user.id ? 'You' : (participant?.full_name || 'Scholar');
      content = `> Replying to **${who}**: "${preview}"\n\n${content}`;
      setReplyingTo(null);
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, room_id: roomId, sender_id: user.id, content, created_at: new Date().toISOString(), is_read: false, message_type: 'text' };
    setMessages(p => [...p, optimistic]);
    setNewMessage('');
    setSending(true);
    setTimeout(() => scrollToBottom(), 50);
    // Reset textarea height
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    try {
      const { data, error } = await supabase.from('chat_messages').insert({ room_id: roomId, sender_id: user.id, content, message_type: 'text' }).select('*').single();
      if (error) throw error;
      if (data) {
        setMessages(p => p.map(m => m.id === tempId ? data : m));
        // Send Push Notification
        if (participant?.user_id) {
          fetch('/api/chat/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: participant.user_id,
              senderId: user.id,
              roomId: roomId,
              content: content.substring(0, 50)
            })
          }).catch(() => {});
        }
      }
    } catch {
      setMessages(p => p.filter(m => m.id !== tempId));
      setNewMessage(content);
    } finally { setSending(false); }
  }, [newMessage, user, sending, replyingTo, participant, roomId, scrollToBottom]);

  // ─── Delete messages ──────────────────────────────────────────────────────
  const deleteMessages = async (ids: string[]) => {
    await supabase.from('chat_messages').delete().in('id', ids);
    setMessages(p => p.filter(m => !ids.includes(m.id)));
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const deleteForMe = (ids: string[]) => {
    const roomDeletedKey = `deleted_for_me_${roomId}`;
    const existing = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
    const updated = [...new Set([...existing, ...ids])];
    localStorage.setItem(roomDeletedKey, JSON.stringify(updated));
    setMessages(p => p.filter(m => !ids.includes(m.id)));
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  // ─── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);
      const res = await fetch('/api/chat/upload', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` }, body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const uploadData = await res.json();
      
      const { data, error } = await supabase.from('chat_messages').insert({ 
        room_id: roomId, 
        sender_id: user.id, 
        content: uploadData.publicUrl, 
        message_type: 'image' 
      }).select('*').single();
      
      if (error) throw error;
      
      if (participant?.user_id) {
        fetch('/api/chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.user_id,
            senderId: user.id,
            roomId: roomId,
            content: '📸 Image'
          })
        }).catch(() => {});
      }
    } catch (err: any) { alert(err.message); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // ─── Agora call ───────────────────────────────────────────────────────────
  const startCall = async (type: 'voice' | 'video', isAnswering = false) => {
    if (isBlocked) return alert('You cannot call a blocked user.');
    setCallType(type);
    setCallState('calling');
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
        const tokenRes = await fetch(`/api/agora/token?channel=${encodeURIComponent(roomId)}&uid=${uid}`, { cache: 'no-store' });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          token = tokenData?.token || null;
        } else {
          const tokenErr = await tokenRes.json().catch(() => ({}));
          throw new Error(tokenErr.error || 'Failed to fetch Agora token');
        }
      } catch (tokenError: any) {
        throw new Error(tokenError?.message || 'Failed to fetch Agora token');
      }
      if (!appId || !token) {
        throw new Error('Calling is not configured. Missing Agora App ID or token.');
      }
      await client.join(appId, roomId, token, uid);
      
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
         if (devices.length > 0) setCurrentCameraIdx(0);
      } catch(e) {}
      
      setCallState('active');
      // Notify other party only if we are starting a NEW call, not answering an existing one
      if (!isAnswering) {
        await supabase.from('chat_messages').insert({ room_id: roomId, sender_id: user.id, content: `__CALL_STARTED__:${type}`, message_type: 'text' });
        channelRef.current?.send({
          type: 'broadcast',
          event: 'call-invite',
          payload: {
            callerId: user.id,
            callerName: participant?.full_name || 'Scholar',
            type,
          }
        }).catch(() => {});
        
        // Push notification for incoming call
        if (participant?.user_id) {
            fetch('/api/chat/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: participant.user_id,
                    senderId: user.id,
                    roomId: roomId,
                    content: `📞 Incoming ${type} call`
                })
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

  const endCall = async () => {
    try {
      localAudioTrackRef.current?.stop(); localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.stop(); localVideoTrackRef.current?.close();
      await rtcClientRef.current?.leave();
    } catch {}
    setCallState('idle');
    setRemoteVideoTrack(null);
    setLocalVideoTrack(null);
    
    // Only insert CALL_ENDED if it was an active call or if we are outright terminating it
    await supabase.from('chat_messages').insert({ room_id: roomId, sender_id: user.id, content: `__CALL_ENDED__: ${callType} call ended`, message_type: 'text' });
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-ended',
      payload: { roomId }
    }).catch(() => {});

    // Push a 'missed call' FCM notification to OVERWRITE the ringing notification on their phone
    // (uses same tag as incoming_call, so Android replaces it silently and stops the ring)
    if (participant?.user_id) {
      fetch('/api/chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: participant.user_id,
          senderId: user.id,
          roomId: roomId,
          content: '__CALL_ENDED__'
        })
      }).catch(() => {});
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
  const toggleSpeaker = () => {
     // Natively on Capacitor Web, true hardware routing requires a native plugin.
     // We toggle the state for visual feedback and future plugin integration.
     setIsSpeaker(v => !v);
  };
  const flipCamera = async () => {
    if (!localVideoTrackRef.current) return;
    try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        const devices = await AgoraRTC.getCameras();
        if (devices.length > 1) {
            const nextIdx = (currentCameraIdx + 1) % devices.length;
            await localVideoTrackRef.current.setDevice(devices[nextIdx].deviceId);
            setCurrentCameraIdx(nextIdx);
        }
    } catch (err) {
        console.error('Failed to flip camera:', err);
    }
  };

  // ─── Long press handler ───────────────────────────────────────────────────
  const handleLongPress = (msg: Message) => {
    vibrate('medium');
    setContextMsg(msg);
    setShowContextSheet(true);
  };

  const displayName = participant?.full_name || initialName || 'Chat';

  // ─── Agora Call Overlay ───────────────────────────────────────────────────
  if (callState !== 'idle') {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col items-center justify-between py-16" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {callType === 'video' && remoteVideoTrack ? (
          <div className="absolute inset-0"><RemoteVideoPlayer track={remoteVideoTrack} /></div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-indigo-600/20 border-4 border-indigo-500/40 flex items-center justify-center text-5xl font-black text-indigo-300">
              {displayName[0]?.toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Local PiP */}
        {callType === 'video' && localVideoTrack && !isCamOff && (
          <div className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 transition-all">
            <LocalVideoPlayer track={localVideoTrack} />
          </div>
        )}

        <div className="relative z-10 text-center animate-in fade-in duration-500">
          <h2 className="text-white text-3xl font-black tracking-tight">{displayName}</h2>
          <p className="text-slate-400 text-sm font-medium mt-2">
            {callState === 'calling' ? 'Calling...' : callState === 'incoming' ? `Incoming ${callType} call` : `${callType === 'video' ? 'Video' : 'Voice'} active`}
          </p>
        </div>

        {callState === 'incoming' ? (
          <div className="relative z-10 flex items-center justify-center gap-12 mb-8 scale-110">
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center shadow-xl shadow-rose-900/40 active:scale-90 transition-transform">
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button onClick={() => startCall(callType, true)} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-900/40 active:scale-90 transition-transform animate-bounce">
              <Phone className="w-7 h-7 text-white" />
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex items-center justify-center gap-6 mb-8">
            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/10'}`}>
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callType === 'video' ? (
              <>
                <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${isCamOff ? 'bg-rose-500 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/10'}`}>
                  {isCamOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
                <button onClick={flipCamera} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors bg-white/10 backdrop-blur-md text-white border border-white/10">
                  <RefreshCcw className="w-6 h-6" />
                </button>
              </>
            ) : (
               <button onClick={toggleSpeaker} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${!isSpeaker ? 'bg-rose-500 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/10'}`}>
                  {isSpeaker ? <Volume2 className="w-6 h-6" /> : <Ear className="w-6 h-6" />}
               </button>
            )}

            <button onClick={endCall} className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center shadow-xl shadow-rose-900/40 active:scale-95 transition-transform">
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden"
      onClick={() => { if (showHeaderMenu) setShowHeaderMenu(false); }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {isSelectionMode ? (
          <div className="flex items-center gap-2 px-3 h-14">
            <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
              <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            <span className="flex-1 font-bold text-[16px] text-slate-900 dark:text-white">{selectedIds.length} selected</span>
            <button
              onClick={() => { if (contextMsg) { setReplyingTo(contextMsg); setIsSelectionMode(false); setSelectedIds([]); setTimeout(() => inputRef.current?.focus(), 100); } }}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Reply className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowMultiDeleteSheet(true)}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-rose-500"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const texts = selectedIds.map(id => messages.find(m => m.id === id)?.content || '').join('\n');
                navigator.clipboard.writeText(texts).catch(() => {});
              }}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 h-14">
            <button onClick={() => router.push('/chat')} className="p-2 -ml-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800 shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            {/* Fixed small avatar — never overflows */}
            <div
              className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 cursor-pointer"
              onClick={() => participant?.username && router.push(`/user/${participant.username}`)}
            >
              {participant?.avatar_url
                ? <Image src={participant.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-base">{displayName[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => participant?.username && router.push(`/user/${participant.username}`)}>
              <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-400 font-medium">{isOnline ? '🟢 Online' : 'Tap for info'}</p>
            </div>
            <button onClick={() => startCall('voice')} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => startCall('video')} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              <Video className="w-5 h-5" />
            </button>
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShowHeaderMenu(v => !v); }}
                className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 top-11 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {participant?.username && (
                    <button onClick={() => { setShowHeaderMenu(false); router.push(`/user/${participant.username}`); }}
                      className="w-full text-left px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 active:bg-slate-100">
                      View Profile
                    </button>
                  )}
                  <button onClick={() => { setShowHeaderMenu(false); setIsSelectionMode(true); }}
                    className="w-full text-left px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 active:bg-slate-100">
                    Select Messages
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setShowHeaderMenu(false);
                        const partId = participant?.user_id;
                        if (!partId || !user?.id) return;
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) return alert('Please sign in again to update block settings.');

                        const res = await fetch('/api/chat/block', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`,
                          },
                          body: JSON.stringify({
                            targetUserId: partId,
                            action: isBlocked ? 'unblock' : 'block',
                          }),
                        });

                        const payload = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          throw new Error(payload.error || 'Unable to update block settings');
                        }

                        alert(isBlocked ? `${participant?.full_name} has been unblocked.` : `${participant?.full_name} has been blocked.`);
                        setIsBlocked(!isBlocked);
                        if (!isBlocked) {
                          router.push('/chat');
                        }
                      } catch (err: any) {
                        alert(err.message || 'Unable to update block settings');
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold hover:bg-red-50 dark:hover:bg-rose-900/10 flex items-center gap-3 active:bg-red-50 border-t border-slate-100 dark:border-slate-800 ${isBlocked ? 'text-indigo-500' : 'text-rose-500'}`}
                  >
                    <Ban className="w-4 h-4" /> {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      
      {isBlocked && (
        <div className="bg-rose-50 dark:bg-rose-950/30 px-4 py-2 flex items-center justify-center gap-2 border-b border-rose-100 dark:border-rose-900/50">
          <Ban className="w-3.5 h-3.5 text-rose-500" />
          <p className="text-[11px] font-bold text-rose-500 uppercase tracking-tight">You have blocked this scholar</p>
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto py-2 space-y-0.5"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={() => { if (showContextSheet) setShowContextSheet(false); if (showHeaderMenu) setShowHeaderMenu(false); }}
      >
        {loading ? (
          <div className="flex flex-col gap-3 px-4 py-4 w-full">
            {/* Incoming skeleton */}
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0 self-end" />
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm p-4 w-[60%] animate-pulse" />
            </div>
            {/* Outgoing skeleton */}
            <div className="flex flex-row-reverse gap-2 mt-2">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl rounded-br-sm p-4 w-[50%] animate-pulse" />
            </div>
            {/* Short Outgoing skeleton */}
            <div className="flex flex-row-reverse gap-2 mt-1">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl rounded-br-sm p-3 w-[30%] animate-pulse" />
            </div>
            {/* Incoming skeleton */}
            <div className="flex gap-2 mt-4">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0 self-end" />
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm p-5 w-[75%] animate-pulse" />
            </div>
            {/* Outgoing skeleton */}
            <div className="flex flex-row-reverse gap-2 mt-2">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl rounded-br-sm p-3 w-[45%] animate-pulse" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Say hi to {displayName}! 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              user={user}
              participant={participant}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(msg.id)}
              onToggleSelection={(id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
              onLongPress={handleLongPress}
              onReply={(m) => { setReplyingTo(m); setTimeout(() => inputRef.current?.focus(), 100); }}
              prevMsg={messages[idx - 1]}
            />
          ))
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* ── Context sheet (long press) ────────────────────────────────────── */}
      {showContextSheet && contextMsg && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowContextSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-3" />
            {/* Message preview */}
            <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{contextMsg.content.slice(0, 60)}</p>
            </div>
            {[
              { icon: Reply, label: 'Reply', color: 'text-indigo-600', action: () => { setReplyingTo(contextMsg); setShowContextSheet(false); setTimeout(() => inputRef.current?.focus(), 100); } },
              {
                icon: Copy, label: 'Copy', color: 'text-slate-700 dark:text-slate-200', action: () => {
                  navigator.clipboard.writeText(contextMsg.content).catch(() => {});
                  setShowContextSheet(false);
                }
              },
              {
                icon: Check, label: 'Select', color: 'text-slate-700 dark:text-slate-200', action: () => {
                  setIsSelectionMode(true);
                  setSelectedIds([contextMsg.id]);
                  setShowContextSheet(false);
                }
              },
              {
                icon: Trash2, label: 'Delete for Me', color: 'text-rose-500', action: () => {
                  setShowContextSheet(false);
                  if (confirm('Delete this message for you?')) {
                    const roomDeletedKey = `deleted_for_me_${roomId}`;
                    const existing = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
                    const updated = [...new Set([...existing, contextMsg.id])];
                    localStorage.setItem(roomDeletedKey, JSON.stringify(updated));
                    setMessages(p => p.filter(m => m.id !== contextMsg.id));
                  }
                }
              },
              ...(contextMsg.sender_id === user?.id ? [{
                icon: Trash2, label: 'Delete for Everyone', color: 'text-rose-600', action: () => {
                  setShowContextSheet(false);
                  if (confirm('Delete this message for everyone?')) deleteMessages([contextMsg.id]);
                }
              }] : []),
            ].map(({ icon: Icon, label, color, action }) => (
              <button key={label} onClick={action} className={`w-full flex items-center gap-4 px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800 ${label === 'Delete' ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
                <div className={`w-10 h-10 rounded-full ${label === 'Delete' ? 'bg-rose-50 dark:bg-rose-900/20' : label === 'Reply' ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-100 dark:bg-slate-800'} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className={`font-semibold ${color}`}>{label}</span>
              </button>
            ))}
            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </div>
        </>
      )}

      {/* ── Multi-Delete Action Sheet ────────────────────────────────────── */}
      {showMultiDeleteSheet && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowMultiDeleteSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-3" />
            <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center">Delete {selectedIds.length} Option{selectedIds.length > 1 ? 's' : ''}</p>
            </div>
            
            <button 
              onClick={() => {
                setShowMultiDeleteSheet(false);
                deleteForMe(selectedIds);
              }} 
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Delete for Me</span>
            </button>

            {selectedIds.filter(id => messages.find(m => m.id === id)?.sender_id === user?.id).length === selectedIds.length && (
              <button 
                onClick={() => {
                  setShowMultiDeleteSheet(false);
                  deleteMessages(selectedIds);
                }} 
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <span className="font-semibold text-rose-500">Delete for Everyone</span>
              </button>
            )}
            
            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </div>
        </>
      )}

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 4px)' }}
      >
        {/* Reply preview */}
        {replyingTo && (
          <div className="flex items-center gap-3 px-4 pt-2.5 pb-0">
            <div className="flex-1 border-l-[3px] border-indigo-500 pl-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-xl min-w-0">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                Replying to {replyingTo.sender_id === user?.id ? 'yourself' : participant?.full_name}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{replyingTo.content.slice(0, 50)}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* Image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 shrink-0 mb-0.5"
          >
            {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <ImageIcon className="w-5 h-5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {/* Auto-growing textarea */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 min-h-[40px]">
            <textarea
              ref={inputRef}
              rows={1}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                // Desktop: Enter = send, Shift+Enter = newline
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Message..."
              className="w-full bg-transparent text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none resize-none leading-[1.4]"
              style={{ overflowY: 'hidden' }}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || isBlocked}
            className="w-10 h-10 bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 rounded-full flex items-center justify-center shadow-md shadow-indigo-600/20 disabled:shadow-none active:scale-90 transition-all shrink-0 mb-0.5"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>
      <audio id="chat-notif-audio" src="/universfield-new-notification-040-493469.mp3" preload="auto" />
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
      </div>
    }>
      <ChatRoomContent />
    </React.Suspense>
  );
}