'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
    Heart, MessageCircle, Share2, Send, Clock, User, 
    CheckCircle2, ArrowLeft, ChevronDown, ChevronUp, Reply,
    MoreVertical, Trash2
} from 'lucide-react';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Comment {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
    author: {
        name: string;
        avatar_url: string | null;
        isTeacher: boolean;
    };
    replies: Comment[];
    showReplies?: boolean;
}

export default function SinglePostPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    // Comment Input
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

    const [showMenu, setShowMenu] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    const handleDeletePost = async () => {
        if (post?.author?.id !== currentUserId || deletingPost) return;
        const confirmed = window.confirm('Delete this post? Image and comments will also be deleted.');
        if (!confirmed) return;

        setDeletingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                router.push('/posts');
            } else {
                alert('Failed to delete post');
            }
        } finally {
            setDeletingPost(false);
        }
    };

    const fetchPostData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = session ? { 'Authorization': `Bearer ${session.access_token}` } : {};

            // Fetch post
            const postRes = await fetch(`/api/posts/${postId}`, { headers });
            if (!postRes.ok) throw new Error("Post not found");
            const postData = await postRes.json();
            setPost(postData);

            // Fetch comments
            const commRes = await fetch(`/api/posts/${postId}/comments`);
            const commData = await commRes.json();
            if (commRes.ok) {
                // Threading logic (Current system uses @mentions, we'll try to visually group them better)
                // If we don't have parent_id yet, we use the @mention heuristic but with better layout
                setComments(threadComments(commData));
            }
        } catch (err) {
            console.error(err);
            // router.push('/feed');
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUserId(session?.user?.id || null);
        });
        fetchPostData();
    }, [fetchPostData]);

    const threadComments = (raw: any[]): Comment[] => {
        // Since we don't have parent_id in DB yet, we'll order by time (reverse for processing)
        // and use the @mention logic to visually group them
        const chronologically = [...raw].reverse();
        const items: Comment[] = chronologically.map(c => ({ ...c, replies: [] }));
        const roots: Comment[] = [];
        
        items.forEach((c, idx) => {
            let parentFound = false;
            // Simple mention-based threading logic
            if (c.content.startsWith('@')) {
                const match = c.content.match(/^@([^ ]+)/);
                if (match) {
                    const mentionedName = match[1];
                    // Look backwards for the most recent comment by the mentioned user
                    for (let i = idx - 1; i >= 0; i--) {
                        const possibleParent = items[i];
                        if (possibleParent.author?.name === mentionedName) {
                            possibleParent.replies.push(c);
                            parentFound = true;
                            break;
                        }
                    }
                }
            }
            if (!parentFound) roots.push(c);
        });
        
        // Return roots in descending order (newest first)
        return roots.reverse();
    };

    const handleLike = async () => {
        if (!currentUserId || !post) return;
        
        const previousLiked = post.is_liked_by_me;
        const previousCount = post.likes_count;

        setPost({
            ...post,
            is_liked_by_me: !previousLiked,
            likes_count: previousLiked ? previousCount - 1 : previousCount + 1
        });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`/api/posts/${post.id}/like`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${session?.access_token}` } 
            });
        } catch (err) {
            setPost({ ...post, is_liked_by_me: previousLiked, likes_count: previousCount });
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ 
                    content: newComment.trim(),
                    replying_to_user_id: replyingTo?.author_id || null 
                })
            });

            if (res.ok) {
                const inserted = await res.json();
                setComments([{ ...inserted, replies: [] }, ...comments]);
                setNewComment("");
                setReplyingTo(null);
                setPost({ ...post, comments_count: (post.comments_count || 0) + 1 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="font-bold animate-pulse">Loading discussion...</p>
                </div>
            </div>
        );
    }

    if (!post) return <div className="p-20 text-center font-bold text-slate-500">Post not found.</div>;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-black text-lg tracking-tight">Discussion</h1>
            </div>

            <main className="max-w-3xl mx-auto pt-6 px-4">
                {/* Main Post Card - Prominent View */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href={`/profile/${post.author?.username || post.author?.id}`}>
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500/20 relative">
                                {post.author?.avatar_url ? (
                                    <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                                ) : (
                                    <User className="w-6 h-6 absolute inset-0 m-auto text-slate-400" />
                                )}
                            </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${post.author?.username || post.author?.id}`} className="font-black text-[17px] hover:text-indigo-600 transition-colors block leading-tight">
                                {post.author?.name}
                                {post.author?.isTeacher && (
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500 inline ml-1.5" />
                                )}
                            </Link>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })} • {post.author?.school || 'Open Faction'}
                            </p>
                        </div>
                        {currentUserId === post.author?.id && (
                             <div className="relative">
                                 <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                     <MoreVertical className="w-5 h-5" />
                                 </button>
                                 {showMenu && (
                                     <div className="absolute right-0 top-10 w-40 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1">
                                         <button 
                                             onClick={handleDeletePost}
                                             disabled={deletingPost}
                                             className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-black flex items-center gap-2"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                             {deletingPost ? 'Deleting...' : 'Delete Post'}
                                         </button>
                                     </div>
                                 )}
                             </div>
                        )}
                    </div>

                    <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed mb-6 whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {post.image_url && (
                        <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-6 group">
                            <img 
                                src={post.image_url} 
                                alt="Post content" 
                                className="w-full max-h-[600px] object-contain group-hover:scale-[1.01] transition-transform duration-700" 
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-8 py-4 border-y border-slate-100 dark:border-slate-800/60">
                        <button onClick={handleLike} className={`flex items-center gap-2 font-black text-sm transition-all active:scale-90 ${post.is_liked_by_me ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}>
                            <Heart className={`w-6 h-6 ${post.is_liked_by_me ? 'fill-current' : ''}`} />
                            {post.likes_count}
                        </button>
                        <div className="flex items-center gap-2 text-slate-500 font-black text-sm">
                            <MessageCircle className="w-6 h-6" />
                            {post.comments_count}
                        </div>
                        <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-black text-sm">
                            <Share2 className="w-6 h-6" />
                            Share
                        </button>
                    </div>
                </div>

                {/* Comments Section - YouTube Style */}
                <div className="pt-2">
                    <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                        Discussion <span className="text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">{post.comments_count}</span>
                    </h3>

                    <form onSubmit={handleCommentSubmit} className="mb-8 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex-shrink-0 flex items-center justify-center font-black text-indigo-600 text-sm">
                            ME
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="relative">
                                {replyingTo && (
                                    <div className="absolute -top-7 left-0 right-0 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] sm:text-xs px-3 py-1 font-bold rounded-t-xl flex items-center justify-between border-t border-x border-indigo-100 dark:border-indigo-800">
                                        <span>Replying to {replyingTo.author.name}</span>
                                        <button type="button" onClick={() => { setReplyingTo(null); setNewComment(""); }}>Cancel</button>
                                    </div>
                                )}
                                <textarea
                                    placeholder="Add to the conversation..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className={`w-full bg-slate-50/50 dark:bg-slate-900/50 border ${replyingTo ? 'border-indigo-500 rounded-b-2xl' : 'border-slate-100 dark:border-slate-800 rounded-2xl'} p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none min-h-[100px]`}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-8 pb-32">
                        {comments.length === 0 ? (
                            <div className="text-center py-10">
                                <MessageCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400 font-bold">No comments yet. Start the debate!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <CommentItem 
                                    key={comment.id} 
                                    comment={comment} 
                                    onReply={(c) => {
                                        setReplyingTo(c);
                                        setNewComment(`@${c.author.name} `);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function CommentItem({ comment, onReply, isReply = false }: { comment: Comment, onReply: (c: Comment) => void, isReply?: boolean }) {
    const isTeacher = comment.author.isTeacher;
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

    return (
        <div className={`flex gap-2.5 sm:gap-4 ${isReply ? 'mt-3 sm:mt-4' : 'mt-6 sm:mt-8 first:mt-0'}`}>
            {/* Avatar - Never Shrink */}
            <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative flex-shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm`}>
                {comment.author.avatar_url ? (
                    <Image src={comment.author.avatar_url} alt="avatar" fill className="object-cover" />
                ) : (
                    <User className="w-full h-full p-2 text-slate-400" />
                )}
            </div>
            
            {/* Content Area - Ensure it doesn't overlap */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`font-black text-[13px] sm:text-sm truncate max-w-[150px] ${isTeacher ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {comment.author.name}
                    </span>
                    {isTeacher && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{timeAgo}</span>
                </div>
                
                {/* Bubble Style for better containment */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                   <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                       {comment.content.startsWith('@') ? (
                           <>
                               <span className="text-indigo-500 font-bold mr-1">{comment.content.split(' ')[0]}</span>
                               {comment.content.split(' ').slice(1).join(' ')}
                           </>
                       ) : (
                           comment.content
                       )}
                   </p>
                </div>

                <div className="flex items-center gap-6 mt-2 ml-1">
                    <button 
                        onClick={() => onReply(comment)}
                        className="text-[10px] sm:text-[11px] font-black text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1.5 active:scale-95"
                    >
                        <Reply className="w-3 h-3" /> Reply
                    </button>
                </div>

                {/* Recursive Replies - Limit nesting depth on mobile */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 border-l-2 border-slate-100 dark:border-slate-800/60 pl-3 sm:pl-6 space-y-4">
                         {comment.replies.map(r => <CommentItem key={r.id} comment={r} onReply={onReply} isReply={true} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
