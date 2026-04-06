
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  ChevronRight, 
  UserPlus, 
  ArrowLeft,
  X,
  Loader2,
  Clock,
  CheckCheck
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

export default function ChatListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchRooms(user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchRooms = async (userId: string) => {
    try {
      setLoading(true);
      // Fetch rooms where the user is a participant
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

        // Fetch other participant (for 1-on-1 chats)
        const { data: otherParticipants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', room.id)
          .neq('user_id', userId);

        const otherUserId = otherParticipants?.[0]?.user_id;
        let participantInfo = { fullName: 'External User', avatar_url: null };

        if (otherUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('fullName, avatar_url')
            .eq('id', otherUserId)
            .single();
          
          if (profile) {
            participantInfo = profile;
          }
        }

        // Fetch last message
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('content, created_at, sender_id', 'is_read')
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
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results.filter((res: any) => res.id !== user?.id));
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const startChat = async (targetUser: any) => {
    try {
      // 1. Fetch current user's rooms
      const { data: myParticipants } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);
      
      const myRoomIds = myParticipants?.map(p => p.room_id) || [];

      // 2. See if target user is in any of those rooms (and it's a 1-on-1)
      if (myRoomIds.length > 0) {
        const { data: commonRooms } = await supabase
          .from('chat_participants')
          .select('room_id')
          .in('room_id', myRoomIds)
          .eq('user_id', targetUser.id);
        
        if (commonRooms && commonRooms.length > 0) {
          // Verify if it's 1-on-1 (only 2 participants)
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

      // 3. Create new room if none found
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ is_group: false })
        .select()
        .single();
      
      if (roomError) throw roomError;

      // 4. Add both participants
      await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: targetUser.id }
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
        <div className="max-w-3xl mx-auto px-4">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </header>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 h-24 rounded-2xl border border-slate-100 dark:border-slate-800" />
              ))
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No messages yet</p>
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              rooms.map((room) => (
                <ChatCard key={room.id} room={room} onClick={() => router.push(`/chat/${room.id}`)} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* New Chat Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-950 w-full max-w-xl h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => handleSearchUsers('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {isSearchingUsers ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Scholars found</p>
                    {searchResults.map((usr) => (
                      <button 
                        key={usr.id}
                        onClick={() => startChat(usr)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-2xl transition-all group"
                      >
                        <div className="relative h-12 w-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                          {usr.avatar_url ? (
                            <Image src={usr.avatar_url} alt={usr.fullName} fill className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              {usr.fullName?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{usr.fullName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">@{usr.username || 'scholar'}</p>
                        </div>
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <UserPlus className="w-5 h-5" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500">No scholars matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Search for friends to start chatting</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function ChatCard({ room, onClick }: { room: ChatRoom; onClick: () => void }) {
  return (
    <motion.button 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl transition-all shadow-sm hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 group"
    >
      <div className="relative h-14 w-14 shrink-0">
        <div className="h-full w-full rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm relative">
          {room.participant.avatar_url ? (
            <Image src={room.participant.avatar_url} alt={room.participant.fullName} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              {room.participant.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        {/* Active status indicator could go here */}
        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{room.participant.fullName}</p>
          {room.last_message && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {formatDistanceToNow(new Date(room.last_message.created_at), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1">
            {room.last_message ? room.last_message.content : 'No messages yet'}
          </p>
          {room.last_message?.sender_id === room.participant.user_id ? (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              1
            </div>
          ) : room.last_message && (
            <div className="flex items-center text-blue-500">
               <CheckCheck className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
    </motion.button>
  );
}
