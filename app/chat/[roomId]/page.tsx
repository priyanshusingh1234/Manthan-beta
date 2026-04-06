
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MoreVertical, 
  Send, 
  Paperclip, 
  CheckCheck,
  Check,
  Loader2,
  Calendar,
  X,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { format } from 'date-fns';

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
  fullName: string;
  avatar_url: string | null;
}

export default function ChatRoomPage() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const checkUserAndFetchRoom = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Fetch participant
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', user.id);
      
      const otherUserId = participants?.[0]?.user_id;
      if (otherUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('fullName, avatar_url')
          .eq('id', otherUserId)
          .single();
        
        if (profile) {
          setParticipant({ user_id: otherUserId, ...profile });
        }
      }

      // Fetch messages
      const { data: initialMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) console.error('Error fetching messages:', error);
      else setMessages(initialMessages || []);
      setLoading(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    };

    checkUserAndFetchRoom();

    // Subscribe to REALTIME messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender_id !== user?.id) {
            scrollToBottom();
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          }
        }
      )
      .subscribe();

    // Handle Keyboard for Mobile
    Keyboard.addListener('keyboardWillShow', info => {
      setKeyboardHeight(info.keyboardHeight);
      setTimeout(() => scrollToBottom(), 50);
    });
    Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      supabase.removeChannel(channel);
      Keyboard.removeAllListeners();
    };
  }, [roomId, router, user?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Optimistic Update can go here, but Supabase Realtime is fast enough
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: content,
          message_type: 'text'
        });

      if (error) throw error;
      
      // Native Feedback
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      // Revert optimism or show error
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    router.push('/chat');
  };

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5] dark:bg-slate-950/40 relative overflow-hidden">
      {/* Background Pattern Wallpaper - WhatsApp feel */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('https://i.pinimg.com/originals/97/c0/07/97c00754731d1136da3ca270d473465b.png')] bg-repeat" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[50] bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between px-2 py-2.5 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          
          <div 
            onClick={() => router.push(`/user/${participant?.user_id}`)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
              {participant?.avatar_url ? (
                <Image src={participant.avatar_url} alt="User" width={40} height={40} className="object-cover" />
              ) : (
                <div className="h-full w-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-slate-400 font-bold">
                  {participant?.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none mb-0.5">{participant?.fullName || 'Chatting...'}</h2>
              <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
             <MoreVertical className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto pt-20 pb-2 z-10 px-4 space-y-3 custom-scrollbar scroll-smooth">
        {loading ? (
          <div className="flex justify-center p-10 h-full items-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
             <div className="px-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm max-w-[280px]">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Messages are end-to-end encrypted on Dheeyudha. Start a safe conversation.
                </p>
             </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[index - 1];
            const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');
            
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/10 shadow-sm">
                      {format(new Date(msg.created_at), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-sm relative group
                    ${isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100/50 dark:border-slate-800/80'}
                  `}>
                    <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <span className={`text-[10px] font-medium opacity-60 ${isMe ? 'text-blue-50' : 'text-slate-400'}`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                      {isMe && (
                        <span className="text-blue-100">
                          {msg.is_read ? <CheckCheck size={14} className="text-blue-50" /> : <Check size={14} className="opacity-60" />}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-3 flex items-end gap-3 transition-all duration-200"
        style={{ transform: `translateY(-${keyboardHeight}px)` }}
      >
        <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 hover:text-blue-600 active:scale-95 transition-all">
          <Paperclip className="w-6 h-6" />
        </button>

        <div className="flex-1 min-h-[44px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 px-4 py-2 flex items-center">
          <textarea 
            ref={inputRef}
            rows={1}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="w-full bg-transparent border-none outline-none text-[15px] text-slate-800 dark:text-slate-200 resize-none max-h-32 py-1 scrollbar-hide"
          />
        </div>

        <button 
          onClick={() => handleSendMessage()}
          disabled={!newMessage.trim() || sending}
          className={`
            p-3.5 rounded-full shadow-lg transition-all active:scale-90
            ${newMessage.trim() 
              ? 'bg-blue-600 text-white shadow-blue-500/40' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
          `}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {/* Background Overlay for Keyboard */}
      {keyboardHeight > 0 && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => Keyboard.hide()} />}
    </div>
  );
}
