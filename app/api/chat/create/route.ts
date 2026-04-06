import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { targetUserId, currentUserId } = await req.json();

        if (!targetUserId || !currentUserId) {
            return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
        }

        // 1. Check if room already exists
        const { data: myParticipants, error: myParticipantsError } = await supabaseAdmin
            .from('chat_participants')
            .select('room_id')
            .eq('user_id', currentUserId);

        if (myParticipantsError) throw myParticipantsError;

        const myRoomIds = myParticipants?.map((p: any) => p.room_id) || [];

        if (myRoomIds.length > 0) {
            const { data: commonRooms } = await supabaseAdmin
                .from('chat_participants')
                .select('room_id')
                .in('room_id', myRoomIds)
                .eq('user_id', targetUserId);

            if (commonRooms && commonRooms.length > 0) {
                for (const cr of commonRooms) {
                    const { count } = await supabaseAdmin
                        .from('chat_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('room_id', cr.room_id);

                    if (count === 2) {
                        return NextResponse.json({ roomId: cr.room_id });
                    }
                }
            }
        }

        // 2. Room doesn't exist, create it (bypassing RLS)
        const roomId = crypto.randomUUID();
        const { data: newRoom, error: roomError } = await supabaseAdmin
            .from('chat_rooms')
            .insert({ id: roomId, is_group: false, created_by: currentUserId })
            .select('id')
            .single();

        if (roomError) throw roomError;

        // 3. Add Participants
        const { error: insertError } = await supabaseAdmin
            .from('chat_participants')
            .insert([
                { id: crypto.randomUUID(), room_id: newRoom.id, user_id: currentUserId },
                { id: crypto.randomUUID(), room_id: newRoom.id, user_id: targetUserId }
            ]);

        if (insertError) throw insertError;

        return NextResponse.json({ roomId: newRoom.id });
    } catch (err: any) {
        console.error('[Create Chat Room Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
