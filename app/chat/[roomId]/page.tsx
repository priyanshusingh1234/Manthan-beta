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
  MessageCirclePlus,
  Trash2,
  Reply,
  X,
  VolumeX,
  Ban
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deletedForMe, setDeletedForMe] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStats, setProfileStats] = useState({ followers: 0, following: 0, loaded: false });
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBlockedRef = useRef(false);
  const isMutedRef = useRef(false);

  const openProfileModal = async () => {
    if (!participant?.user_id) return;
    setShowProfileModal(true);
    if (profileStats.loaded) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', participant.user_id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', participant.user_id),
      ]);
      setProfileStats({
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        loaded: true
      });
    } catch (e) {
      console.error("Error fetching stats", e);
    }
  };

  const playNotificationSound = () => {
    if (isMutedRef.current) return;
    if (!audioRef.current) {
      audioRef.current = new Audio('/universfield-new-notification-040-493469.mp3');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`deleted_${roomId}`);
      if (stored) {
        setDeletedForMe(JSON.parse(stored));
      }
    } catch (e) {}
  }, [roomId]);

  useEffect(() => {
    if (participant?.user_id) {
      const blocked = localStorage.getItem(`blocked_${participant.user_id}`) === 'true';
      const muted = localStorage.getItem(`muted_${participant.user_id}`) === 'true';
      setIsBlocked(blocked);
      setIsMuted(muted);
      isBlockedRef.current = blocked;
      isMutedRef.current = muted;
    }
  }, [participant?.user_id]);

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
  }, [roomId, router, initialName]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseRealtime
      .channel(`room-${roomId}`, {
        config: { presence: { key: user.id } }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const othersOnline = Object.keys(state).some(id => id !== user.id);
        setIsOnline(othersOnline);
      })
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
            // Mark as read if we are in the room viewing it
            await supabase.from('chat_messages').update({ is_read: true }).eq('id', msg.id);
            
            if (!isBlockedRef.current) {
              scrollToBottom();
              playNotificationSound();
              Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
            }
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
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // 🚀 GUARANTEED REALTIME FALLBACK (For users with ISP Socket Blocks)
    // Polls securely via the HTTP Proxy every 2.5 seconds
    const pollInterval = setInterval(async () => {
      const { data: latest } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (latest) {
        setMessages(prev => {
          // If lengths differ or last message differs, update state
          if (latest.length !== prev.length || (latest.length > 0 && prev.length > 0 && latest[latest.length-1].id !== prev[prev.length-1].id)) {
            setTimeout(() => scrollToBottom(), 100);
            
            // Check if last message is from someone else
            const lastMsg = latest[latest.length-1];
            if (lastMsg && lastMsg.sender_id !== user?.id && !isBlockedRef.current) {
              playNotificationSound();
              Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
            }
            
            return latest;
          }
          return prev;
        });
      }
    }, 2500);

    try {
      Keyboard.addListener('keyboardWillShow', info => {
        setKeyboardHeight(info.keyboardHeight);
        setTimeout(() => scrollToBottom(), 50);
      });
      Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    } catch (e) { }

    return () => {
      supabaseRealtime.removeChannel(channel);
      clearInterval(pollInterval);
      try { Keyboard.removeAllListeners(); } catch (e) { }
    };
  }, [roomId, user?.id]);

  const handleClearChat = async () => {
    if (!user || messages.length === 0) return;

    try {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
      
      // 1. Delete MY messages from the database (Deletes for everyone)
      const myMessageIds = messages.filter(m => m.sender_id === user.id).map(m => m.id);
      if (myMessageIds.length > 0) {
        await supabase.from('chat_messages').delete().in('id', myMessageIds);
      }

      // 2. Hide all other messages from MY view (Local storage)
      const allCurrentIds = messages.map(m => m.id);
      const newDeleted = [...new Set([...deletedForMe, ...allCurrentIds])];
      setDeletedForMe(newDeleted);
      localStorage.setItem(`deleted_${roomId}`, JSON.stringify(newDeleted));
      
      // Update local state immediately for a snapier feel
      setMessages(prev => prev.filter(m => !allCurrentIds.includes(m.id)));
      
    } catch (e) {
      console.error("Error clearing chat:", e);
    } finally {
      setShowMenu(false);
    }
  };

  const toggleBlock = () => {
    if (!participant?.user_id) return;
    const nextState = !isBlocked;
    setIsBlocked(nextState);
    isBlockedRef.current = nextState;
    if (nextState) {
      localStorage.setItem(`blocked_${participant.user_id}`, 'true');
    } else {
      localStorage.removeItem(`blocked_${participant.user_id}`);
    }
    setShowMenu(false);
    setShowProfileModal(false);
  };

  const toggleMute = () => {
    if (!participant?.user_id) return;
    const nextState = !isMuted;
    setIsMuted(nextState);
    isMutedRef.current = nextState;
    if (nextState) {
      localStorage.setItem(`muted_${participant.user_id}`, 'true');
    } else {
      localStorage.removeItem(`muted_${participant.user_id}`);
    }
    setShowMenu(false);
    setShowProfileModal(false);
  };

  // Compress image to max 1080px / 80% quality before upload
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1080;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file); // fallback to original if compression fails
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !user) return;
    setUploadingImage(true);

    try {
      // Compress before upload
      const file = await compressImage(rawFile);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
      const { data: insertedMessage, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: user.id, content: result.publicUrl, message_type: 'image' })
        .select('*')
        .single();
        
      if (error) throw error;

      if (insertedMessage) {
        setMessages(prev => {
          if (prev.some(m => m.id === insertedMessage.id)) return prev;
          return [...prev, insertedMessage as Message];
        });

        // Push notification for image
        if (participant?.user_id) {
          const appUrl = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()) 
            ? (process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app')
            : '';
            
          fetch(`${appUrl}/api/chat/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: participant.user_id,
              senderId: user.id,
              content: '📸 Sent you a photo',
              roomId: roomId
            })
          }).catch(console.error);
        }
      }
      scrollToBottom();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    let content = newMessage.trim();
    if (replyingTo) {
      const replyPreview = replyingTo.content.length > 50 ? replyingTo.content.substring(0, 50) + '...' : replyingTo.content;
      content = `> Replying to **${replyingTo.sender_id === user.id ? 'You' : participant?.full_name || 'User'}**: "${replyPreview.replace(/\n/g, ' ')}"\n\n${content}`;
      setReplyingTo(null);
    }
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

        // Trigger Android/Web push notifications for the receiver
        if (participant?.user_id) {
          const appUrl = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()) 
            ? (process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app')
            : '';
            
          fetch(`${appUrl}/api/chat/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: participant.user_id,
              senderId: user.id,
              content: content,
              roomId: roomId
            })
          }).catch(console.error);
        }
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
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0b0f14] dark:text-white pb-28">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,153,240,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(241,245,249,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,153,240,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(to_bottom,rgba(2,6,23,0.96),rgba(9,14,20,0.96))]" />

      {/* Action Sheet */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedMessage(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-800" />
              <div className="space-y-3 pb-8">
                <button 
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                    setReplyingTo(selectedMessage);
                    setSelectedMessage(null);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }} 
                  className="flex w-full items-center justify-between rounded-[20px] bg-slate-100 p-4 font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reply
                  <Reply className="h-5 w-5 text-slate-500" />
                </button>
                <button 
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                    const newDeleted = [...deletedForMe, selectedMessage.id];
                    setDeletedForMe(newDeleted);
                    localStorage.setItem(`deleted_${roomId}`, JSON.stringify(newDeleted));
                    setSelectedMessage(null);
                  }} 
                  className="flex w-full items-center justify-between rounded-[20px] bg-slate-100 p-4 font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Delete for me
                  <Trash2 className="h-5 w-5 text-slate-500" />
                </button>
                {selectedMessage.sender_id === user?.id && (
                  <button 
                    onClick={async () => {
                      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                      
                      // 🖼️ If it's an image, also try to scrub it from storage
                      if (selectedMessage.message_type === 'image') {
                        try {
                          // Extract the storage path from the public URL
                          // Example: .../public/avatars/chat_ROOMID_USERID_TIMESTAMP.png
                          const pathSegments = selectedMessage.content.split('/public/avatars/');
                          if (pathSegments.length > 1) {
                            const storagePath = decodeURIComponent(pathSegments[1]);
                            await supabase.storage.from('avatars').remove([storagePath]);
                          }
                        } catch (e) {
                          console.error("Failed to scrub storage file:", e);
                        }
                      }

                      // Delete from database
                      await supabase.from('chat_messages').delete().eq('id', selectedMessage.id);
                      
                      // Alert local state
                      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
                      setSelectedMessage(null);
                    }} 
                    className="flex w-full items-center justify-between rounded-[20px] bg-red-50 p-4 font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40"
                  >
                    Delete for everyone
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                )}
                <button 
                  onClick={() => setSelectedMessage(null)} 
                  className="mt-2 w-full p-4 font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && participant && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-[2px]"
              onClick={() => setShowProfileModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-white dark:bg-slate-900 rounded-t-[28px] px-6 pt-3 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
            >
              <div className="mx-auto mb-6 h-1.5 w-10 rounded-full bg-slate-300/80 dark:bg-slate-700" />
              
              <div className="flex flex-col items-center pb-6">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 mb-4 shadow-sm relative">
                  {participant.avatar_url ? (
                    <Image src={participant.avatar_url} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400">
                      {participant.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {participant.full_name}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                  @{participant.username || 'user'}
                </p>

                <div className="flex w-full max-w-xs justify-center gap-8 border-y border-slate-100 dark:border-slate-800/50 py-4 mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {profileStats.followers}
                    </span>
                    <span className="text-xs font-medium text-slate-500">Followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {profileStats.following}
                    </span>
                    <span className="text-xs font-medium text-slate-500">Following</span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      router.push(`/user/${participant.username || participant.user_id}`);
                    }}
                    className="w-full rounded-2xl bg-sky-500 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-600 active:scale-95"
                  >
                    View Full Profile
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={toggleMute}
                      className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition-colors active:scale-95 ${
                        isMuted
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isMuted ? 'Unmute User' : 'Mute User'}
                    </button>
                    <button
                      onClick={toggleBlock}
                      className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition-colors active:scale-95 ${
                        isBlocked
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                      }`}
                    >
                      {isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="fixed top-0 inset-x-0 z-40 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 lg:px-8">
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
              onClick={openProfileModal}
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
                  <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] sm:inline-flex transition-colors ${
                    isOnline 
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  Tap for more info
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={async () => {
                if (!user || !participant) return;
                Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

                // Request mic permission immediately while the user gesture is still active.
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                  // Immediately release so the call page can take over the mic.
                  stream.getTracks().forEach(t => t.stop());
                } catch (err) {
                  console.warn('[Call] Mic permission denied before call:', err);
                  // Continue anyway — the call screen will ask again if needed.
                }
                
                // Unique call room per conversation session
                const callRoom = `${roomId}_${Date.now()}`;
                // Outgoing screen should show the person you are calling.
                const callUrl = `/call/${callRoom}?caller=${encodeURIComponent(participant.full_name || 'Scholar')}&avatar=${encodeURIComponent(participant.avatar_url || '')}&mode=outgoing`;
                
                // Navigate self to call page (outgoing)
                router.push(callUrl);

                // Incoming URL for recipient (mode=incoming)
                const incomingUrl = `/call/${callRoom}?caller=${encodeURIComponent(user.user_metadata?.full_name || 'Scholar')}&avatar=${encodeURIComponent(user.user_metadata?.avatar_url || '')}&mode=incoming`;

                // Send push notification to recipient
                const appUrl = (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.())
                  ? (process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app')
                  : '';
                fetch(`${appUrl}/api/chat/call-notify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    receiverId: participant.user_id,
                    senderId: user.id,
                    callerName: user.user_metadata?.full_name || 'Scholar',
                    callerAvatar: user.user_metadata?.avatar_url || '',
                    callRoom,
                    incomingUrl,
                  })
                }).catch(console.error);

                // Store just the call room ID cleanly
                await supabase.from('chat_messages').insert({
                  room_id: roomId,
                  sender_id: user.id,
                  content: `__CALL__:${callRoom}`,
                  message_type: 'text'
                });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white active:scale-95"
              aria-label="Voice Call"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white sm:flex">
              <Video className="h-5 w-5" />
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      <button onClick={handleClearChat} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                        <Trash2 className="h-4 w-4" /> Clear Chat
                      </button>
                      <button onClick={toggleMute} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                        <VolumeX className={`h-4 w-4 ${isMuted ? 'text-emerald-500' : ''}`} /> {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button onClick={toggleBlock} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
                        <Ban className="h-4 w-4" /> {isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 pt-[calc(env(safe-area-inset-top)+100px)]">
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
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.filter(m => !deletedForMe.includes(m.id) && (!isBlocked || m.sender_id === user?.id)).map((msg, index, arr) => {
              const isMe = msg.sender_id === user?.id;
              const prevMsg = arr[index - 1];
              const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

              const nextMsg = arr[index + 1];
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
                      onContextMenu={(e) => {
                        e.preventDefault();
                        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                        setSelectedMessage(msg);
                      }}
                      onTouchStart={() => {
                        touchTimer.current = setTimeout(() => {
                          Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                          setSelectedMessage(msg);
                        }, 500);
                      }}
                      onTouchEnd={() => {
                        if (touchTimer.current) clearTimeout(touchTimer.current);
                      }}
                      onTouchMove={() => {
                        if (touchTimer.current) clearTimeout(touchTimer.current);
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={{ left: 0, right: 0.3 }}
                      onDragEnd={(_e, info) => {
                        if (info.offset.x > 50) {
                          Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                          setReplyingTo(msg);
                          setTimeout(() => inputRef.current?.focus(), 100);
                        }
                      }}
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
                      <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                        {msg.message_type === 'image' ? (
                          <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-xl overflow-hidden mb-1 border border-black/10 dark:border-white/10">
                            <Image src={msg.content} alt="Chat Attachment" fill className="object-cover" unoptimized />
                          </div>
                        ) : (msg.content.startsWith('__CALL__:') || msg.content.startsWith('__CALL_ENDED__:') || msg.content.startsWith('__CALL_DECLINED__:')) ? (
                          // Render voice call card
                          <div className="flex flex-col items-center gap-3 px-1 py-2 min-w-[180px]">
                            {(() => {
                              const isEnded = msg.content.startsWith('__CALL_ENDED__:');
                              const isDeclined = msg.content.startsWith('__CALL_DECLINED__:');
                              const isActive = msg.content.startsWith('__CALL__:');
                              const callRoomId = msg.content
                                .replace('__CALL__:', '')
                                .replace('__CALL_ENDED__:', '')
                                .replace('__CALL_DECLINED__:', '');
                              return (
                                <>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isMe ? 'bg-blue-400/30' : 'bg-emerald-500/20'}`}>
                              <Phone className={`h-6 w-6 ${isMe ? 'text-blue-100' : 'text-emerald-400'}`} />
                            </div>
                            <div className="text-center">
                              <p className={`text-sm font-bold ${isMe ? 'text-white' : 'text-slate-800 dark:text-white'}`}>Voice Call</p>
                              <p className={`text-[11px] mt-0.5 ${isMe ? 'text-blue-100/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                {isDeclined ? 'Call declined' : isEnded ? 'Call ended' : (isMe ? 'You started a call' : 'Incoming call')}
                              </p>
                            </div>
                            <button
                              disabled={!isActive}
                              onClick={() => {
                                if (!isActive) return;
                                const callerQ = encodeURIComponent(participant?.full_name || 'Scholar');
                                const avatarQ = encodeURIComponent(participant?.avatar_url || '');
                                const modeQ = isMe ? 'outgoing' : 'incoming';
                                router.push(`/call/${callRoomId}?caller=${callerQ}&avatar=${avatarQ}&mode=${modeQ}`);
                              }}
                              className={`w-full rounded-xl py-2 text-sm font-bold transition-all active:scale-95 ${
                                !isActive
                                  ? 'bg-slate-400/20 text-slate-500 cursor-not-allowed dark:bg-slate-700/40 dark:text-slate-300'
                                  : isMe
                                  ? 'bg-white/20 text-white hover:bg-white/30'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                              }`}
                            >
                              {!isActive ? 'Call Finished' : (isMe ? 'Open Call' : 'Join Call')}
                            </button>
                                </>
                              );
                            })()}
                          </div>
                        ) : msg.content.startsWith('> Replying to **') ? (
                          <>
                            <div className={`mb-2 rounded-xl border-l-4 p-2 text-sm ${isMe ? 'border-blue-200 bg-blue-500/20 text-blue-50' : 'border-blue-500 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                              <span className="font-bold opacity-80">{msg.content.split('**: "')[0].replace('> Replying to **', '')}</span>
                              <p className="mt-0.5 truncate opacity-90">{msg.content.split('**: "')[1]?.split('"\n\n')[0]}</p>
                            </div>
                            <p>{msg.content.split('"\n\n').slice(1).join('"\n\n')}</p>
                          </>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>

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
        {isBlocked ? (
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center rounded-[30px] border border-white/70 bg-white/90 px-3 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/90">
            <span className="text-[15px] font-semibold text-slate-600 dark:text-slate-400">
              You blocked this user. Unblock to send messages.
            </span>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-[30px] border border-white/70 bg-white/90 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/90">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={2.2} />}
            </button>

            <div className="flex-1 rounded-[24px] border border-slate-200 bg-slate-50/90 min-h-[48px] flex flex-col justify-center shadow-inner dark:border-slate-800 dark:bg-slate-900/80 overflow-hidden">
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative flex items-center justify-between border-b border-slate-200/60 bg-slate-100/50 px-4 py-2 dark:border-slate-800/60 dark:bg-slate-800/50"
                  >
                    <div className="flex flex-1 flex-col overflow-hidden border-l-4 border-blue-500 pl-3">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {replyingTo.sender_id === user?.id ? 'You' : participant?.full_name || 'User'}
                      </span>
                      <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                        {replyingTo.content.replace(/\n/g, ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
        )}
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