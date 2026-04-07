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
  Video,
  MessageCirclePlus
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

    const channel = supabaseRealtime
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

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
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
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
      supabaseRealtime.removeChannel(channel);
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
        setMessages(prev => {
          if (prev.some(m => m.id === insertedMessage.id)) return prev;
          return [...prev, insertedMessage as Message];
        });
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0b0f14] dark:text-white pb-28">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,153,240,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(241,245,249,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,153,240,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(to_bottom,rgba(2,6,23,0.96),rgba(9,14,20,0.96))]" />

      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-[28px] border border-white/60 bg-white/85 px-3 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/85">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
                if (router && typeof router.push === 'function') {
                  router.push('/chat');
                } else {
                  window.location.href = '/chat';
                }
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-700 transition-all active:scale-95 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Back to chats"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (participant?.user_id) router.push(`/user/${participant.user_id}`);
              }}
              className="flex min-w-0 items-center gap-3 rounded-[22px] px-2 py-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
            >
              <div className="relative shrink-0">
                <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                  {participant?.avatar_url ? (
                    <Image src={participant.avatar_url} alt="User" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">
                      {participant?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[16px]">
                    {participant?.full_name || 'Scholar'}
                  </h2>
                  <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 sm:inline-flex">
                    Online
                  </span>
                </div>
                <p className="truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  Room ID {String(roomId).slice(0, 8).toUpperCase()}
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white">
              <Phone className="h-5 w-5" />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white sm:flex">
              <Video className="h-5 w-5" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
            <div className="max-w-md rounded-[30px] border border-slate-200/80 bg-white/90 px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
                <MessageCirclePlus className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Your conversation starts here
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                Send the first message to open the thread in this room. The design stays quiet so the conversation is the focus.
              </p>
              <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Room ID {String(roomId).slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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
                      <span className="px-4 py-1.5 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm border border-white/50 dark:border-slate-800/50">
                        {formatDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNextSame ? 'mb-0.5' : 'mb-3'}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`
                        relative max-w-[85%] sm:max-w-[72%] px-4 py-3 group
                        ${isMe
                          ? 'bg-gradient-to-br from-[#3897f0] to-[#1d4ed8] text-white shadow-[0_16px_35px_rgba(59,130,246,0.28)]'
                          : 'bg-white/95 dark:bg-slate-950/80 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-slate-200/80 dark:border-slate-800/80'
                        }
                        ${isMe
                          ? `rounded-l-[20px] ${!isPrevSame ? 'rounded-tr-[20px]' : 'rounded-tr-[8px]'} ${!isNextSame ? 'rounded-br-[20px]' : 'rounded-br-[8px]'}`
                          : `rounded-r-[20px] ${!isPrevSame ? 'rounded-tl-[20px]' : 'rounded-tl-[8px]'} ${!isNextSame ? 'rounded-bl-[20px]' : 'rounded-bl-[8px]'}`
                        }
                      `}
                    >
                      <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                      <div className={`flex items-center justify-end gap-1.5 mt-0.5 select-none`}>
                        <span className={`text-[10px] font-semibold ${isMe ? 'text-blue-100/90' : 'text-slate-400 dark:text-slate-500'}`}>
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
        </div>

      {/* Input Overlay */}
      <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6"
        style={{ transform: `translateY(-${keyboardHeight}px)`, paddingBottom: `max(env(safe-area-inset-bottom), 12px)` }}
      >
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-[30px] border border-white/70 bg-white/90 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/90">
            <button className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white">
              <Paperclip className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={2.2} />
            </button>

            <div className="flex-1 rounded-[24px] border border-slate-200 bg-slate-50/90 min-h-[48px] flex items-center shadow-inner dark:border-slate-800 dark:bg-slate-900/80">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Write a message..."
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
                className="w-full resize-none border-none bg-transparent px-4 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className={`
                mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all active:scale-95
                ${newMessage.trim()
                  ? 'bg-gradient-to-br from-[#3897f0] to-[#1d4ed8] text-white shadow-[0_12px_28px_rgba(59,130,246,0.28)]'
                  : 'border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'}
              `}
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 translate-x-[1px] -translate-y-[1px]" />}
            </button>
          </div>
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