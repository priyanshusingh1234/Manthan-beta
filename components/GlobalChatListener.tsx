'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface NewMessageInfo {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function GlobalChatListener() {
  const pathname = usePathname();
  const router = useRouter();
  const userRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheck = useRef<string>(new Date().toISOString());
  
  const [toastMessage, setToastMessage] = React.useState<any>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/universfield-new-notification-040-493469.mp3');
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        userRef.current = user;
        // set lastCheck a little bit in the past just to be safe
        const d = new Date();
        d.setSeconds(d.getSeconds() - 2);
        lastCheck.current = d.toISOString();
      }
    });

    const pollInterval = setInterval(async () => {
      if (!userRef.current) return;
      
      const userId = userRef.current.id;
      const currentCheck = new Date().toISOString();

      try {
        // Find any message created after our last check
        const { data: newMsgs } = await supabase
          .from('chat_messages')
          .select('id, room_id, sender_id, content, created_at')
          .gt('created_at', lastCheck.current)
          .neq('sender_id', userId)
          .order('created_at', { ascending: true });

        if (newMsgs && newMsgs.length > 0) {
          for (const msg of newMsgs) {
            // Check if we are currently inside that specific room
            const isCurrentlyInRoom = pathname === `/chat/${msg.room_id}`;

            if (!isCurrentlyInRoom) {
              // Play Sound
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }

              // Fetch sender profile to show toast
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', msg.sender_id)
                .single();

              // Show local in-app Toast banner
              setToastMessage({
                ...msg,
                sender_name: profile?.full_name || 'Scholar',
                sender_avatar: profile?.avatar_url
              });

              // Auto dismiss toast after 4s
              setTimeout(() => setToastMessage(null), 4000);
            }
          }
        }
        
        lastCheck.current = currentCheck;
      } catch (err) {
        // Silent fail
      }
    }, 4000); // 4 second global poll

    return () => clearInterval(pollInterval);
  }, [pathname]);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 sm:top-6 left-0 right-0 z-[100] mx-auto w-[90%] max-w-sm"
        >
          <div 
            onClick={() => {
              setToastMessage(null);
              router.push(`/chat/${toastMessage.room_id}`);
            }}
            className="flex items-center gap-3 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gradient-to-tr from-blue-500 to-cyan-400 relative">
              {toastMessage.sender_avatar ? (
                <Image src={toastMessage.sender_avatar} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm">
                  {toastMessage.sender_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {toastMessage.sender_name}
              </h4>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {toastMessage.content}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
