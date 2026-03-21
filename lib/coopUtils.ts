import supabaseAdmin from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/createNotification";

export async function processCoopWin(submission: any) {
    if (!submission.challenge_id) return;

    try {
        const { data: challenge } = await supabaseAdmin
            .from("coop_challenges")
            .select("id, initiator_id, partner_id, status")
            .eq("id", submission.challenge_id)
            .single();

        if (!challenge || challenge.status === 'won') return;

        // Mark challenge as won
        await supabaseAdmin.from("coop_challenges").update({ status: 'won', updated_at: new Date().toISOString() }).eq("id", challenge.id);

        const questionPoints = Number((submission.questions as any)?.points || 0);
        const splitPoints = Math.ceil(questionPoints / 2);

        // Identify the other player
        const otherUserId = challenge.initiator_id === submission.student_id ? challenge.partner_id : challenge.initiator_id;

        // Reward the other player (the submitter already got their half provisionally if not fast-tracked)
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(otherUserId);
        const userMeta = userData?.user?.user_metadata || {};
        await supabaseAdmin.auth.admin.updateUserById(otherUserId, {
            user_metadata: { ...userMeta, totalPoints: (Number(userMeta.totalPoints) || 0) + splitPoints }
        });

        // Notify the other player
        await createNotification({
            userId: otherUserId,
            type: 'coop_challenge',
            title: `Team Victory! 🎉`,
            body: `Your co-op partner got the written answer right! You both earned +${splitPoints} points.`,
            href: `/questions/${submission.question_id}`,
        });

        // Delete the other player's pending submission if it exists
        await supabaseAdmin
            .from("written_submissions")
            .delete()
            .eq("challenge_id", challenge.id)
            .eq("student_id", otherUserId);

    } catch (err) {
        console.error("Failed to process coop win:", err);
    }
}

export async function processCoopLoss(submission: any) {
    if (!submission.challenge_id) return;

    try {
        const { data: challenge } = await supabaseAdmin
            .from("coop_challenges")
            .select("id, initiator_id, partner_id, status, partner_attempted")
            .eq("id", submission.challenge_id)
            .single();

        if (!challenge || challenge.status === 'lost' || challenge.status === 'won') return;

        const isPartner = challenge.partner_id === submission.student_id;
        const isInitiator = challenge.initiator_id === submission.student_id;

        if (isPartner) {
            // Partner failed to save. Challenge is permanently lost.
            await supabaseAdmin
                .from("coop_challenges")
                .update({ partner_attempted: true, status: 'lost', updated_at: new Date().toISOString() })
                .eq("id", challenge.id);

            const { data: partnerUser } = await supabaseAdmin.auth.admin.getUserById(submission.student_id);
            const partnerName = partnerUser?.user?.user_metadata?.fullName || partnerUser?.user?.user_metadata?.username || "Your friend";

            await createNotification({
                userId: challenge.initiator_id,
                type: 'coop_challenge',
                title: `${partnerName} couldn't save you!`,
                body: `They failed the checker review. Your co-op challenge is officially lost.`,
                href: `/questions/${submission.question_id}`,
            });
        }
    } catch (err) {
        console.error("Failed to process coop loss:", err);
    }
}
