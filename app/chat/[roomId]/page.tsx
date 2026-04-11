'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  RefreshCw,
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

// --- Optimized Video Player Components ---
const RemoteVideoPlayer = memo(({ track }: { track: any }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (track && videoRef.current) track.play(videoRef.current);
    return () => { if (track) track.stop(); };
  }, [track]);
  return <div ref={videoRef} className="h-full w-full object-cover" />;
});

const LocalVideoPlayer = memo(({ track }: { track: any }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (track && videoRef.current) track.play(videoRef.current);
  }, [track]);
  return <div ref={videoRef} className="h-full w-full scale-x-[-1] object-cover" />;
});

// --- Memoized Message Item for Performance ---
const MessageItem = memo(({ 
  msg, 
  user, 
  participant, 
  isSelectionMode, 
  isSelected, 
  onToggleSelection, 
  onLongPress, 
  onReplySwipe,
  prevMsg 
}: { 
  msg: Message, 
  user: any, 
  participant: Participant | null, 
  isSelectionMode: boolean, 
  isSelected: boolean,
  onToggleSelection: (id: string) => void,
  onLongPress: (msg: Message) => void,
  onReplySwipe: (msg: Message) => void,
  prevMsg?: Message
}) => {
  const isMe = msg.sender_id === user?.id;
  const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');
  
  const handleLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSelectionMode) return;
    onLongPress(msg);
  };

  return (
    <div className="w-full flex flex-col">
      {showDate && (
        <div className="flex justify-center my-4">
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-lg text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {isToday(new Date(msg.created_at)) ? 'Today' : isYesterday(new Date(msg.created_at)) ? 'Yesterday' : format(new Date(msg.created_at), 'MMMM d, yyyy')}
          </span>
        </div>
      )}

      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-center gap-2 mb-1`}>
        {isSelectionMode && (
          <div 
            onClick={() => onToggleSelection(msg.id)}
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${isSelected ? 'border-[#075e54] bg-[#075e54]' : 'border-gray-300'}`}
          >
            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
          </div>
        )}
        
        <div 
          onContextMenu={(e) => { e.preventDefault(); onLongPress(msg); }}
          className={`
            relative max-w-[80%] px-3 py-2 text-[15px]
            ${isMe ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-l-lg rounded-tr-lg' : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-r-lg rounded-tl-lg'}
            ${isSelected ? 'opacity-70 scale-95' : ''}
            shadow-sm
          `}
        >
          {msg.message_type === 'image' ? (
            <div className="relative w-[200px] h-[200px] rounded-lg overflow-hidden border border-black/5">
              <Image src={msg.content} alt="Attachment" fill className="object-cover" unoptimized />
            </div>
          ) : msg.content.startsWith('> Replying to **') ? (
            <>
              <div className={`mb-1.5 rounded-md border-l-4 p-2 text-xs bg-black/5 dark:bg-white/5 border-[#075e54]`}>
                <span className="font-bold">{msg.content.split('**: "')[0].replace('> Replying to **', '')}</span>
                <p className="truncate opacity-70">{msg.content.split('**: "')[1]?.split('"\n\n')[0]}</p>
              </div>
              <p className="whitespace-pre-wrap">{msg.content.split('"\n\n').slice(1).join('"\n\n')}</p>
            </>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
          
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] opacity-60 font-medium">
              {format(new Date(msg.created_at), 'HH:mm')}
            </span>
            {isMe && (
              <span className={msg.is_read ? 'text-[#53bdeb]' : 'text-gray-400'}>
                {msg.is_read ? <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function ChatRoomContent() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const initialName = searchParams.get('name');

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
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rtcClientRef = useRef<any>(null);
  const roomChannelRef = useRef<any>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Performance Fix: Realtime single-message update logic
  useEffect(() => {
    const initChat = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);

      try {
        const cachedMsgs = localStorage.getItem(MESSAGES_CACHE_KEY(roomId));
        const cachedPart = localStorage.getItem(PARTICIPANT_CACHE_KEY(roomId));
        if (cachedMsgs) {
          setMessages(JSON.parse(cachedMsgs));
          setLoading(false);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
        if (cachedPart) setParticipant(JSON.parse(cachedPart));
      } catch { }

      const [pRes, mRes] = await Promise.all([
        supabase.from('chat_participants').select('user_id').eq('room_id', roomId).neq('user_id', currentUser.id),
        supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(50)
      ]);

      if (pRes.data?.[0]?.user_id) {
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, username').eq('id', pRes.data[0].user_id).single();
        if (profile) {
          const p = { user_id: pRes.data[0].user_id, ...profile };
          setParticipant(p);
          localStorage.setItem(PARTICIPANT_CACHE_KEY(roomId), JSON.stringify(p));
        }
      }

      if (mRes.data) {
        setMessages(mRes.data);
        setLoading(false);
        localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(mRes.data));
        
        const unread = mRes.data.filter(m => !m.is_read && m.sender_id !== currentUser.id).map(m => m.id);
        if (unread.length > 0) supabase.from('chat_messages').update({ is_read: true }).in('id', unread);
      }
      setTimeout(() => scrollToBottom('auto'), 100);
    };
    initChat();
  }, [roomId, router, scrollToBottom]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabaseRealtime.channel(`room-${roomId}`)
      .on('presence', { event: 'sync' }, () => setIsOnline(Object.keys(channel.presenceState()).length > 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          localStorage.setItem(MESSAGES_CACHE_KEY(roomId), JSON.stringify(updated.slice(-50)));
          return updated;
        });
        if (msg.sender_id !== user.id) {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id);
          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        }
        setTimeout(() => scrollToBottom(), 50);
      })
      .subscribe(async (status) => { if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() }); });

    roomChannelRef.current = channel;
    return () => { supabaseRealtime.removeChannel(channel); };
  }, [roomId, user?.id, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    let content = newMessage.trim();
    if (replyingTo) {
      const preview = replyingTo.message_type === 'image' ? 'Photo' : replyingTo.content.slice(0, 30);
      content = `> Replying to **${replyingTo.sender_id === user.id ? 'You' : participant?.full_name}**: "${preview}"\n\n${content}`;
      setReplyingTo(null);
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, room_id: roomId, sender_id: user.id, content, created_at: new Date().toISOString(), is_read: false, message_type: 'text' };
    setMessages(p => [...p, optimistic]);
    setNewMessage('');
    setSending(true);
    scrollToBottom();

    try {
      const { data } = await supabase.from('chat_messages').insert({ room_id: roomId, sender_id: user.id, content, message_type: 'text' }).select('*').single();
      if (data) setMessages(p => p.map(m => m.id === tempId ? data : m));
    } catch {
      setMessages(p => p.filter(m => m.id !== tempId));
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#efe7de] dark:bg-[#0b141a]">
      {/* Android-style solid header */}
      <header className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center gap-3 z-50 sticky top-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button onClick={() => router.push('/chat')} className="p-2 active:bg-white/10 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/user/${participant?.username}`)}>
          <div className="h-10 w-10 rounded-full bg-white/20 overflow-hidden shrink-0">
            {participant?.avatar_url && <Image src={participant.avatar_url} alt="P" fill className="object-cover" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold truncate leading-tight">{participant?.full_name || 'Scholar'}</h2>
            <p className="text-[12px] opacity-80 leading-none">{isOnline ? 'Online' : 'Recent'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 active:bg-white/10 rounded-full"><Phone className="w-5 h-5" /></button>
          <button className="p-2 active:bg-white/10 rounded-full"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-[#075e54]" /></div>
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
              onLongPress={(m) => { setSelectedMessage(m); setIsSelectionMode(true); setSelectedIds([m.id]); }}
              onReplySwipe={(m) => setReplyingTo(m)}
              prevMsg={messages[idx - 1]}
            />
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input area */}
      <div className="p-2 flex items-end gap-2 bg-[#efe7de] dark:bg-[#0b141a]" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="flex-1 bg-white dark:bg-[#202c33] rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[48px]">
          {replyingTo && (
            <div className="bg-black/5 dark:bg-white/5 border-l-4 border-[#075e54] m-2 p-2 relative">
              <span className="text-xs font-bold text-[#075e54]">{replyingTo.sender_id === user.id ? 'You' : participant?.full_name}</span>
              <p className="text-xs truncate opacity-70">{replyingTo.content}</p>
              <X className="absolute top-1 right-1 w-3 h-3 cursor-pointer" onClick={() => setReplyingTo(null)} />
            </div>
          )}
          <div className="flex items-center px-4 py-1">
            <Paperclip className="w-5 h-5 text-gray-500 mr-2 cursor-pointer" />
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Message"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
              className="flex-1 py-3 text-[16px] bg-transparent outline-none resize-none dark:text-white"
            />
          </div>
        </div>
        <button 
          onClick={handleSend}
          className="h-12 w-12 rounded-full bg-[#075e54] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
        >
          {sending ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : <Send className="w-5 h-5 translate-x-0.5" />}
        </button>
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#111b21]"><Loader2 className="animate-spin text-teal-500" /></div>}>
      <ChatRoomContent />
    </React.Suspense>
  );
}