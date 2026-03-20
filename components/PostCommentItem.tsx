"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TeacherBadge = dynamic(() => import('@/ticks/teacher'), { ssr: false });

function getUsername(user: any): string | null {
    return user?.username || user?.user_metadata?.username || user?.profile?.username || null;
}

function isTeacherUser(user: any): boolean {
    return Boolean(user?.isTeacher || user?.is_teacher);
}

function getProfileUrl(user: any): string {
    const username = getUsername(user);
    if (!username) return '#';
    return isTeacherUser(user) ? `/teacher/${username}` : `/user/${username}`;
}

export default function PostCommentItem({
    comment,
    onReply,
}: {
    comment: any;
    onReply: (payload: { userId: string; username: string }) => void;
}) {
    const username = getUsername(comment?.author) || `user${String(comment?.author_id || '').slice(0, 5)}`;
    const profileUrl = getProfileUrl(comment?.author);

    return (
        <div className="flex gap-3 items-start">
            <Link href={profileUrl}>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                    {comment?.author?.avatar_url ? (
                        <Image
                            src={comment.author.avatar_url}
                            alt="avatar"
                            width={36}
                            height={36}
                            className="object-cover w-9 h-9"
                        />
                    ) : (
                        <User className="w-5 h-5 m-auto text-slate-400" />
                    )}
                </div>
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Link
                        href={profileUrl}
                        className="font-bold text-[13px] sm:text-sm truncate max-w-[120px] text-slate-900 dark:text-slate-100"
                    >
                        {comment?.author?.name || username}
                    </Link>
                    {isTeacherUser(comment?.author) && <TeacherBadge />}
                    <span className="text-xs text-slate-400 ml-2">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl px-4 py-2 mt-1">
                    <span className="text-sm text-slate-700 dark:text-slate-200">{comment.content}</span>
                </div>

                <button
                    className="mt-1 text-xs text-indigo-500 font-bold hover:underline"
                    onClick={() => onReply({ userId: comment.author?.id || comment.author_id, username })}
                >
                    Reply
                </button>
            </div>
        </div>
    );
}
