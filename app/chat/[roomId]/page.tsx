'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Send, Image as ImageIcon, X, Check, CheckCheck,
  MoreVertical, Trash2, Copy, Reply as ReplyIcon, Phone, Video,
  Loader2, Smile,
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  message_type?: string;
  reply_to_id?: string | null;
  reply_to?: { content: string; sender_id: string } | null;
  local?: boolean;
}
interface Participant { id: string; full_name: string; avatar_url?: string | null; username?: string; }

// ─── Sound ──────────────────────────────────────────────────────────────────
let msgAudio: HTMLAudioElement | null = null;
function playMsgSound() {
  try {
    if (!msgAudio) msgAudio = new Audio('/universfield-new-notification-040-493469.mp3');
    msgAudio.currentTime = 0;
    msgAudio.volume = 0.55;
    msgAudio.play().catch(() => {});
  } catch {}
}

// ─── Date separator ─────────────────────────────────────────────────────────
function dateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

// ─── Message preview (strip reply block) ─────────────────────────────────────
function previewContent(content: string) {
  if (content.startsWith('> Replying to **')) {
    const parts = content.split('\n\n');
    return parts.slice(1).join(' ').trim() || 'Replied to a message';
  }
  return content;
}

// ─── Memo message bubble ─────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({
  msg, isMine, otherAvatar, otherName, selected, selectionMode,
  onLongPress, onTap, myId,
}: {
  msg: Message; isMine: boolean; otherAvatar?: string | null; otherName: string;
  selected: boolean; selectionMode: boolean;
  onLongPress: (id: string) => void; onTap: (id: string) => void; myId: string;
}) {
  const longPressTimer = useRef<any>(null);
  const [pressing, setPressing] = useState(false);

  const isImageMsg = msg.message_type === 'image' || (msg.content.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i));
  const isCallMsg = msg.content.startsWith('__CALL_ENDED__');

  // Extract reply context
  let replyBlock: { author: string; text: string } | null = null;
  let mainContent = msg.content;
  if (mainContent.startsWith('> Replying to **')) {
    const lines = mainContent.split('\n\n');
    const header = lines[0];
    const authorMatch = header.match(/\*\*(.+?)\*\*/);
    const textMatch = header.match(/> Replying to \*\*.+?\*\*:\s*(.+)/);
    replyBlock = { author: authorMatch?.[1] || 'Someone', text: textMatch?.[1] || '' };
    mainContent = lines.slice(1).join('\n\n').trim();
  }

  const timeStr = format(new Date(msg.created_at), 'h:mm a');

  const handleTouchStart = () => {
    setPressing(true);
    longPressTimer.current = setTimeout(() => { playMsgSound(); onLongPress(msg.id); setPressing(false); }, 430);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    setPressing(false);
  };

  if (isCallMsg) {
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
          <Phone className="w-3 h-3" />
          {msg.content.replace('__CALL_ENDED__:', '').trim() || 'Call ended'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 px-3 my-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${pressing ? 'opacity-70 scale-[0.99]' : ''} transition-all duration-75`}
      onClick={() => selectionMode && onTap(msg.id)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'} ${isMine ? 'order-last ml-1' : 'order-first mr-1'}`}>
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      )}

      {/* Avatar for others */}
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 mb-1">
          {otherAvatar
            ? <Image src={otherAvatar} alt={otherName} width={32} height={32} className="object-cover w-full h-full" />
            : <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">{otherName?.[0]?.toUpperCase()}</div>
          }
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Reply block */}
        {replyBlock && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl border-l-[3px] text-[12px] max-w-full truncate ${isMine ? 'bg-indigo-500/10 border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-300'}`}>
            <p className="font-bold truncate">{replyBlock.author}</p>
            <p className="truncate opacity-80">{replyBlock.text}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl overflow-hidden shadow-sm ${selected ? 'ring-2 ring-indigo-500' : ''} ${isMine
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700/50'}`}
        >
          {isImageMsg ? (
            <div className="w-52 h-52 relative">
              <Image src={msg.content} alt="sent image" fill className="object-cover" />
            </div>
          ) : (
            <p className="px-3.5 py-2 text-[14.5px] leading-[1.45] whitespace-pre-wrap break-words">{mainContent}</p>
          )}
        </div>

        {/* Time + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">{timeStr}</span>
          {isMine && (
            msg.local
              ? <Check className="w-3 h-3 text-slate-300 dark:text-slate-600" />
              : msg.is_read
                ? <CheckCheck className="w-3 h-3 text-indigo-500" />
                : <Check className="w-3 h-3 text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId;

  const [user, setUser] = useState<any>(null);
  const [other, setOther] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);

  // Reply
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3-dot menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef<any>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // ─── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: { session } } = await supabase.auth.getSession();
      sessionRef.current = session;

      // Load other participant
      const { data: pars } = await supabase.from('chat_participants').select('user_id').eq('room_id', roomId).neq('user_id', user.id);
      if (pars?.length) {
        const otherId = pars[0].user_id;
        const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url, username').eq('id', otherId).single();
        if (prof) setOther(prof);
      }

      // Load messages (cache first)
      try {
        const cached = localStorage.getItem(`chat_msgs_${roomId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setMessages(parsed);
          setLoading(false);
          setTimeout(() => scrollToBottom(false), 0);
        }
      } catch {}

      // Fresh fetch
      const { data: msgs } = await supabase.from('chat_messages')
        .select('id, content, sender_id, created_at, is_read, message_type, reply_to_id')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(80);

      if (msgs) {
        // Enrich with reply data
        const replyIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id!);
        let replyMap = new Map<string, any>();
        if (replyIds.length) {
          const { data: replyMsgs } = await supabase.from('chat_messages').select('id, content, sender_id').in('id', replyIds);
          replyMap = new Map((replyMsgs || []).map(r => [r.id, r]));
        }
        const enriched = msgs.map(m => ({ ...m, reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) || null : null }));
        setMessages(enriched);
        try { localStorage.setItem(`chat_msgs_${roomId}`, JSON.stringify(enriched)); } catch {}
      }
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 60);

      // Mark as read
      await supabase.from('chat_messages').update({ is_read: true }).eq('room_id', roomId).neq('sender_id', user.id).eq('is_read', false);
    };
    init();
  }, [roomId, router, scrollToBottom]);

  // ─── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: any) => {
      const h = e.keyboardHeight || 0;
      setKeyboardHeight(h);
      if (h > 0) setTimeout(() => scrollToBottom(true), 150);
    };
    window.addEventListener('keyboardWillShow', handler);
    window.addEventListener('keyboardDidShow', handler);
    window.addEventListener('keyboardWillHide', () => setKeyboardHeight(0));
    window.addEventListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      window.removeEventListener('keyboardWillShow', handler);
      window.removeEventListener('keyboardDidShow', handler);
      window.removeEventListener('keyboardWillHide', handler);
      window.removeEventListener('keyboardDidHide', handler);
    };
  }, [scrollToBottom]);

  // ─── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabaseRealtime
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, async (payload) => {
        const nm = payload.new as Message;
        // Enrich reply
        let replyData = null;
        if (nm.reply_to_id) {
          const { data: rd } = await supabase.from('chat_messages').select('id, content, sender_id').eq('id', nm.reply_to_id).single();
          replyData = rd;
        }
        const full = { ...nm, reply_to: replyData };
        setMessages(prev => {
          // Deduplicate by id
          if (prev.find(m => m.id === nm.id)) return prev;
          const next = [...prev.filter(m => !m.local || m.content !== nm.content), full];
          try { localStorage.setItem(`chat_msgs_${roomId}`, JSON.stringify(next)); } catch {}
          return next;
        });
        if (nm.sender_id !== user.id) playMsgSound();
        setTimeout(() => scrollToBottom(true), 80);
        if (nm.sender_id !== user.id) {
          await supabase.from('chat_messages').update({ is_read: true }).eq('id', nm.id);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const updated = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const deletedId = (payload.old as any)?.id;
        if (deletedId) setMessages(prev => prev.filter(m => m.id !== deletedId));
      })
      .subscribe();
    return () => { supabaseRealtime.removeChannel(channel); };
  }, [user?.id, roomId, scrollToBottom]);

  // ─── Send ────────────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    if (!inputText.trim() || sending || !user) return;
    const text = inputText.trim();
    const replyRef = replyTo;

    let finalContent = text;
    if (replyRef) {
      const replyAuthor = replyRef.sender_id === user.id ? 'You' : (other?.full_name || 'Scholar');
      const replyPreview = previewContent(replyRef.content).slice(0, 80);
      finalContent = `> Replying to **${replyAuthor}**: ${replyPreview}\n\n${text}`;
    }

    setInputText('');
    setReplyTo(null);
    setSending(true);

    const localMsg: Message = { id: `local_${Date.now()}`, content: finalContent, sender_id: user.id, created_at: new Date().toISOString(), is_read: false, message_type: 'text', reply_to_id: replyRef?.id || null, local: true };
    setMessages(prev => [...prev, localMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ roomId, content: finalContent, reply_to_id: replyRef?.id || null }),
      });
      if (!res.ok) throw new Error('Send failed');
    } catch {
      setMessages(prev => prev.filter(m => m.id !== localMsg.id));
      setInputText(text);
    } finally { setSending(false); }
  }, [inputText, sending, user, replyTo, other, roomId, scrollToBottom]);

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
    } catch (err: any) { alert(err.message); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // ─── Delete messages ──────────────────────────────────────────────────────
  const deleteMessages = async (ids: string[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    await Promise.all(ids.map(id =>
      fetch(`/api/chat/messages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token}` } })
    ));
    setMessages(prev => prev.filter(m => !ids.includes(m.id)));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // ─── Selection ────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleLongPress = (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (selectionMode) { toggleSelect(id); return; }
    setContextMsg(msg || null);
    setShowContextMenu(true);
  };

  // ─── Message groups (for date separators) ─────────────────────────────────
  const grouped = useMemo(() => {
    const result: Array<Message | { type: 'divider'; label: string; key: string }> = [];
    let lastDate = '';
    for (const msg of messages) {
      const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        result.push({ type: 'divider', label: dateSeparator(msg.created_at), key: `div_${dateKey}` });
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  const otherName = searchParams.get('name') || other?.full_name || 'Chat';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col bg-slate-50 dark:bg-slate-950"
      style={{ height: '100dvh', paddingBottom: keyboardHeight > 0 ? keyboardHeight : 'env(safe-area-inset-bottom)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {selectionMode ? (
          /* Selection mode header */
          <div className="flex items-center gap-3 px-3 h-14">
            <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 -ml-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
              <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            <span className="flex-1 font-bold text-[16px] text-slate-900 dark:text-white">{selectedIds.size} selected</span>
            <button
              onClick={() => { if (contextMsg) setReplyTo(contextMsg); setSelectionMode(false); setSelectedIds(new Set()); }}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ReplyIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const mine = [...selectedIds].filter(id => messages.find(m => m.id === id)?.sender_id === user?.id);
                if (!mine.length) { alert('You can only delete your own messages'); return; }
                if (confirm(`Delete ${mine.length} message(s)?`)) deleteMessages(mine);
              }}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-red-500"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const texts = [...selectedIds].map(id => previewContent(messages.find(m => m.id === id)?.content || '')).join('\n');
                navigator.clipboard.writeText(texts).catch(() => {});
              }}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Normal header */
          <div className="flex items-center gap-2 px-3 h-14">
            <button onClick={() => router.back()} className="p-2 -ml-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800 shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            {/* Avatar — fixed small size to never overflow header */}
            <div
              className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer active:opacity-80"
              onClick={() => other?.username && router.push(`/user/${other.username}`)}
            >
              {other?.avatar_url
                ? <Image src={other.avatar_url} alt={other.full_name} width={36} height={36} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-base">{otherName?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => other?.username && router.push(`/user/${other.username}`)}
            >
              <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate leading-tight">{otherName}</p>
              <p className="text-[11px] text-slate-400 font-medium">Tap for info</p>
            </div>
            {/* Call buttons */}
            <button
              onClick={() => router.push(`/chat/${roomId}/call?type=voice&otherId=${other?.id}`)}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push(`/chat/${roomId}/call?type=video&otherId=${other?.id}`)}
              className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
            >
              <Video className="w-5 h-5" />
            </button>
            {/* 3-dot menu */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShowHeaderMenu(v => !v); }}
                className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 top-10 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {other?.username && (
                    <button onClick={() => { setShowHeaderMenu(false); router.push(`/user/${other.username}`); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
                      View Profile
                    </button>
                  )}
                  <button onClick={() => { setShowHeaderMenu(false); setSelectionMode(true); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
                    Select Messages
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for header menu */}
      {showHeaderMenu && <div className="fixed inset-0 z-20" onClick={() => setShowHeaderMenu(false)} />}

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={() => { if (showContextMenu) setShowContextMenu(false); if (showHeaderMenu) setShowHeaderMenu(false); }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Smile className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Start the conversation!</p>
              <p className="text-sm text-slate-400 mt-0.5">Say hi to {otherName} 👋</p>
            </div>
          </div>
        ) : (
          <div className="pb-2">
            {grouped.map(item => {
              if ('type' in item && item.type === 'divider') {
                return (
                  <div key={item.key} className="flex items-center gap-3 px-6 my-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                );
              }
              const msg = item as Message;
              const isMine = msg.sender_id === user?.id;
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMine={isMine}
                  otherAvatar={other?.avatar_url}
                  otherName={other?.full_name || 'Scholar'}
                  selected={selectedIds.has(msg.id)}
                  selectionMode={selectionMode}
                  onLongPress={handleLongPress}
                  onTap={toggleSelect}
                  myId={user?.id || ''}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Context Menu (long press) ─────────────────────────────────────── */}
      {showContextMenu && contextMsg && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowContextMenu(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-4" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 mb-2">Message Actions</p>
            <button
              onClick={() => { setReplyTo(contextMsg); setShowContextMenu(false); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <ReplyIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Reply</span>
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(previewContent(contextMsg.content)).catch(() => {}); setShowContextMenu(false); }}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Copy className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Copy</span>
            </button>
            <button
              onClick={() => { setSelectionMode(true); setSelectedIds(new Set([contextMsg.id])); setShowContextMenu(false); }}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Check className="w-5 h-5 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Select</span>
            </button>
            {contextMsg.sender_id === user?.id && (
              <button
                onClick={() => { if (confirm('Delete this message?')) deleteMessages([contextMsg.id]); setShowContextMenu(false); }}
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-red-50 dark:active:bg-red-900/10 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <span className="font-semibold text-red-500">Delete</span>
              </button>
            )}
            <div className="pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </>
      )}

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60">
        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-center gap-3 px-4 pt-3 pb-1">
            <div className="flex-1 border-l-[3px] border-indigo-500 pl-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-xl min-w-0">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                Replying to {replyTo.sender_id === user?.id ? 'yourself' : other?.full_name}
              </p>
              <p className="text-[12px] text-slate-600 dark:text-slate-400 truncate">{previewContent(replyTo.content)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 px-3 py-2.5">
          {/* Image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 shrink-0 mb-0.5"
          >
            {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <ImageIcon className="w-5 h-5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          {/* Textarea */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 min-h-[40px] max-h-28 overflow-y-auto">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message..."
              rows={1}
              className="w-full bg-transparent text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none resize-none leading-[1.4]"
              style={{ lineHeight: '1.4' }}
            />
          </div>
          {/* Send button */}
          <button
            onClick={send}
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-600/30 disabled:shadow-none active:scale-95 transition-all shrink-0 mb-0.5"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}