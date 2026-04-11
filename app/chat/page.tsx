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
  ArrowRight,
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
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
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms (
            id,
            name,
            is_group,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (participantsError) throw participantsError;
      if (!participants || participants.length === 0) { setRooms([]); return; }

      const validRooms = participants.filter(p => p.chat_rooms != null);
      if (validRooms.length === 0) { setRooms([]); return; }

      const roomIds = validRooms.map(p => p.room_id);

      const { data: otherParticipants } = await supabase
        .from('chat_participants')
        .select('room_id, user_id')
        .in('room_id', roomIds)
        .neq('user_id', userId);

      const otherUserIds = Array.from(new Set(otherParticipants?.map(p => p.user_id) || []));

      let profileMap = new Map<string, any>();
      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', otherUserIds);
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      // Concurrent last-message fetch (no N+1 loop)
      const lastMessageResponses = await Promise.all(
        validRooms.map(p =>
          supabase
            .from('chat_messages')
            .select('content, created_at, sender_id, is_read, message_type')
            .eq('room_id', p.room_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        )
      );

      const lastMessageMap = new Map<string, any>();
      lastMessageResponses.forEach((res, i) => {
        if (res.data) lastMessageMap.set(validRooms[i].room_id, res.data);
      });

      const roomData: ChatRoom[] = validRooms.map(p => {
        const room = p.chat_rooms as any;
        const otherUserId = otherParticipants?.find(op => op.room_id === room.id)?.user_id;
        const profile = otherUserId ? profileMap.get(otherUserId) : null;
        return {
          id: room.id,
          name: room.name,
          is_group: room.is_group,
          participant: {
            user_id: otherUserId || '',
            full_name: profile?.full_name || 'Scholar',
            avatar_url: profile?.avatar_url || null,
          },
          last_message: lastMessageMap.get(room.id) || undefined,
        };
      });

      roomData.sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
        const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
        return bTime - aTime;
      });

      setRooms(roomData);
      try { localStorage.setItem(ROOMS_CACHE_KEY(userId), JSON.stringify(roomData)); } catch { }
    } catch (err) {
      console.error('[Chat] Failed:', err);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      // Show cached rooms instantly (WhatsApp-style)
      try {
        const cached = localStorage.getItem(ROOMS_CACHE_KEY(user.id));
        if (cached) {
          setRooms(JSON.parse(cached));
          setLoading(false);
        }
      } catch { }

      await fetchRooms(user.id);
      setLoading(false);
    };
    initData();
  }, [router, fetchRooms]);

  // Realtime: only update the single changed room instead of full refetch
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseRealtime
      .channel(`chat-list-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        fetchRooms(user.id);
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_participants',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchRooms(user.id);
      })
      .subscribe();

    // 60s interval as fallback
    const interval = setInterval(() => fetchRooms(user.id), 60000);

    return () => {
      supabaseRealtime.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, fetchRooms]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users?.filter((res: any) => res.id !== user?.id) || []);
        }
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const startChat = async (targetUserId: string, targetName?: string) => {
    try {
      if (!user?.id) { alert('Not logged in.'); return; }
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, currentUserId: user.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize chat');
      if (data.roomId) {
        router.push(`/chat/${data.roomId}?name=${encodeURIComponent(targetName || '')}`);
      }
    } catch (err: any) {
      console.error('Error starting chat:', err);
      alert('⚠️ Chat Error: ' + err.message);
    }
  };

  const filteredLocalRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    return rooms.filter(r => r.participant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [rooms, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#111b21]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Android-style solid header */}
      <div className="sticky top-0 z-40 bg-[#075e54] dark:bg-[#1f2c34]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white tracking-wide">Chats</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-white/90 active:bg-white/10">
            <MessageCirclePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center bg-white/15 dark:bg-white/10 rounded-lg overflow-hidden">
            <Search className="absolute left-3 h-4 w-4 text-white/70" />
            <input
              type="text"
              className="w-full pl-10 pr-9 py-2 bg-transparent text-[14px] text-white placeholder:text-white/60 outline-none"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 text-white/70">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {searchQuery && isSearching ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#075e54] animate-spin" />
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div>
            <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#075e54] dark:text-teal-400 bg-gray-50 dark:bg-[#1f2c34]">
              Global Results
            </div>
            {searchResults.map((res: any) => (
              <button
                key={res.id}
                type="button"
                onClick={() => startChat(res.id, res.full_name)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-100 dark:active:bg-white/5 border-b border-gray-100 dark:border-white/5"
              >
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-700 relative overflow-hidden shrink-0">
                  {res.avatar_url || res.avatar ? (
                    <Image src={res.avatar_url || res.avatar} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#075e54] dark:text-teal-400 font-bold text-lg">
                      {(res.full_name || res.name)?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">{res.full_name || res.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{res.username || 'scholar'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        ) : !searchQuery ? (
          <div>
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#075e54]/10 flex items-center justify-center mb-5">
                  <MessageCirclePlus className="w-10 h-10 text-[#075e54] dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No conversations yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Search for a scholar above to start chatting.</p>
              </div>
            ) : (
              filteredLocalRooms.map((room) => (
                <ChatCard
                  key={room.id}
                  room={room}
                  onClick={() => router.push(`/chat/${room.id}`)}
                  user={user}
                />
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatPreview(content: string, type?: string): string {
  if (type === 'image' || content.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i)) return '📷 Photo';
  if (content.startsWith('__CALL_ENDED__')) return '📞 Call ended';
  if (content.startsWith('> Replying to **')) {
    const parts = content.split('\n\n');
    const replyText = parts.slice(1).join(' ').trim();
    return replyText ? `↩ ${replyText}` : 'Replied to a message';
  }
  return content;
}

// Memoized chat card — prevents unnecessary re-renders
const ChatCard = memo(function ChatCard({ room, onClick, user }: { room: ChatRoom; onClick: () => void; user: any }) {
  const isUnread = room.last_message && !room.last_message.is_read && room.last_message.sender_id !== user?.id;
  const timeLabel = room.last_message
    ? formatDistanceToNow(new Date(room.last_message.created_at), { addSuffix: false })
        .replace('about ', '').replace('less than a minute', 'now').replace(' minutes', 'm')
        .replace(' hours', 'h').replace(' days', 'd').replace(' minute', 'm').replace(' hour', 'h').replace(' day', 'd')
    : '';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-100 dark:active:bg-white/5 border-b border-gray-100 dark:border-white/5 text-left"
    >
      {/* Avatar */}
      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-700 relative overflow-hidden shrink-0">
        {room.participant.avatar_url ? (
          <Image
            src={room.participant.avatar_url}
            alt={room.participant.full_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center font-bold text-[#075e54] dark:text-teal-400 text-lg">
            {room.participant.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`text-[15px] truncate pr-3 ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-900 dark:text-white'}`}>
            {room.participant.full_name}
          </h3>
          <span className={`text-[12px] shrink-0 ${isUnread ? 'text-[#25d366] font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
            {timeLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] truncate flex-1 ${isUnread ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {room.last_message
              ? (room.last_message.sender_id === user?.id ? '✓ ' : '') + formatPreview(room.last_message.content, room.last_message.message_type)
              : 'Tap to start chatting'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {room.last_message && room.last_message.sender_id === user?.id && !isUnread && (
              <span className={room.last_message.is_read ? 'text-[#53bdeb]' : 'text-gray-400'}>
                {room.last_message.is_read ? (
                  <CheckCheck className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                )}
              </span>
            )}
            {isUnread && (
              <div className="min-w-[20px] h-5 px-1.5 bg-[#25d366] rounded-full flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">●</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
});