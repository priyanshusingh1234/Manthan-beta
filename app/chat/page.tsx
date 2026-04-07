'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  Loader2,
  Check,
  CheckCheck,
  MessageCirclePlus,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import ChatRail from '@/components/ChatRail';

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
  };
}

interface FollowingUser {
  id: string;
  name: string;
  avatar: string | null;
  username: string;
}

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

      const roomData: ChatRoom[] = [];

      for (const p of participants) {
        const room = p.chat_rooms as any;
        if (!room) continue;

        const { data: otherParticipants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', room.id)
          .neq('user_id', userId);

        const otherUserId = otherParticipants?.[0]?.user_id;
        let participantInfo = { full_name: 'Scholar', avatar_url: null as string | null };

        if (otherUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (profile) participantInfo = { full_name: profile.full_name, avatar_url: profile.avatar_url };
        }

        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('content, created_at, sender_id, is_read')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        roomData.push({
          id: room.id,
          name: room.name,
          is_group: room.is_group,
          participant: {
            user_id: otherUserId || '',
            full_name: participantInfo.full_name,
            avatar_url: participantInfo.avatar_url
          },
          last_message: lastMessage || undefined
        });
      }

      setRooms(roomData);
    } catch (err) {
      console.error('[Chat] Failed:', err);
    }
  }, []);

  const refreshChatData = useCallback(async (userId: string) => {
    await fetchRooms(userId);
  }, [fetchRooms]);

  useEffect(() => {
    const initData = async () => {
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
      await fetchRooms(user.id);
      setLoading(false);
    };
    initData();
  }, [router, fetchRooms]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseRealtime
      .channel(`chat-list-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          fetchRooms(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` },
        () => {
          refreshChatData(user.id);
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      refreshChatData(user.id);
    }, 60000);

    return () => {
      supabaseRealtime.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, fetchRooms, refreshChatData]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users?.filter((res: any) => res.id !== user?.id) || []);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const startChat = async (targetUserId: string, targetName?: string) => {
    try {
      if (!user?.id) {
        alert('You are not logged in. Please refresh or login again.');
        return;
      }
      
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, currentUserId: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize chat');
      
      if (data.roomId) {
        const path = `/chat/${data.roomId}?name=${encodeURIComponent(targetName || '')}`;
        if (router && typeof router.push === 'function') {
          router.push(path);
        } else {
          window.location.href = path;
        }
      } else {
        throw new Error('No roomId returned from server');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6 pb-4">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (router && typeof router.push === 'function') {
                    router.push('/feed');
                  } else {
                    window.location.href = '/feed';
                  }
                }}
                className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Messages
              </h1>
            </div>
            <button className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">
              <MessageCirclePlus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-10 py-3.5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-2xl text-[15px] font-medium text-slate-900 dark:text-white transition-all outline-none placeholder:text-slate-500 shadow-sm"
              placeholder="Search active chats or find new scholars..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* Global Search Results */}
        {searchQuery && isSearching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 ml-1">Global Matches</h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {searchResults.map((res: any, idx) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    startChat(res.id, res.full_name);
                  }}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group ${idx !== searchResults.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 relative overflow-hidden shrink-0">
                    {res.avatar_url || res.avatar ? (
                      <Image src={res.avatar_url || res.avatar} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold">
                        {(res.full_name || res.name)?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slate-900 dark:text-white text-[15px]">{res.full_name || res.name}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">@{res.username || 'scholar'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : !searchQuery ? (
          <div className="space-y-2">
            {!searchQuery && <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 ml-1">Recent Chats</h2>}

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-900 h-[88px] rounded-3xl mb-2" />
              ))
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 px-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                  <MessageCirclePlus className="w-8 h-8 text-blue-600 dark:text-blue-400 -rotate-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No active chats</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Search for someone above to start a conversation.</p>
              </div>
            ) : filteredLocalRooms.map((room) => (
              <ChatCard key={room.id} room={room} onClick={() => {
                const path = `/chat/${room.id}`;
                if (router && typeof router.push === 'function') {
                  router.push(path);
                } else {
                  window.location.href = path;
                }
              }} user={user} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChatCard({ room, onClick, user }: { room: ChatRoom; onClick: () => void; user: any }) {
  const isUnread = room.last_message && !room.last_message.is_read && room.last_message.sender_id !== user?.id;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-200 group text-left
        ${isUnread
          ? 'bg-white dark:bg-slate-900 shadow-md shadow-blue-900/5 ring-1 ring-blue-500/20'
          : 'bg-transparent hover:bg-white dark:hover:bg-slate-900/80 hover:shadow-sm'
        }`}
    >
      <div className="relative">
        <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative z-10">
          {room.participant.avatar_url ? (
            <Image src={room.participant.avatar_url} alt={room.participant.full_name} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center font-bold text-slate-400 text-lg">
              {room.participant.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-[16px] truncate pr-4 transition-colors ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
            {room.participant.full_name}
          </h3>
          {room.last_message && (
            <span className={`text-[11px] font-semibold tracking-wide shrink-0 ${isUnread ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              {formatDistanceToNow(new Date(room.last_message.created_at), { addSuffix: false }).replace('about ', '').replace('less than a minute', 'now')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[14px] truncate flex-1 ${isUnread ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-medium text-slate-500'}`}>
            {room.last_message ? room.last_message.content : 'Break the ice!'}
          </p>

          {room.last_message && room.last_message.sender_id === user?.id && (
            <div className={`shrink-0 ${room.last_message.is_read ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}>
              {room.last_message.is_read ? (
                <CheckCheck className="w-[18px] h-[18px]" strokeWidth={2.5} />
              ) : (
                <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
              )}
            </div>
          )}

          {isUnread && (
            <div className="w-3 h-3 bg-blue-600 rounded-full shrink-0 shadow-lg shadow-blue-600/50" />
          )}
        </div>
      </div>
    </motion.button>
  );
}