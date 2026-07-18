import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const postId = url.searchParams.get('postId');

        if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('note_annotations')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json(data || { annotations: {}, last_read_page: 1 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { postId, annotations, last_read_page } = await req.json();

        if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('note_annotations')
            .upsert({
                post_id: postId,
                user_id: user.id,
                annotations: annotations || {},
                last_read_page: last_read_page || 1,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,post_id'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
