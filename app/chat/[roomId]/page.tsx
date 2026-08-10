'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, MoreVertical, Send, Image as ImageIcon, CheckCheck, Check,
  Loader2, Trash2, Reply, X, Ban, Phone, Video, PhoneOff, Mic, MicOff,
  VideoOff, Copy, MessageSquare, RefreshCcw, Volume2, Ear, Edit2, Smile
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { useCallContext } from '@/components/CallProvider';
import { format, isToday, isYesterday } from 'date-fns';
import BadgedName from '@/components/BadgedName';
import LinkPreview from '@/components/LinkPreview';
import { compressImage } from '@/utils/compressImage';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL } from '@/lib/uploadLimits';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'file' | 'image_once';
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
// Absolute links: optional protocol + valid domain labels + /posts/{id} or /questions/{id}
const CHAT_ABSOLUTE_LINK_PATTERN = /(?:https?:\/\/)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/posts\/|\/questions\/)[a-zA-Z0-9_-]+/;
// Relative links: /posts/{id} or /questions/{id}
const CHAT_RELATIVE_LINK_PATTERN = /(?:\/posts\/|\/questions\/)[a-zA-Z0-9_-]+/;
const CHAT_LINK_PREVIEW_REGEX = new RegExp(`(${CHAT_ABSOLUTE_LINK_PATTERN.source}|${CHAT_RELATIVE_LINK_PATTERN.source})`, 'i');

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
      fallback.play().catch(() => { });
    }
  } catch { }
}

