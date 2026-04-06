'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X,
  Loader2,
  CheckCheck,
  Check,
  MessageCirclePlus,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await Promise.all([fetchRooms(user.id), fetchFollowing(user.id)]);
      setLoading(false);
    };
    initData();
  }, [router]);

  const fetchRooms = async (userId: string) => {
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
  };

  const fetchFollowing = async (userId: string) => {
    try {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (!follows || follows.length === 0) return;

      const followingIds = follows.map((f: any) => f.following_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', followingIds)
        .limit(20);
      
      if (profiles) {
        setFollowing(profiles.map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Scholar',
          username: p.username || '',
          avatar: p.avatar_url
        })));
      }
    } catch (err) {
      console.error("Failed following fetching:", err);
    }
  };

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

  const startChat = async (targetUserId: string) => {
    try {
      if (!user?.id) {
        alert('You are not logged in. Please refresh or login again.');
        return;
      }
      
      // Start loading state would go here
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, currentUserId: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize chat');
      
      if (data.roomId) {
        router.push(`/chat/${data.roomId}`);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 mt-4 lg:mt-0">
      {/* Dynamic Header - Positioned below global header if desktop */}
      <div className="sticky top-0 lg:top-[64px] z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Messages
            </h1>
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
              className="block w-full pl-12 pr-10 py-3.5 bg-slate-100/80 dark:bg-slate-900/80 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-2xl text-[15px] font-medium text-slate-900 dark:text-white transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-500 shadow-sm"
              placeholder="Search chats or find scholars..."
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
        {/* Following Tray */}
        {!searchQuery && !loading && following.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 ml-1">
              Start Chat
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {following.map((fw) => (
                <button 
                  key={fw.id}
                  onClick={() => startChat(fw.id)}
                  className="flex flex-col items-center gap-2 min-w-[72px] snap-start group"
                >
                  <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-600/20 group-active:scale-95 transition-transform duration-200">
                    <div className="relative h-14 w-14 bg-white dark:bg-slate-900 rounded-full border-2 border-white dark:border-slate-950 overflow-hidden">
                      {fw.avatar ? (
                        <Image src={fw.avatar} alt={fw.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-lg">
                          {fw.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 w-full truncate text-center px-1">
                    {fw.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                    startChat(res.id);
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
        ) : null}

        {/* Local Chat List */}
        <div className="space-y-2">
          {!searchQuery && <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 ml-1">Recent Chats</h2>}
          
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-900 h-[88px] rounded-3xl mb-2" />
            ))
          ) : filteredLocalRooms.length === 0 && !searchQuery ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                <MessageCirclePlus className="w-8 h-8 text-blue-600 dark:text-blue-400 -rotate-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No active chats</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Message your friends above to start a conversation.</p>
            </div>
          ) : filteredLocalRooms.map((room) => (
            <ChatCard key={room.id} room={room} onClick={() => router.push(`/chat/${room.id}`)} user={user} />
          ))}
        </div>
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
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-slate-50 dark:border-slate-950 rounded-full z-20" />
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
            <div className={`shrink-0 ${room.last_message.is_read ? 'text-blue-500' : 'text-slate-400'}`}>
              <CheckCheck className="w-[18px] h-[18px]" strokeWidth={2.5} />
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
