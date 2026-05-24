'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  X,
  Loader2,
  Check,
  CheckCheck,
  MessageCirclePlus,
  ArrowLeft,
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  status?: string;
  participant: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
    message_type?: string;
  };
}

const ROOMS_CACHE_KEY = (userId: string) => `chat_rooms_cache_${userId}`;

export default function ChatListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchRooms = useCallback(async (userId: string) => {
    try {
      const { data: participants, error } = await supabase
        .from('chat_participants')
        .select(`room_id, chat_rooms(id, name, is_group, updated_at, status, created_by)`)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      const validRooms = (participants || []).filter(p => p.chat_rooms != null);
      if (!validRooms.length) { setRooms([]); return; }

      const roomIds = validRooms.map(p => p.room_id);
      const { data: otherPs } = await supabase.from('chat_participants').select('room_id, user_id').in('room_id', roomIds).neq('user_id', userId);
      const otherUids = [...new Set((otherPs || []).map(p => p.user_id))];

      let profileMap = new Map<string, any>();
      if (otherUids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', otherUids);
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_id, is_read, message_type, room_id')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false })
        .limit(300);
        
      const lastMsgMap = new Map<string, any>();
      (allMessages || []).forEach(m => {
        if (!lastMsgMap.has(m.room_id)) lastMsgMap.set(m.room_id, m);
      });

      let blockedIds = new Set<string>();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const blockedRes = await fetch('/api/chat/blocked-ids', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: 'no-store',
          });
          if (blockedRes.ok) {
            const blockedData = await blockedRes.json();
            blockedIds = new Set<string>(Array.isArray(blockedData.blockedIds) ? blockedData.blockedIds.map(String) : []);
          }
        }
      } catch (blockedErr) {
        console.warn('[Chat] Failed to load blocked users:', blockedErr);
      }

      const roomData: ChatRoom[] = validRooms.map(p => {
        const room = p.chat_rooms as any;
        const otherUid = otherPs?.find(op => op.room_id === room.id)?.user_id;
        const prof = otherUid ? profileMap.get(otherUid) : null;
        return { 
          id: room.id, 
          name: room.name, 
          is_group: room.is_group, 
          status: room.status,
          participant: { user_id: otherUid || '', full_name: prof?.full_name || 'Scholar', avatar_url: prof?.avatar_url || null }, 
          last_message: lastMsgMap.get(room.id) 
        };
      }).filter(r => !blockedIds.has(r.participant.user_id));

      roomData.sort((a, b) => (b.last_message ? new Date(b.last_message.created_at).getTime() : 0) - (a.last_message ? new Date(a.last_message.created_at).getTime() : 0));
      setRooms(roomData);
      try { localStorage.setItem(ROOMS_CACHE_KEY(userId), JSON.stringify(roomData)); } catch { }
    } catch (err) { console.error('[Chat]', err); }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      try {
        const cached = localStorage.getItem(ROOMS_CACHE_KEY(user.id));
        if (cached) { setRooms(JSON.parse(cached)); setLoading(false); }
      } catch { }
      await fetchRooms(user.id);
      setLoading(false);
    };
    init();
  }, [router, fetchRooms]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabaseRealtime.channel(`chat-list-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchRooms(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` }, () => fetchRooms(user.id))
      .subscribe();
    const interval = setInterval(() => fetchRooms(user.id), 60000);

    // Re-fetch when the user navigates back to this tab/page so unread dots
    // clear immediately without waiting for the 60-second polling interval.
    const onVisible = () => { if (document.visibilityState === 'visible') fetchRooms(user.id); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabaseRealtime.removeChannel(ch);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, fetchRooms]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (r.ok) { const d = await r.json(); setSearchResults(d.users?.filter((u: any) => u.id !== user?.id) || []); }
      } catch { } finally { setIsSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, user?.id]);

  const startChat = async (targetUserId: string, targetName?: string) => {
    try {
      const r = await fetch('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId, currentUserId: user.id }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.roomId) router.push(`/chat/${d.roomId}?name=${encodeURIComponent(targetName || '')}`);
    } catch (err: any) { alert('Chat error: ' + err.message); }
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    return rooms.filter(r => r.participant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [rooms, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header — matches app style */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/feed')} className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Messages</h1>
            </div>
            <button className="h-9 w-9 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform">
              <MessageCirclePlus className="w-4 h-4" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search or start a new chat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none border border-transparent focus:border-indigo-400/50 transition-colors"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Search results */}
        {searchQuery && isSearching ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div>
            <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10">Global Results</div>
            {searchResults.map(res => (
              <button key={res.id} onClick={() => startChat(res.id, res.full_name)} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-100 dark:active:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/50 text-left">
                <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800 relative overflow-hidden shrink-0">
                  {(res.avatar_url || res.avatar) ? <Image src={res.avatar_url || res.avatar} alt="Avatar" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg">{(res.full_name || res.name)?.[0]?.toUpperCase()}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate">{res.full_name || res.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">@{res.username || 'scholar'}</p>
                </div>
              </button>
            ))}
          </div>
        ) : !searchQuery ? (
          <div>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/50">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-2/3" /><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-1/2" /></div>
                </div>
              ))
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-5 transform rotate-6">
                  <MessageCirclePlus className="w-10 h-10 text-indigo-500 -rotate-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No conversations yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Search for a scholar above to start chatting.</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                {filteredRooms.filter(r => r.status === 'pending').length > 0 && (
                  <div className="mb-4">
                     <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10">Message Requests</div>
                     {filteredRooms.filter(r => r.status === 'pending').map((room, idx) => (
                       <ChatCard key={room.id} room={room} onClick={() => router.push(`/chat/${room.id}`)} user={user} index={idx} />
                     ))}
                  </div>
                )}
                
                {filteredRooms.filter(r => r.status !== 'pending').length > 0 && (
                   <>
                    <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recent Chats</div>
                    {filteredRooms.filter(r => r.status !== 'pending').map((room, idx) => (
                      <ChatCard key={room.id} room={room} onClick={() => router.push(`/chat/${room.id}`)} user={user} index={idx} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatPreview(content: string, type?: string) {
  let text = content;
  if (text.includes('|||META|||')) {
    text = text.split('|||META|||')[0];
  }
  
  if (type === 'image' || text.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i)) return '📷 Photo';
  if (text.startsWith('__CALL_ENDED__')) return '📞 Call ended';
  if (text.startsWith('> Replying to **')) {
    const parts = text.split('\n\n');
    const replyText = parts.slice(1).join(' ').trim();
    return replyText ? `↩ ${replyText}` : 'Replied to a message';
  }
  return text;
}

const ChatCard = memo(function ChatCard({ room, onClick, user, index = 0 }: { room: ChatRoom; onClick: () => void; user: any; index?: number }) {
  const isUnread = room.last_message && !room.last_message.is_read && room.last_message.sender_id !== user?.id;
  const timeLabel = room.last_message
    ? formatDistanceToNow(new Date(room.last_message.created_at), { addSuffix: false })
        .replace('about ', '').replace('less than a minute', 'now').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd').replace(' minute', 'm').replace(' hour', 'h').replace(' day', 'd')
    : '';

  return (
    <button 
      onClick={onClick} 
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-100 dark:active:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/50 text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ animationFillMode: 'both', animationDelay: `${index * 40}ms` }}
    >
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          {room.participant.avatar_url
            ? <Image src={room.participant.avatar_url} alt={room.participant.full_name} fill className="object-cover" sizes="48px" />
            : <div className="h-full w-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg">{room.participant.full_name?.[0]?.toUpperCase() || 'U'}</div>
          }
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`text-[15px] truncate pr-2 ${isUnread ? 'font-extrabold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>{room.participant.full_name}</h3>
          <span className={`text-[11px] shrink-0 font-semibold ${isUnread ? 'text-indigo-500' : 'text-slate-400'}`}>{timeLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] truncate flex-1 ${isUnread ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
            {room.last_message ? formatPreview(room.last_message.content, room.last_message.message_type) : 'Tap to start chatting'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {room.last_message && room.last_message.sender_id === user?.id && (
              <span className={`flex items-center gap-0.5 ${room.last_message.is_read ? 'text-indigo-500' : 'text-slate-400'}`}>
                {room.last_message.is_read ? <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                <span className="text-[9px] font-bold uppercase tracking-widest">{room.last_message.is_read ? 'Seen' : 'Sent'}</span>
              </span>
            )}
            {isUnread && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow shadow-indigo-500/40" />}
          </div>
        </div>
      </div>
    </button>
  );
});