import React, { Suspense } from 'react';
import supabaseAdmin from '@/lib/supabaseAdmin';
import SinglePostClient from './SinglePostClient';
import { APP_URL } from '@/lib/appUrl';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<any> {
    const { data: post } = await supabaseAdmin
        .from('posts')
        .select('content, image_url, video_url, video_thumbnail, author_id')
        .eq('id', params.id)
        .maybeSingle();

    if (!post) return { title: 'Post Not Found | Dheeyudha' };

    const isVideo = !!post.video_url;

    let authorName = 'A Scholar';
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, username')
        .eq('id', post.author_id)
        .maybeSingle();

    if (profile) {
        authorName = profile.full_name || `@${profile.username}`;
    }

    const title = isVideo
        ? `🎬 ${authorName}'s Clip on Dheeyudha`
        : `${authorName}'s Post on Dheeyudha`;

    const description = isVideo
        ? (post.content?.trim()
            ? `${post.content.slice(0, 130)} — Watch this 30s clip on Dheeyudha.`
            : `Watch ${authorName}'s 30-second clip on Dheeyudha — the academic social network.`)
        : (post.content
            ? post.content.slice(0, 160)
            : 'Check out this discussion on Dheeyudha.');

    // Best image for OG: video thumbnail > post image > default social card
    let finalImageUrl = `${APP_URL}/og-social.png`;
    if (isVideo && post.video_thumbnail) {
        finalImageUrl = post.video_thumbnail.startsWith('http')
            ? post.video_thumbnail
            : `${APP_URL}${post.video_thumbnail}`;
    } else if (post.image_url) {
        finalImageUrl = post.image_url.startsWith('http')
            ? post.image_url
            : `${APP_URL}${post.image_url}`;
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
                    alt: title,
                }
            ],
            videos: isVideo ? [
                {
                    url: post.video_url,
                    secureUrl: post.video_url,
                    width: 720,
                    height: 1280,
                    type: 'video/mp4',
                }
            ] : undefined,
            type: isVideo ? 'video.movie' : 'article',
            siteName: 'Dheeyudha',
        },
        twitter: {
            card: 'player', // Twitter Player card is better for video
            title: title,
            description: description,
            images: [finalImageUrl],
            //@ts-ignore
            player: isVideo ? post.video_url : undefined,
            stream: isVideo ? post.video_url : undefined,
        },
        other: isVideo ? {
            'og:video:url': post.video_url,
            'og:video:secure_url': post.video_url,
            'og:video:type': 'video/mp4',
            'og:video:width': '720',
            'og:video:height': '1280',
            'fb:app_id': 'your_fb_app_id', // Optional but helps with Meta crawlers
        } : {}
    };
}

export default function SinglePostPage({ params }: Props) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 animate-pulse">Loading…</div>}>
            <SinglePostClient postId={params.id} />
        </Suspense>
    );
}
