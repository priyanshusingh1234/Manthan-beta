'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
  Phone,
  Video
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const replaceOrAppendMessage = (message: Message) => {
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === message.id);
      if (exists) {
        return prev.map((item) => (item.id === message.id ? message : item));
      }

      return [...prev, message];
    });
  };

  useEffect(() => {
    const initChat = async () => {
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

      const { data: participants, error: pError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', user.id);

      if (pError) console.error("Participant fetch error:", pError);

      const otherUserId = participants?.[0]?.user_id;

      // Set initial state from query params to avoid "Scholar" flash
      if (initialName && !participant) {
        setParticipant({
          user_id: otherUserId || '',
          full_name: initialName,
          avatar_url: null,
          username: ''
        });
      }

      if (otherUserId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, username')
          .eq('id', otherUserId)
          .single();

        if (profileError) console.error("Profile fetch error:", profileError);

        if (profile) {
          setParticipant({
            user_id: otherUserId,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            username: profile.username
          });
        }
      }

      const { data: initialMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      setMessages(initialMessages || []);
      setLoading(false);

      // Mark unread as read
      const unreadIds = (initialMessages || []).filter(m => !m.is_read && m.sender_id !== user.id).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds);
      }

      setTimeout(() => scrollToBottom('auto'), 100);
    };

    initChat();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message;
          replaceOrAppendMessage(msg);

          if (msg.sender_id !== user?.id) {
            scrollToBottom();
            Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

            // Mark as read if we are in the room viewing it
            await supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const updatedMsg = payload.new as Message;
          replaceOrAppendMessage(updatedMsg);
        }
      )
      .subscribe();

    try {
      Keyboard.addListener('keyboardWillShow', info => {
        setKeyboardHeight(info.keyboardHeight);
        setTimeout(() => scrollToBottom(), 50);
      });
      Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    } catch (e) { }

    return () => {
      supabase.removeChannel(channel);
      try { Keyboard.removeAllListeners(); } catch (e) { }
    };
  }, [roomId, router, user?.id]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
      const { data: insertedMessage, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: user.id, content, message_type: 'text' })
        .select('*')
        .single();
      if (error) throw error;

      if (insertedMessage) {
        replaceOrAppendMessage(insertedMessage as Message);
      }

      scrollToBottom();
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#f0f2f5] dark:bg-[#0b141a] relative">
      {/* Premium Wallpaper */}
      <div className="fixed inset-0 z-0 opacity-40 dark:opacity-[0.06] pointer-events-none mix-blend-overlay">
        <Image src="https://i.pinimg.com/originals/97/c0/07/97c00754731d1136da3ca270d473465b.png" alt="pattern" fill className="object-cover opacity-50" />
      </div>

      {/* Header - Flowing naturally with sticky top */}
      <header
        className="sticky top-[60px] md:top-0 left-0 lg:left-64 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-2 sm:px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-1">
          <button onClick={() => {
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
            if (router && typeof router.push === 'function') {
              router.push('/chat');
            } else {
              window.location.href = '/chat';
            }
          }} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" strokeWidth={2.5} />
          </button>

          <div onClick={() => router.push(`/user/${participant?.user_id}`)} className="flex items-center gap-3 cursor-pointer p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="relative">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                {participant?.avatar_url ? (
                  <Image src={participant.avatar_url} alt="User" fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold text-lg">
                    {/* FIXED: changed fullName to full_name */}
                    {participant?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                {participant?.full_name || 'Scholar'}
              </h2>
              <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
                Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hidden sm:block">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages View */}
      <div className="flex-1 px-4 py-6 z-10 relative max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900/50 max-w-[280px]">
              🔒 Messages are securely processed. Start a battle of minds and connect.
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              const prevMsg = messages[index - 1];
              const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

              const nextMsg = messages[index + 1];
              const isNextSame = nextMsg && nextMsg.sender_id === msg.sender_id && format(new Date(nextMsg.created_at), 'yyyy-MM-dd') === format(new Date(msg.created_at), 'yyyy-MM-dd');
              const isPrevSame = prevMsg && prevMsg.sender_id === msg.sender_id && !showDate;

              return (
                <div key={msg.id} className="w-full flex flex-col">
                  {/* Date Pill */}
                  {showDate && (
                    <div className="flex justify-center my-5">
                      <span className="px-4 py-1.5 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest shadow-sm">
                        {formatDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNextSame ? 'mb-0.5' : 'mb-3'}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`
                        relative max-w-[85%] sm:max-w-[75%] px-3.5 py-2 group
                        ${isMe
                          ? 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50'
                        }
                        shadow-sm
                        ${isMe
                          ? `rounded-l-[20px] ${!isPrevSame ? 'rounded-tr-[20px]' : 'rounded-tr-[8px]'} ${!isNextSame ? 'rounded-br-[20px]' : 'rounded-br-[8px]'}`
                          : `rounded-r-[20px] ${!isPrevSame ? 'rounded-tl-[20px]' : 'rounded-tl-[8px]'} ${!isNextSame ? 'rounded-bl-[20px]' : 'rounded-bl-[8px]'}`
                        }
                      `}
                    >
                      <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                      <div className={`flex items-center justify-end gap-1.5 mt-0.5 select-none`}>
                        <span className={`text-[10px] font-semibold ${isMe ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                        {isMe && (
                          <span className={`flex translate-y-[1px]`}>
                            {msg.is_read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-200" strokeWidth={3} />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-blue-300/80" strokeWidth={3} />
                            )}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input Overlay */}
      <div
        className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-3xl px-2 py-2 sm:px-4 sm:py-3 z-50 flex items-end gap-2 border-t border-slate-200/50 dark:border-slate-800/50 fixed bottom-0 left-0 lg:left-64 right-0"
        style={{ transform: `translateY(-${keyboardHeight}px)`, paddingBottom: `max(env(safe-area-inset-bottom), 12px)` }}
      >
        <button className="p-3 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 active:scale-90 transition-transform mb-0.5">
          <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
        </button>

        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-3xl min-h-[44px] flex items-center shadow-sm">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full bg-transparent border-none outline-none text-[15px] sm:text-base text-slate-800 dark:text-slate-100 resize-none py-3 px-4 max-h-[120px] custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className={`
            mb-0.5 p-3 sm:p-3.5 rounded-full shadow-lg active:scale-95 transition-all
            ${newMessage.trim()
              ? 'bg-blue-600 text-white shadow-blue-600/30'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 shadow-none'}
          `}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 sm:w-[22px] sm:h-[22px]" style={{ transform: 'translate(1px, -1px)' }} />}
        </button>
      </div>

      {keyboardHeight > 0 && <div className="absolute inset-0 z-40 bg-transparent" onClick={() => Keyboard.hide()} />}
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <ChatRoomContent />
    </React.Suspense>
  )
}