// ─── Message item (memoized) ─────────────────────────────────────────────────
const MessageItem = memo(function MessageItem({
  msg, user, participant, isSelectionMode, isSelected,
  onToggleSelection, onLongPress, onReply, prevMsg, onImageClick, onReaction
}: {
  msg: Message; user: any; participant: Participant | null;
  isSelectionMode: boolean; isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onLongPress: (msg: Message) => void;
  onReply: (msg: Message) => void;
  prevMsg?: Message;
  onImageClick: (url: string, msgType: string, msgId: string, isSender: boolean) => void;
  onReaction: (msgId: string, emoji: string) => void;
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

  // Long press
  const timerRef = useRef<any>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = true;
    isScrolling.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Cancel long press if the finger moves significantly
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearTimeout(timerRef.current);
    }

    if (isScrolling.current) return;

    // Detect if user is scrolling vertically
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
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
    clearTimeout(timerRef.current);
    const triggerThreshold = 65;
    if (!isScrolling.current && ((!isMe && swipeX >= triggerThreshold) || (isMe && swipeX <= -triggerThreshold))) {
      vibrate('light');
      onReply(msg);
    }
    setSwipeX(0);
  };

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
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          {type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
          <span className="capitalize">{text}</span>
        </div>
      </div>
    );
  }

  // Theme change message
  if (msg.content.startsWith('__THEME_CHANGE__:')) {
    const themeName = msg.content.split(':')[1] || 'doodle';
    const text = isMe ? `You changed the chat theme to ${themeName}` : `${participant?.full_name || 'They'} changed the chat theme to ${themeName}`;
    return (
      <div className="flex justify-center my-3 px-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
          <span className="capitalize">✨ {text}</span>
        </div>
      </div>
    );
  }

  let rawContent = msg.content;
  let meta: any = {};
  if (rawContent.includes('|||META|||')) {
    const parts = rawContent.split('|||META|||');
    rawContent = parts[0];
    try { meta = JSON.parse(parts[1]); } catch { }
  }

  let replyAuthor = '', replyPreview = '', mainContent = rawContent;
  if (mainContent.startsWith('> Replying to **')) {
    const splitIndex = mainContent.indexOf('\n\n');
    if (splitIndex !== -1) {
      const firstLine = mainContent.substring(0, splitIndex);
      const rest = mainContent.substring(splitIndex + 2);
      const match = firstLine.match(/> Replying to \*\*(.+?)\*\*:\s*"?(.*?)"?$/);
      if (match) {
        replyAuthor = match[1];
        replyPreview = match[2];
        mainContent = rest;
      }
    }
  }

  return (
    <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
      {showDate && (
        <div className="flex justify-center my-3">
          <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isToday(new Date(msg.created_at)) ? 'Today' : isYesterday(new Date(msg.created_at)) ? 'Yesterday' : format(new Date(msg.created_at), 'MMMM d, yyyy')}
          </span>
        </div>
      )}
      <div
        className={`flex items-center gap-2 mb-0.5 px-3 ${isMe ? 'justify-end' : 'justify-start'}`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
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
            className={`rounded-2xl overflow-hidden shadow-sm ${isSelected ? 'ring-2 ring-indigo-500' : ''} ${isMe
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700/50'
              }`}
          >
            {msg.message_type === 'image_once' ? (
              <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none active:bg-black/5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(rawContent, msg.message_type, msg.id, isMe);
                }}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isMe ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm leading-none ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Photo</span>
                  <span className={`text-[10px] font-semibold mt-0.5 opacity-80 ${isMe ? 'text-white/80' : 'text-slate-500'}`}>View once</span>
                </div>
              </div>
            ) : msg.message_type === 'image' || rawContent.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ? (
              <div
                className="relative w-[200px] h-[200px] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(rawContent, msg.message_type, msg.id, isMe);
                }}
              >
                <Image src={rawContent} alt="Image" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex flex-col">
                <p className="px-3.5 py-2 text-[14.5px] leading-[1.5] whitespace-pre-wrap break-words">
                  {mainContent}
                  {meta.edited && <span className="text-[10px] opacity-70 italic ml-1.5 font-medium">(edited)</span>}
                </p>
                {(() => {
                  const urlMatch = mainContent.match(CHAT_LINK_PREVIEW_REGEX);
                  const previewUrl = urlMatch ? urlMatch[0] : null;
                  return previewUrl ? (
                    <div className="px-2 pb-2 pt-0 w-full max-w-[280px]">
                      <LinkPreview url={previewUrl} />
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          {meta.reactions && Object.keys(meta.reactions).length > 0 && (
            <div className={`flex gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'} max-w-[200px] flex-wrap`}>
              {Object.entries(meta.reactions).map(([emoji, users]) => (
                <div key={emoji} onClick={() => onReaction(msg.id, emoji)} className={`rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1 border shadow-sm cursor-pointer select-none active:scale-95 transition-transform ${((users as string[]).includes(user?.id)) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                  <span>{emoji}</span>
                  <span className={`font-bold ${((users as string[]).includes(user?.id)) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{Array.isArray(users) ? users.length : 1}</span>
                </div>
              ))}
            </div>
          )}
          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{timeStr}</span>
            {isMe && (msg.is_read
              ? <div className="flex items-center gap-0.5" title="Read"><CheckCheck className="w-3.5 h-3.5 text-indigo-500" strokeWidth={2.5} /><span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Seen</span></div>
              : <div className="flex items-center gap-0.5" title="Sent"><Check className="w-3 h-3 text-slate-400" strokeWidth={2.5} /><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sent</span></div>
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
  const callCtx = useCallContext();

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [showContextSheet, setShowContextSheet] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ status: string, created_by: string } | null>(null);
  const [showMultiDeleteSheet, setShowMultiDeleteSheet] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [theme, setTheme] = useState('doodle');
  const [showThemeModal, setShowThemeModal] = useState(false);
  // Incoming call banner — shown when the OTHER party starts a call while we are
  // already on this chat page (GlobalCallListener skips this room in that case)
  const [incomingCallBanner, setIncomingCallBanner] = useState<{ type: 'voice' | 'video', callerId: string } | null>(null);
  const incomingCallBannerRef = useRef<{ type: 'voice' | 'video', callerId: string } | null>(null);
  const isBlockedRef = useRef(isBlocked);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => { isBlockedRef.current = isBlocked; }, [isBlocked]);



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
      .order('created_at', { ascending: false })  // newest first
      .limit(80);

    if (error || !latestMessages) return;

    // ─── Call Banner Detection via Manual Polling ───
    if (!isBlockedRef.current && latestMessages.length > 0) {
      const newestMsg = latestMessages[0];
      if (
        newestMsg.content.startsWith('__CALL_STARTED__') &&
        newestMsg.sender_id !== activeUserId &&
        !callCtx.callActive.current &&
        processedCallIdRef.current !== newestMsg.id
      ) {
        const ageMs = Date.now() - new Date(newestMsg.created_at).getTime();
        if (ageMs < 45000) { // Call is still ringing
          processedCallIdRef.current = newestMsg.id;
          const callType = (newestMsg.content.split(':')[1] || 'voice') as 'voice' | 'video';
          const banner = { type: callType, callerId: newestMsg.sender_id };
          setIncomingCallBanner(banner);
          incomingCallBannerRef.current = banner;
          playNotifSound();
          vibrate('medium');
          setTimeout(() => {
            setIncomingCallBanner(null);
            incomingCallBannerRef.current = null;
          }, Math.max(0, 45000 - ageMs));
        }
      }
      if (newestMsg.content.startsWith('__CALL_ENDED__') && processedCallIdRef.current) {
        setIncomingCallBanner(null);
        incomingCallBannerRef.current = null;
      }
    }

    const roomDeletedKey = `deleted_for_me_${roomId}`;
    const deletedIds = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
    // Reverse so messages are displayed oldest→newest
    const filtered = latestMessages.slice().reverse().filter(m => !deletedIds.includes(m.id));

    // Merge DB messages with any optimistic messages still in flight.
    // Without this, the 1-second poll would replace the entire array and wipe
    // optimistic messages before they are confirmed/rejected by the server.
    const unreadIds = new Set(filtered.filter(m => !m.is_read && m.sender_id !== activeUserId).map(m => m.id));
    // Optimistically mark as read in the local copy before setting state
    const filteredWithRead = unreadIds.size
      ? filtered.map(m => unreadIds.has(m.id) ? { ...m, is_read: true } : m)
      : filtered;

    setMessages(prev => {
      const dbIds = new Set(filteredWithRead.map(m => m.id));
      // Keep optimistic (temp-*) messages that haven't landed in the DB yet
      const stillPending = prev.filter(m => m.id.startsWith('temp-') && !dbIds.has(m.id));
      const merged = [...filteredWithRead, ...stillPending];
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return merged;
    });

    setLoading(false);
    localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(filteredWithRead.slice(-80)));

    if (unreadIds.size) {
      fetch('/api/chat/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: [...unreadIds] }) }).catch(() => { });
      try {
        const cacheKey = `chat_rooms_cache_${activeUserId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          let didUpdate = false;
          const newCache = parsed.map((r: any) => {
            if (r.id === roomId && r.last_message && !r.last_message.is_read) {
              didUpdate = true;
              return { ...r, last_message: { ...r.last_message, is_read: true } };
            }
            return r;
          });
          if (didUpdate) localStorage.setItem(cacheKey, JSON.stringify(newCache));
        }
      } catch { }
    }
    // Note: autoAccept / startCall is intentionally NOT done here.
    // syncMessages runs every 1 second and has a stale closure — doing startCall
    // here would cause double Agora joins. Only init() handles autoAccept.
  }, [roomId, user?.id]);

  const loadMoreMessages = useCallback(async () => {
    if (!messages.length || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const oldestMsg = messages[0];
      const { data: olderMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .lt('created_at', oldestMsg.created_at)
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      if (!olderMessages || olderMessages.length < 80) setHasMore(false);

      if (olderMessages && olderMessages.length > 0) {
        const roomDeletedKey = `deleted_for_me_${roomId}`;
        const deletedIds = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
        const filtered = olderMessages.slice().reverse().filter(m => !deletedIds.includes(m.id));
        setMessages(prev => {
          const dbIds = new Set(filtered.map(m => m.id));
          const merged = [...filtered, ...prev.filter(m => !dbIds.has(m.id))];
          merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return merged;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [messages, roomId, loadingMore, hasMore]);


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
      } catch { }

      try {
        const [pRes, mRes, rRes] = await Promise.all([
          supabase.from('chat_participants').select('user_id').eq('room_id', roomId).neq('user_id', u.id),
          supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(80),
          supabase.from('chat_rooms').select('status, created_by, theme').eq('id', roomId).single(),
        ]);

        if (rRes.data) {
          let finalStatus = rRes.data;
          setTheme(rRes.data.theme || 'doodle');
          if (rRes.data.status === 'pending' && pRes.data?.[0]?.user_id) {
            const { data: followData } = await supabase
              .from('follows')
              .select('follower_id')
              .or(`and(follower_id.eq.${u.id},following_id.eq.${pRes.data[0].user_id}),and(follower_id.eq.${pRes.data[0].user_id},following_id.eq.${u.id})`)
              .limit(1);
            if (followData && followData.length > 0) {
              finalStatus.status = 'approved';
              supabase.from('chat_rooms').update({ status: 'approved' }).eq('id', roomId).then();
            }
          }
          setRoomStatus(finalStatus);
        }

        let profData: any = null;
        if (pRes.data?.[0]?.user_id) {
          const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url, username, is_teacher').eq('id', pRes.data[0].user_id).single();
          if (prof) {
            profData = prof;
            const p = { user_id: pRes.data[0].user_id, ...prof } as Participant;
            setParticipant(p);
            localStorage.setItem(PARTICIPANT_CACHE_KEY(roomId), JSON.stringify(p));
          }
        }

        if (mRes.data) {
          if (mRes.data.length < 80) setHasMore(false);
          const roomDeletedKey = `deleted_for_me_${roomId}`;
          const deletedIds = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
          const filtered = mRes.data.slice().reverse().filter(m => !deletedIds.includes(m.id));

          const unreadIds = new Set(filtered.filter(m => !m.is_read && m.sender_id !== u.id).map(m => m.id));
          // Optimistically flip is_read so UI is immediately correct
          const filteredWithRead = unreadIds.size
            ? filtered.map(m => unreadIds.has(m.id) ? { ...m, is_read: true } : m)
            : filtered;

          setMessages(filteredWithRead);
          localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(filteredWithRead.slice(-80)));
          if (unreadIds.size) {
            fetch('/api/chat/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: [...unreadIds] }) }).catch(() => { });
            try {
              const cacheKey = `chat_rooms_cache_${u.id}`;
              const cached = localStorage.getItem(cacheKey);
              if (cached) {
                const parsed = JSON.parse(cached);
                let didUpdate = false;
                const newCache = parsed.map((r: any) => {
                  if (r.id === roomId && r.last_message && !r.last_message.is_read) {
                    didUpdate = true;
                    return { ...r, last_message: { ...r.last_message, is_read: true } };
                  }
                  return r;
                });
                if (didUpdate) localStorage.setItem(cacheKey, JSON.stringify(newCache));
              }
            } catch { }
          }

          if (
            searchParams.get('autoAccept') === '1' &&
            !callCtx.callActive.current
          ) {
            const callMsg = [...filtered].reverse().find(
              m => m.content.startsWith('__CALL_STARTED__') &&
                m.sender_id !== u.id &&
                (Date.now() - new Date(m.created_at).getTime() < 60000)
            );

            const type = (searchParams.get('callType') as 'voice' | 'video')
              || (callMsg?.content.split(':')[1] as 'voice' | 'video')
              || 'voice';
            const callerId = searchParams.get('callerId') || pRes.data?.[0]?.user_id;
            const callerName = searchParams.get('callerName')
              ? decodeURIComponent(searchParams.get('callerName')!)
              : (profData?.full_name || 'Scholar');

            if (callMsg) {
              processedCallIdRef.current = callMsg.id;
            }

            callCtx.startCall(roomId, type, callerId, callerName, true);
          }
        }

        if (searchParams.get('reply') === '1') {
          setTimeout(() => inputRef.current?.focus(), 300);
        }

        await syncBlockStatus();
        setTimeout(() => scrollToBottom('auto'), 120);
      } catch (err) {
        console.error("Failed to load chat data", err);
      } finally {
        setLoading(false);
      }
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
    }, 1500);

    return () => clearInterval(interval);
  }, [user?.id, syncMessages]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      void syncBlockStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, syncBlockStatus]);

  // ─── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabaseRealtime
      .channel(`room-${roomId}`, {
        config: {
          presence: { key: user.id },
          broadcast: { self: false, ack: false }
        }
      })
      .on('presence', { event: 'sync' }, () => setIsOnline(Object.keys(channel.presenceState()).length > 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const msg = payload.new as Message;

        // Handle Call Signals
        if (isBlockedRef.current) return;
        if (msg.content.startsWith('__CALL_STARTED__')) {
          if (msg.sender_id !== user.id && !callCtx.callActive.current) {
            // User is on this chat page — show in-page accept/decline banner
            // (GlobalCallListener skips this room for exactly this reason)
            const callType = (msg.content.split(':')[1] || 'voice') as 'voice' | 'video';
            const banner = { type: callType, callerId: msg.sender_id };
            setIncomingCallBanner(banner);
            incomingCallBannerRef.current = banner;
            playNotifSound();
            vibrate('medium');
            // Auto-dismiss banner after 45s if not answered
            setTimeout(() => {
              setIncomingCallBanner(null);
              incomingCallBannerRef.current = null;
            }, 45000);
          }
          return;
        }
        if (msg.content.startsWith('__CALL_ENDED__')) {
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
          fetch('/api/chat/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: [msg.id] }) }).catch(() => { });
        }
        setTimeout(() => scrollToBottom(), 60);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user_id !== user.id) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const msg = payload.payload as Message;
        if (msg.sender_id !== user.id) {
          setIsTyping(false);
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const updated = [...prev, msg];
            localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(updated.slice(-80)));
            return updated;
          });
          playNotifSound();
          vibrate('light');
          fetch('/api/chat/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: [msg.id] }) }).catch(() => { });
          setTimeout(() => scrollToBottom(), 60);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const upd = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === upd.id ? { ...m, ...upd } : m));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const upd = payload.new as any;
        if (upd.theme) setTheme(upd.theme);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const delId = (payload.old as any)?.id;
        if (delId) setMessages(prev => prev.filter(m => m.id !== delId));
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
  const [sendError, setSendError] = useState<string | null>(null);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messageId, action: 'react', emoji })
      });
      // realtime handles the update
    } catch { }
  }, [user]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !user || sending) return;

    let content = newMessage.trim();
    if (editingMsg) {
      setSending(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Session expired');

        // Optimistic update
        const tempMeta = editingMsg.content.includes('|||META|||') ? editingMsg.content.split('|||META|||')[1] : '{}';
        const parsedMeta = JSON.parse(tempMeta || '{}');
        parsedMeta.edited = true;
        setMessages(p => p.map(m => m.id === editingMsg.id ? { ...m, content: `${content}|||META|||${JSON.stringify(parsedMeta)}` } : m));

        setNewMessage('');
        setEditingMsg(null);
        if (inputRef.current) { inputRef.current.style.height = 'auto'; }

        await fetch('/api/chat/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ messageId: editingMsg.id, action: 'edit', newText: content })
        });
      } catch { }
      setSending(false);
      return;
    }
    if (replyingTo) {
      let rawPreviewText = replyingTo.content;
      if (rawPreviewText.startsWith('> Replying to **')) {
        const splitIndex = rawPreviewText.indexOf('\n\n');
        if (splitIndex !== -1) {
          rawPreviewText = rawPreviewText.substring(splitIndex + 2);
        }
      }
      const isImage = replyingTo.message_type === 'image' || replyingTo.message_type === 'image_once';
      const preview = isImage ? 'Photo 📷' : rawPreviewText.replace(/\n/g, ' ').slice(0, 40);
      const who = replyingTo.sender_id === user.id ? 'You' : (participant?.full_name || 'Scholar');
      content = `> Replying to **${who}**: "${preview}"\n\n${content}`;
      setReplyingTo(null);
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, room_id: roomId, sender_id: user.id, content, created_at: new Date().toISOString(), is_read: false, message_type: 'text' };
    setMessages(p => [...p, optimistic]);
    setNewMessage('');
    setSendError(null);
    setSending(true);
    setTimeout(() => scrollToBottom(), 50);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expired — please refresh the page');

      // Use server-side API route so message insertion uses supabaseAdmin
      // (bypasses proxy + RLS, always works regardless of client auth state)
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roomId, content, messageType: 'text' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Send failed (${res.status})`);

      setMessages(p => p.map(m => m.id === tempId ? json.message : m));

      // Broadcast for instant delivery before Postgres sync
      channelRef.current?.send({
        type: 'broadcast',
        event: 'new_message',
        payload: json.message
      });

      if (participant?.user_id) {
        fetch('/api/chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: participant.user_id, senderId: user.id, roomId, content: content.substring(0, 50) }),
        }).catch(() => { });
      }
    } catch (e: any) {
      setMessages(p => p.filter(m => m.id !== tempId));
      setNewMessage(content);
      setSendError(e.message || 'Failed to send — tap to retry');
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

  // ─── Clear Chat ───────────────────────────────────────────────────────────
  const clearChat = async () => {
    if (!user) return;
    const myMsgIds = messages.filter(m => m.sender_id === user.id).map(m => m.id);
    const theirIds = messages.filter(m => m.sender_id !== user.id).map(m => m.id);

    // Hard-delete MY messages from DB
    if (myMsgIds.length) {
      await supabase.from('chat_messages').delete().in('id', myMsgIds);
    }
    // Soft-delete THEIR messages (hidden for me only, via localStorage)
    if (theirIds.length) {
      const roomDeletedKey = `deleted_for_me_${roomId}`;
      const existing = JSON.parse(localStorage.getItem(roomDeletedKey) || '[]');
      localStorage.setItem(roomDeletedKey, JSON.stringify([...new Set([...existing, ...theirIds])]));
    }

    // Clear cache
    localStorage.removeItem(`chat_messages_${roomId}`);
    setMessages([]);
    setShowClearChatConfirm(false);
  };

  // ─── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingImage(true);
    try {
      let uploadFile = file;
      if (uploadFile.size > MAX_IMAGE_UPLOAD_BYTES) {
        uploadFile = await compressImage(uploadFile, 'chat');
      }
      if (uploadFile.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new Error(`Image is too large. Please select an image under ${MAX_IMAGE_UPLOAD_LABEL}.`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      const extFromName = uploadFile.name?.split('.').pop();
      const extFromType = uploadFile.type?.split('/')[1]?.split('+')[0];
      const ext = (extFromName || extFromType || 'webp').toLowerCase();
      formData.append('file', uploadFile, `chat-${Date.now()}.${ext}`);
      formData.append('roomId', roomId);
      const res = await fetch('/api/chat/upload', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` }, body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }
      const uploadData = await res.json();

      const { data, error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content: uploadData.publicUrl,
        message_type: isViewOnce ? 'image_once' : 'image'
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
        }).catch(() => { });
      }
    } catch (err: any) { alert(err.message); }
    finally {
      setUploadingImage(false);
      setIsViewOnce(false); // reset after upload
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageClick = async (url: string, msgType: string, msgId: string, isSender: boolean) => {
    setFullscreenImage(url);

    // If it's a view once image and NOT the sender viewing it, delete it from the server immediately
    if (msgType === 'image_once' && !isSender) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/chat/delete-once', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ messageId: msgId })
        });
        // Note: the message will be removed from state via realtime DELETE event broadcasted by the server.
      } catch (e) {
        console.error("Failed to delete view-once image", e);
      }
    }
  };

  // ─── Long press handler ───────────────────────────────────────────────────
  const handleLongPress = (msg: Message) => {
    vibrate('medium');
    setContextMsg(msg);
    setShowContextSheet(true);
  };

  const displayName = participant?.full_name || initialName || 'Chat';



  const changeTheme = async (newTheme: string) => {
    setTheme(newTheme);
    setShowThemeModal(false);
    
    // Update the room
    await supabase.from('chat_rooms').update({ theme: newTheme }).eq('id', roomId);
    
    // Insert system message
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roomId, content: `__THEME_CHANGE__:${newTheme}`, messageType: 'text' }),
      }).catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden"
      onClick={() => { if (showHeaderMenu) setShowHeaderMenu(false); }}
    >
      <div 
        className="absolute inset-0 z-0 opacity-100 pointer-events-none transition-all duration-500"
        style={{
          backgroundImage: `url('/assets/images/chat_bg_${theme}.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-30 transition-all"
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
                navigator.clipboard.writeText(texts).catch(() => { });
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
              <BadgedName name={displayName} userId={participant?.user_id} nameClassName="font-bold text-[15px] text-slate-900 dark:text-white leading-tight truncate" />
              <p className="text-[11px] text-slate-400 font-medium">
                {isTyping ? <span className="text-indigo-500 font-bold animate-pulse">Typing...</span> : isOnline ? '🟢 Online' : 'Tap for info'}
              </p>
            </div>
            <button onClick={() => callCtx.startCall(roomId, 'voice', participant?.user_id, participant?.full_name || 'Scholar')} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => callCtx.startCall(roomId, 'video', participant?.user_id, participant?.full_name || 'Scholar')} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
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
                  <button onClick={() => { setShowHeaderMenu(false); setShowThemeModal(true); }}
                    className="w-full text-left px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between active:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-4 h-4" /> Background
                    </div>
                    <span className="text-[9px] font-black bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-transparent bg-clip-text">NEW</span>
                  </button>
                  <button
                    onClick={() => { setShowHeaderMenu(false); setShowClearChatConfirm(true); }}
                    className="w-full text-left px-4 py-3.5 text-sm font-semibold text-rose-500 hover:bg-red-50 dark:hover:bg-rose-900/10 flex items-center gap-3 active:bg-red-50 border-t border-slate-100 dark:border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" /> Clear Chat
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

      {/* ── In-page incoming call banner (user already on this chat page) ── */}
      {incomingCallBanner && (
        <div className="shrink-0 bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              {incomingCallBanner.type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{participant?.full_name || 'Scholar'}</p>
              <p className="text-xs text-white/60">Incoming {incomingCallBanner.type} call...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIncomingCallBanner(null);
                incomingCallBannerRef.current = null;
                // Insert declined message
                if (user) {
                  supabase.from('chat_messages').insert({
                    room_id: roomId, sender_id: user.id,
                    content: '__CALL_ENDED__: Call declined', message_type: 'text'
                  }).then(null, () => { });
                }
              }}
              className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center active:scale-95 transition-transform"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
            <button
              onClick={async () => {
                const banner = incomingCallBannerRef.current;
                if (!banner) return;
                setIncomingCallBanner(null);
                incomingCallBannerRef.current = null;
                // MUST call startCall inside this onClick (user gesture)
                // so browser AudioContext is allowed to start
                await callCtx.startCall(
                  roomId,
                  banner.type,
                  participant?.user_id,
                  participant?.full_name || 'Scholar',
                  true // isAnswering
                );
              }}
              className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
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
          <>
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                  {loadingMore ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}
            {messages.map((msg, idx) => (
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
                onImageClick={handleImageClick}
                onReaction={handleReaction}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* ── Context sheet (long press) ────────────────────────────────────── */}
      {showContextSheet && contextMsg && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowContextSheet(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-3 shrink-0" />

            {/* Reaction picker */}
            <div className="px-5 pb-3 pt-1 flex justify-between items-center shrink-0 border-b border-slate-100 dark:border-slate-800">
              {['❤️', '😂', '🔥', '👍', '😢', '😮'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReaction(contextMsg.id, emoji);
                    setShowContextSheet(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform active:scale-95 p-2 rounded-full bg-slate-50 dark:bg-slate-800"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Message preview */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate">
                {contextMsg.content.includes('|||META|||') ? contextMsg.content.split('|||META|||')[0].slice(0, 60) : contextMsg.content.slice(0, 60)}
              </p>
            </div>
            <div className="overflow-y-auto max-h-[50vh] shrink-0">
              {[
                { icon: Reply, label: 'Reply', color: 'text-indigo-600', action: () => { setReplyingTo(contextMsg); setShowContextSheet(false); setTimeout(() => inputRef.current?.focus(), 100); } },
                ...(contextMsg.sender_id === user?.id && contextMsg.message_type === 'text' && !contextMsg.content.startsWith('__CALL_') ? [{
                  icon: Edit2, label: 'Edit', color: 'text-indigo-600', action: () => {
                    setEditingMsg(contextMsg);
                    setNewMessage(contextMsg.content.includes('|||META|||') ? contextMsg.content.split('|||META|||')[0] : contextMsg.content);
                    setShowContextSheet(false);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }
                }] : []),
                {
                  icon: Copy, label: 'Copy', color: 'text-slate-700 dark:text-slate-200', action: () => {
                    const raw = contextMsg.content.includes('|||META|||') ? contextMsg.content.split('|||META|||')[0] : contextMsg.content;
                    navigator.clipboard.writeText(raw).catch(() => { });
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
          </div>
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
        {/* ── Send error banner ───────────────────────────────────────── */}
        {sendError && (
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/30">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex-1">{sendError}</span>
            <button onClick={() => setSendError(null)} className="text-rose-400 text-xs font-bold">✕</button>
          </div>
        )}
        {/* Reply preview */}

        {replyingTo && (
          <div className="flex items-center gap-3 px-4 pt-2.5 pb-0">
            <div className="flex-1 border-l-[3px] border-indigo-500 pl-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-xl min-w-0">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                Replying to {replyingTo.sender_id === user?.id ? 'yourself' : participant?.full_name}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                {replyingTo.content.includes('|||META|||') ? replyingTo.content.split('|||META|||')[0].slice(0, 50) : replyingTo.content.slice(0, 50)}
              </p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
        {editingMsg && (
          <div className="flex items-center gap-3 px-4 pt-2.5 pb-0">
            <div className="flex-1 border-l-[3px] border-indigo-500 pl-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-xl min-w-0 flex items-center gap-2">
              <Edit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <p className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 mb-0">
                Editing Message
              </p>
            </div>
            <button onClick={() => { setEditingMsg(null); setNewMessage(''); }} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* Image button */}
          <div className="flex flex-col gap-1 items-center mb-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 shrink-0"
            >
              {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <ImageIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsViewOnce(v => !v)}
              className={`w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-bold transition-colors ${isViewOnce ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
              title="View Once"
            >
              1
            </button>
          </div>
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

                // Throttle typing broadcast
                const now = Date.now();
                if (!(window as any).lastTypingBroadcast || now - (window as any).lastTypingBroadcast > 1500) {
                  (window as any).lastTypingBroadcast = now;
                  channelRef.current?.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { user_id: user?.id }
                  });
                }
              }}
              onKeyDown={(e) => {
                // Desktop: Enter = send, Shift+Enter = newline
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Message..."
              className="w-full bg-transparent text-[15px] !text-slate-900 dark:!text-white placeholder:text-slate-400 caret-slate-900 dark:caret-white outline-none resize-none leading-[1.4]"
              style={{ overflowY: 'hidden', WebkitTextFillColor: 'currentColor', opacity: 1 }}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || isBlocked || (roomStatus?.status === 'pending')}
            className="w-10 h-10 bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 rounded-full flex items-center justify-center shadow-md shadow-indigo-600/20 disabled:shadow-none active:scale-90 transition-all shrink-0 mb-0.5"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* ── Message Request Banner ─────────────────────────────────────────── */}
      {roomStatus?.status === 'pending' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-50 animate-in slide-in-from-bottom">
          {roomStatus.created_by === user?.id ? (
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white mb-1">Message Request Sent</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {participant?.full_name} will need to accept your request before you can chat.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-slate-900 dark:text-white mb-1 text-center">Message Request</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                If you accept, they will be able to message you and see when you've read messages.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    // Update status to approved
                    const { error } = await supabase.from('chat_rooms').update({ status: 'approved' }).eq('id', roomId);
                    if (!error) {
                      setRoomStatus({ ...roomStatus, status: 'approved' });
                    }
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
                >
                  Accept
                </button>
                <button
                  onClick={async () => {
                    // Delete room
                    await supabase.from('chat_rooms').delete().eq('id', roomId);
                    router.push('/chat');
                  }}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold active:scale-95 transition-transform"
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <audio id="chat-notif-audio" src="/universfield-new-notification-040-493469.mp3" preload="auto" />

      {/* ── Clear Chat confirmation sheet ─────────────────────────────────── */}
      {showClearChatConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowClearChatConfirm(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-rose-500" />
              </div>
            </div>
            <h3 className="text-center text-lg font-black text-slate-900 dark:text-white mb-1">Clear Chat?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Your messages will be <strong>permanently deleted</strong> for everyone.<br />
              Their messages will be hidden <strong>only for you</strong>.
            </p>
            <button
              onClick={clearChat}
              className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-bold text-base active:scale-95 transition-transform mb-3"
            >
              Clear Chat
            </button>
            <button
              onClick={() => setShowClearChatConfirm(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-base active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Theme Modal ─────────────────────────────────────────────────── */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowThemeModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-center text-lg font-black text-slate-900 dark:text-white mb-6">Choose Background</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'doodle', label: 'Doodle', url: '/assets/images/chat_bg_doodle.jpg' },
                { id: 'geometric', label: 'Geometric', url: '/assets/images/chat_bg_geometric.jpg' },
                { id: 'blur', label: 'Blur', url: '/assets/images/chat_bg_blur.jpg' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  className={`flex flex-col items-center gap-2 ${theme === t.id ? 'opacity-100' : 'opacity-60'} active:scale-95 transition-all`}
                >
                  <div className={`w-full aspect-[9/16] rounded-xl overflow-hidden border-2 ${theme === t.id ? 'border-indigo-500 shadow-md shadow-indigo-500/20' : 'border-transparent'}`}>
                    <Image src={t.url} alt={t.label} width={100} height={180} className="w-full h-full object-cover" unoptimized />
                  </div>
                  <span className={`text-[11px] font-bold ${theme === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{t.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowThemeModal(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-base active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen Image ────────────────────────────────────────────── */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-12 left-4 p-2 rounded-full bg-black/50 text-white z-[10001]"
            onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Image
            src={fullscreenImage}
            alt="Fullscreen"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
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