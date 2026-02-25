import supabaseAdmin from '@/lib/supabaseAdmin';

export type NotificationType =
    | 'new_follower'
    | 'answer_approved'
    | 'answer_flagged'
    | 'ai_confirmed_correct'
    | 'ai_confirmed_wrong'
    | 'points_earned'
    | 'new_question'
    | 'coop_challenge';

interface CreateNotificationParams {
    userId: string;          // who receives the notification
    type: NotificationType;
    title: string;
    body: string;
    href?: string;           // optional link to navigate to on click
    actorId?: string;        // who triggered it
    actorName?: string;
    actorAvatar?: string;
}

/**
 * Insert a notification for a user.
 * Fire-and-forget — never throws, so it won't break the calling route.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: params.userId,
                type: params.type,
                title: params.title,
                body: params.body,
                href: params.href ?? null,
                actor_id: params.actorId ?? null,
                actor_name: params.actorName ?? null,
                actor_avatar: params.actorAvatar ?? null,
                read: false,
            });

        if (error) {
            console.error('[createNotification] DB error:', error.message);
        }
    } catch (e) {
        console.error('[createNotification] Unexpected error:', e);
    }
}
