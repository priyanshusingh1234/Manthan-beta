
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  UserPlus, 
  ArrowLeft,
  X,
  Loader2,
  CheckCheck,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';
import BottomNav from '@/components/BottomNav';

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  participant: {
    user_id: string;
    fullName: string;
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
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  // Fetch Existing Chats
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
        let participantInfo = { fullName: 'Scholar', avatar_url: null };

        if (otherUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('fullName, avatar_url')
            .eq('id', otherUserId)
            .single();
          
          if (profile) participantInfo = profile;
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
            ...participantInfo
          },
          last_message: lastMessage || undefined
        });
      }

      setRooms(roomData);
    } catch (err) {
      console.error('[Chat] Failed to fetch rooms:', err);
    }
  };

  // Fetch People User is Following
  const fetchFollowing = async (userId: string) => {
    try {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (!follows || follows.length === 0) return;

      const followingIds = follows.map((f: any) => f.following_id);
      
      // Need profile details for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, fullName, username, avatar_url')
        .in('id', followingIds)
        .limit(20); // Top 20 for the horizontal bar
      
      if (profiles) {
        setFollowing(profiles.map((p: any) => ({
          id: p.id,
          name: p.fullName || 'Scholar',
          username: p.username || '',
          avatar: p.avatar_url
        })));
      }
    } catch (err) {
      console.error("Failed to fetch following:", err);
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
      // Use the existing users search API
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // The search API returns standard profile data under data.users
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
      const { data: myParticipants } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);
      
      const myRoomIds = myParticipants?.map((p: any) => p.room_id) || [];

      if (myRoomIds.length > 0) {
        const { data: commonRooms } = await supabase
          .from('chat_participants')
          .select('room_id')
          .in('room_id', myRoomIds)
          .eq('user_id', targetUserId);
        
        if (commonRooms && commonRooms.length > 0) {
          for (const cr of commonRooms) {
            const { count } = await supabase
              .from('chat_participants')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', cr.room_id);
            
            if (count === 2) {
              router.push(`/chat/${cr.room_id}`);
              return;
            }
          }
        }
      }

      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ is_group: false })
        .select()
        .single();
      
      if (roomError) throw roomError;

      await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: targetUserId }
      ]);

      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <DesktopSidebar />
      
      <main className="lg:pl-64 pt-4 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Header & Global Search */}
          <div className="px-4 sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl z-20 pb-4 pt-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Direct Messages</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search scholars by username or name to chat..."
                className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                value={searchQuery}
                onFocus={() => setIsSearchActive(true)}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setIsSearchActive(false); setSearchResults([]); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {!isSearchActive && !searchQuery ? (
            <>
              {/* Following Horizontal Bar (Instagram Stories Style) */}
              {!loading && following.length > 0 && (
                <div className="mb-6 px-4">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Following</h2>
                  <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
                    {following.map((fw) => (
                      <button 
                        key={fw.id} 
                        onClick={() => startChat(fw.id)}
                        className="flex flex-col items-center gap-1 shrink-0 snap-start active:scale-95 transition-transform"
                      >
                        <div className="h-16 w-16 p-0.5 rounded-full bg-gradient-to-tr from-blue-500 to-fuchsia-500 shadow-sm relative group overflow-hidden">
                          <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-full m-[2px]" />
                          <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-transparent">
                            {fw.avatar ? (
                              <Image src={fw.avatar} alt={fw.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                {fw.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-100 dark:border-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-16 truncate text-center">
                          {fw.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat List */}
              <div className="px-4 space-y-1">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-slate-900/50 h-[84px] rounded-2xl border border-slate-100 dark:border-slate-800/60 mb-2" />
                  ))
                ) : rooms.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed mt-4 mx-2">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-5 mx-auto">
                      <MessageSquare className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No conversations yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[250px] mx-auto text-sm">
                      Search above to find friends or tap a scholar you follow to start a chat.
                    </p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <ChatCard key={room.id} room={room} onClick={() => router.push(`/chat/${room.id}`)} />
                  ))
                )}
              </div>
            </>
          ) : (
            /* Search Results Overlay View */
            <div className="px-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                <span>Search Results</span>
                {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              </h2>
              
              {!isSearching && searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900/50 py-4 px-6 rounded-2xl inline-block border border-slate-200 dark:border-slate-800">
                    No scholars found matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((res: any) => (
                    <button 
                      key={res.id}
                      onClick={() => startChat(res.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all active:scale-[0.98] shadow-sm group"
                    >
                      <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm">
                        {res.avatar_url || res.avatar ? (
                          <Image src={res.avatar_url || res.avatar} alt={res.full_name || res.name} fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            {(res.full_name || res.name)?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                          {res.full_name || res.name}
                          {res.isTeacher || res.is_teacher ? (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold">TCHR</span>
                          ) : null}
                        </p>
                        <p className="text-xs font-semibold text-blue-500 truncate">@{res.username || 'scholar'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function ChatCard({ room, onClick }: { room: ChatRoom; onClick: () => void }) {
  return (
    <motion.button 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-transparent rounded-2xl transition-all sm:hover:bg-slate-50 dark:hover:bg-slate-900/50 group border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
    >
      <div className="relative h-[3.25rem] w-[3.25rem] shrink-0">
        <div className="h-full w-full rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] bg-slate-50 dark:bg-slate-800">
          {room.participant.avatar_url ? (
            <Image src={room.participant.avatar_url} alt={room.participant.fullName} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-lg">
              {room.participant.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
      </div>

      <div className="flex-1 min-w-0 text-left py-1">
        <div className="flex items-center justify-between mb-[2px]">
          <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate pr-2 group-hover:text-blue-600 transition-colors">
            {room.participant.fullName}
          </p>
          {room.last_message && (
            <span className={`text-[11px] font-semibold tracking-tight shrink-0 ${!room.last_message.is_read && room.last_message.sender_id !== room.participant.user_id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              {formatDistanceToNow(new Date(room.last_message.created_at), { addSuffix: false }).replace('about ', '').replace('less than a minute', 'Just now')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[13px] truncate flex-1 ${!room.last_message?.is_read && room.last_message?.sender_id !== room.participant.user_id ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
            {room.last_message ? room.last_message.content : 'Started a conversation'}
          </p>
          
          {/* Read markers */}
          {room.last_message?.sender_id === room.participant.user_id ? ( // If I sent it (wait, sender_id is the sender. if sender is NOT participant, it means I sent it)
             null // If they sent it, no double checks.
          ) : room.last_message && (
            <div className="flex items-center shrink-0">
               <CheckCheck className={`w-4 h-4 ${room.last_message.is_read ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
            </div>
          )}

          {/* Unread dot */}
          {!room.last_message?.is_read && room.last_message && room.last_message.sender_id === room.participant.user_id && (
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 shadow-sm shadow-blue-500/50" />
          )}

        </div>
      </div>
    </motion.button>
  );
}
