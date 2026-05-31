import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.email || !adminEmails.includes(user.email)) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const postId = params.id;
        if (!postId) return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });

        // Fetch current content
        const { data: post, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('content')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        let newContent = post.content || '';
        const body = await req.json();
        const action = body.action || 'pin'; // 'pin' or 'unpin'

        if (action === 'pin') {
            // Unpin ALL currently pinned posts first to maintain exclusivity
            const { data: existingPinned } = await supabaseAdmin
                .from('posts')
                .select('id, content')
                .ilike('content', '[PINNED]%')
                .limit(5);
            
            if (existingPinned && existingPinned.length > 0) {
                for (const old of existingPinned) {
                    if (old.id === postId) continue;
                    let clean = old.content || '';
                    while (clean.startsWith('[PINNED]')) {
                        clean = clean.substring(8).trim();
                    }
                    await supabaseAdmin.from('posts').update({ content: clean }).eq('id', old.id);
                }
            }

            if (!newContent.startsWith('[PINNED]')) {
                newContent = `[PINNED] ${newContent}`;
            }
        } else {
            if (newContent.startsWith('[PINNED]')) {
                newContent = newContent.substring(8).trim();
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from('posts')
            .update({ content: newContent })
            .eq('id', postId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: action === 'pin' ? 'Post Pinned Globally' : 'Post Unpinned' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to update pin status' }, { status: 500 });
    }
}
