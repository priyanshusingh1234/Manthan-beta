'use client';

import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Check, CheckCheck, MessageCirclePlus } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChatRailRoom {
  id: string;
  participant: {
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

export interface ChatRailUser {
  id: string;
  name: string;
  avatar: string | null;
  username: string;
}

interface ChatRailProps {
  rooms: ChatRailRoom[];
  following: ChatRailUser[];
  loading: boolean;
  onOpenRoom: (roomId: string) => void;
  onStartChat: (userId: string, name?: string) => void;
  activeRoomId?: string;
  currentUserId?: string;
}

function formatRelativeTime(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: false })
    .replace('about ', '')
    .replace('less than a minute', 'now');
}

export default function ChatRail({
  rooms,
  following,
  loading,
  onOpenRoom,
  onStartChat,
  activeRoomId,
  currentUserId,
}: ChatRailProps) {
  return (
    <aside className="rounded-[28px] border border-slate-200/70 dark:border-slate-800/70 bg-white/85 dark:bg-slate-950/75 backdrop-blur-2xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-black tracking-[0.28em] uppercase text-slate-500 dark:text-slate-400">Direct Messages</p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Pick a chat</h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Jump between active conversations or start a new one.
        </p>
      </div>

      <div className="max-h-[calc(100vh-9.75rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <section className="p-4 border-b border-slate-100 dark:border-slate-900/70">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black tracking-[0.24em] uppercase text-slate-500 dark:text-slate-400">Recent Chats</h3>
            {rooms.length > 0 && (
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{rooms.length}</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-6 text-center">
              <MessageCirclePlus className="mx-auto w-8 h-8 text-blue-500" />
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No active chats yet</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Start a conversation from the people list below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => {
                const isUnread = room.last_message && room.last_message.sender_id !== currentUserId && !room.last_message.is_read;
                const isActive = activeRoomId === room.id;

                return (
                  <motion.button
                    key={room.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onOpenRoom(room.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-3xl text-left transition-all border ${isActive
                        ? 'bg-blue-50/90 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                        : 'bg-slate-50/70 dark:bg-slate-900/70 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
                        {room.participant.avatar_url ? (
                          <Image src={room.participant.avatar_url} alt={room.participant.full_name} fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-black text-slate-500 dark:text-slate-400">
                            {room.participant.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 bg-emerald-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-[14px] font-black text-slate-900 dark:text-white">
                          {room.participant.full_name}
                        </h4>
                        {room.last_message && (
                          <span className={`shrink-0 text-[11px] font-semibold ${isUnread ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {formatRelativeTime(room.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className={`truncate text-[13px] ${isUnread ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                          {room.last_message ? room.last_message.content : 'Break the ice!'}
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                          {room.last_message && room.last_message.sender_id === currentUserId && (
                            room.last_message.is_read ? (
                              <CheckCheck className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                            ) : (
                              <Check className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={2.5} />
                            )
                          )}
                          <ArrowRight className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`} />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        <section className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black tracking-[0.24em] uppercase text-slate-500 dark:text-slate-400">Start Chat</h3>
            {following.length > 0 && (
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{following.length}</span>
            )}
          </div>

          {following.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Follow people to start chatting faster.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {following.map((person) => (
                <button
                  key={person.id}
                  onClick={() => onStartChat(person.id, person.name)}
                  className="group flex flex-col items-center gap-2 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md"
                >
                  <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/20">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white dark:bg-slate-950 border border-white dark:border-slate-900">
                      {person.avatar ? (
                        <Image src={person.avatar} alt={person.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-black text-slate-700 dark:text-slate-300">
                          {person.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 w-full">
                    <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{person.name}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">@{person.username || 'scholar'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
