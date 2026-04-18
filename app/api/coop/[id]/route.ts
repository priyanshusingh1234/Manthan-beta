import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/createNotification";

const cleanAv = (u?: string | null) => u && !u.includes('googleusercontent.com') ? u : null;
const cleanAvMeta = (m: Record<string, any>) => cleanAv(m.custom_avatar_url) || cleanAv(m.avatar_url) || null;

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const challengeId = params.id;

        // Fetch challenge
        const { data: challenge, error: cErr } = await supabaseAdmin
            .from("coop_challenges")
            .select("id, question_id, initiator_id, partner_id, status, created_at, expires_at, message")
            .eq("id", challengeId)
            .single();

        if (cErr || !challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

        // Verify user is a participant
        if (challenge.initiator_id !== user.id && challenge.partner_id !== user.id) {
            return NextResponse.json({ error: "Not a participant" }, { status: 403 });
        }

        // Fetch question
        const { data: question } = await supabaseAdmin
            .from("questions")
            .select("id, title, points, subject, class_grade")
            .eq("id", challenge.question_id)
            .single();

        // Fetch both players' user metadata
        const [initiatorRes, partnerRes] = await Promise.all([
            supabaseAdmin.auth.admin.getUserById(challenge.initiator_id),
            supabaseAdmin.auth.admin.getUserById(challenge.partner_id),
        ]);
        const initiatorMeta = initiatorRes.data?.user?.user_metadata || {};
        const partnerMeta = partnerRes.data?.user?.user_metadata || {};

        // Fetch both submissions for this challenge
        const { data: submissions } = await supabaseAdmin
            .from("written_submissions")
            .select("id, student_id, status, self_marked_correct, points_awarded, submission_url")
            .eq("challenge_id", challengeId);

        const initiatorSub = (submissions || []).find(s => s.student_id === challenge.initiator_id) || null;
        const partnerSub = (submissions || []).find(s => s.student_id === challenge.partner_id) || null;

        return NextResponse.json({
            challenge: {
                id: challenge.id,
                status: challenge.status,
                questionId: challenge.question_id,
                createdAt: challenge.created_at,
                expiresAt: challenge.expires_at,
                message: challenge.message,
            },
            question: question || null,
            initiator: {
                id: challenge.initiator_id,
                name: initiatorMeta.fullName || initiatorMeta.name || "Player 1",
                username: initiatorMeta.username || "",
                avatar: cleanAvMeta(initiatorMeta),
                submission: initiatorSub,
                isCurrentUser: user.id === challenge.initiator_id,
            },
            partner: {
                id: challenge.partner_id,
                name: partnerMeta.fullName || partnerMeta.name || "Player 2",
                username: partnerMeta.username || "",
                avatar: cleanAvMeta(partnerMeta),
                submission: partnerSub,
                isCurrentUser: user.id === challenge.partner_id,
            },
            currentUserId: user.id,
        });
    } catch (err: any) {
        console.error("[coop/status] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── Accept / Reject a co-op challenge ─────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { action } = await req.json(); // action: "accept" | "reject" | "withdraw"
        if (!action || !['accept', 'reject', 'withdraw'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const challengeId = params.id;

        // Fetch challenge
        const { data: challenge, error: cErr } = await supabaseAdmin
            .from("coop_challenges")
            .select("id, question_id, initiator_id, partner_id, status, expires_at, questions(points)")
            .eq("id", challengeId)
            .single();

        if (cErr || !challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

        // Only the partner can accept/reject/withdraw
        if (challenge.partner_id !== user.id) {
            return NextResponse.json({ error: "Only the challenged partner can accept or reject/withdraw" }, { status: 403 });
        }

        if (action === 'withdraw') {
            if (challenge.status !== 'active') {
                return NextResponse.json({ error: `Withdraw requires active challenge` }, { status: 409 });
            }
        } else {
            // Challenge must still be pending for accept/reject
            if (challenge.status !== 'pending') {
                return NextResponse.json({ error: `Challenge is already ${challenge.status}` }, { status: 409 });
            }
        }

        const partnerRes = await supabaseAdmin.auth.admin.getUserById(user.id);
        const partnerName = partnerRes.data?.user?.user_metadata?.fullName
            || partnerRes.data?.user?.user_metadata?.username
            || "Your partner";

        if (action === 'accept') {
            // Mark challenge as active so partner can now solve
            await supabaseAdmin
                .from("coop_challenges")
                .update({ status: 'active' })
                .eq("id", challengeId);

            // Notify initiator
            await createNotification({
                userId: challenge.initiator_id,
                type: 'coop_challenge',
                title: `Help Request Accepted`,
                body: `@${partnerRes.data?.user?.user_metadata?.username || partnerName} has accepted your Help Request and is currently solving.`,
                href: `/questions/${challenge.question_id}?challenge=${challengeId}`,
                actorId: user.id,
                actorName: partnerName,
                actorAvatar: cleanAvMeta(partnerRes.data?.user?.user_metadata || {}) || undefined,
            });

            return NextResponse.json({ success: true, status: 'active' });
        }

        // ── REJECT ────────────────────────────────────────────────────────────
        // 1. Set challenge to rejected
        await supabaseAdmin
            .from("coop_challenges")
            .update({ status: 'rejected' })
            .eq("id", challengeId);

        // 2. Record a question_attempt for the partner so they can't be tagged again
        //    (upsert — won't crash if one already somehow exists)
        await supabaseAdmin
            .from("question_attempts")
            .upsert({
                user_id: user.id,
                question_id: challenge.question_id,
                selected_option: -1,        // sentinel: rejected, not an MCQ answer
                is_correct: false,
                time_taken: 0,
                started_at: new Date().toISOString(),
                submitted_at: new Date().toISOString(),
            }, { onConflict: 'user_id,question_id', ignoreDuplicates: true });

        // 3. Notify initiator that the help request was declined
        await createNotification({
            userId: challenge.initiator_id,
            type: 'coop_challenge',
            title: `Help Request Declined`,
            body: `@${partnerRes.data?.user?.user_metadata?.username || partnerName} has declined your Help Request.`,
            href: `/questions/${challenge.question_id}`,
            actorId: user.id,
            actorName: partnerName,
            actorAvatar: partnerRes.data?.user?.user_metadata?.avatar_url || null,
        });

        // 4. If this is a withdrawal from an active challenge, apply the standard 20% penalty now
        let withdrawMessage = "";
        if (action === 'withdraw') {
            const questionPoints = Number((challenge.questions as any)?.points || 0);
            const standardPenalty = Math.floor(questionPoints / 5);
            
            if (standardPenalty > 0) {
                 const { data: partnerData } = await supabaseAdmin.auth.admin.getUserById(user.id);
                 const pMeta = partnerData?.user?.user_metadata || {};
                 const newTotal = Math.max(0, (Number(pMeta.totalPoints) || 0) - standardPenalty);
                 await supabaseAdmin.auth.admin.updateUserById(user.id, {
                     user_metadata: { ...pMeta, totalPoints: newTotal }
                 });
                 withdrawMessage = ` (-${standardPenalty} pts)`;
            }
        }

        return NextResponse.json({ success: true, status: 'rejected', message: withdrawMessage });
    } catch (err: any) {
        console.error("[coop/patch] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
