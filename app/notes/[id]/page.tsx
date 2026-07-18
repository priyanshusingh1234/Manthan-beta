import React, { Suspense } from 'react';
import supabaseAdmin from '@/lib/supabaseAdmin';
import NotesClient from './NotesClient';
import { APP_URL } from '@/lib/appUrl';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<any> {
    const { data: post } = await supabaseAdmin
        .from('posts')
        .select('content, document_url, author_id')
        .eq('id', params.id)
        .maybeSingle();

    if (!post || !post.document_url) return { title: 'Note Not Found | Dheeyudha' };

    let authorName = 'A Scholar';
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, username')
        .eq('id', post.author_id)
        .maybeSingle();

    if (profile) {
        authorName = profile.full_name || `@${profile.username}`;
    }

    const title = `📚 ${authorName}'s Note on Dheeyudha`;
    const description = post.content
            ? post.content.slice(0, 160)
            : 'Check out this note on Dheeyudha.';

    const finalImageUrl = `${APP_URL}/og-social.png`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `${APP_URL}/notes/${params.id}`,
            images: [{ url: finalImageUrl, width: 1200, height: 630, alt: 'Dheeyudha Note' }],
            siteName: 'Dheeyudha',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [finalImageUrl],
        },
    };
}

export default async function NotePage({ params }: Props) {
    const { data: post, error } = await supabaseAdmin
        .from('posts')
        .select(`
            *,
            post_likes ( user_id )
        `)
        .eq('id', params.id)
        .maybeSingle();

    if (error) console.error("NotePage fetch error:", error);

    if (!post || !post.document_url) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Note Not Found</h1>
                    <p className="text-slate-500 mb-6">This note doesn't exist or was removed.</p>
                    <a href="/feed" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full transition-all">
                        Back to Feed
                    </a>
                </div>
            </div>
        );
    }

    // Fetch author profile separately to avoid FK join errors
    let authorData = null;
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics')
        .eq('id', post.author_id)
        .maybeSingle();

    if (profile) {
        authorData = {
            id: profile.id,
            name: profile.full_name || 'Anonymous',
            username: profile.username,
            avatar_url: profile.avatar_url,
            school: profile.school,
            isTeacher: profile.is_teacher,
            totalPoints: profile.total_points,
            is_ghost: profile.is_ghost,
            cosmetics: profile.cosmetics
        };
    }

    const formattedPost = {
        ...post,
        author: authorData,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.comments_count || 0
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Suspense fallback={<div className="h-screen w-full animate-pulse bg-slate-100 dark:bg-slate-900" />}>
                <NotesClient post={formattedPost} />
            </Suspense>
        </div>
    );
}
