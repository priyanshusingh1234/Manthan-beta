import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Missing authorization" }, { status: 401 });

        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { eventId, status } = await req.json();

        if (!eventId || !['in', 'out'].includes(status)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Upsert RSVP
        const { error: upsertError } = await supabaseAdmin
            .from('event_rsvps')
            .upsert({
                user_id: user.id,
                event_id: eventId,
                status: status,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,event_id'
            });

        if (upsertError) {
            throw upsertError;
        }

        return NextResponse.json({ success: true, status });

    } catch (err: any) {
        console.error("RSVP error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
