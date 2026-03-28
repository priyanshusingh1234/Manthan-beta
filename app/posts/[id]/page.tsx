import React, { Suspense } from 'react';
import supabaseAdmin from '@/lib/supabaseAdmin';
import SinglePostClient from './SinglePostClient';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<any> {
    const { data: post } = await supabaseAdmin
        .from('posts')
        .select('content, image_url, author_id')
        .eq('id', params.id)
        .single();

    if (!post) return { title: 'Post Not Found | Dheeyudha' };

    let authorName = 'A Scholar';
    if (post.author_id) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, username')
            .eq('id', post.author_id)
            .maybeSingle();
        if (profile) authorName = profile.full_name || `@${profile.username}`;
    }

    const title = `${authorName}'s Post on Dheeyudha`;
    const description = post.content ? post.content.slice(0, 160) : 'Check out this discussion on Dheeyudha.';
    
    // Ensure image URL is absolute
    let finalImageUrl = 'https://dheeyudhha-pi.vercel.app/og-social.png';
    if (post.image_url) {
        finalImageUrl = post.image_url.startsWith('http') ? post.image_url : `https://dheeyudhha-pi.vercel.app${post.image_url}`;
    }

    return {
        title: `${title} | Brain Battle`,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: finalImageUrl,
                    width: 1200,
                    height: 630,
                }
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [finalImageUrl],
        }
    };
}

export default function SinglePostPage({ params }: Props) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 animate-pulse">Loading discussion...</div>}>
            <SinglePostClient postId={params.id} />
        </Suspense>
    );
}
