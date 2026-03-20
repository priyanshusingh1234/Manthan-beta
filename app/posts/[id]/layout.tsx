import supabaseAdmin from '@/lib/supabaseAdmin';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    // Fetch post data for SEO
    const { data, error } = await supabaseAdmin.from('posts').select('*').eq('id', params.id).single();
    if (!data) return { title: 'Post | Dheeyudha' };
    const title = data.title || (data.content ? data.content.slice(0, 60) : 'Post | Dheeyudha');
    const image = data.image_url || '/og-default.png';
    const url = `https://manthan-beta-c975.vercel.app/posts/${params.id}`;
    return {
        title,
        openGraph: {
            title,
            images: [{ url: image }],
            url,
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            images: [image],
        },
    };
}

// This layout just renders children, but enables generateMetadata for the post page
export default function PostLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
