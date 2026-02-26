import supabaseAdmin from '@/lib/supabaseAdmin';
import webpush from 'web-push';

// Configure Web Push with VAPID keys from the .env file
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@dheeyudha.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}
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
        } else if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            // If the notification successfully inserted, broadcast to user's push subscriptions
            const { data: subs } = await supabaseAdmin
                .from('push_subscriptions')
                .select('endpoint, p256dh_key, auth_key')
                .eq('user_id', params.userId);

            if (subs && subs.length > 0) {
                const payload = JSON.stringify({
                    title: params.title,
                    body: params.body,
                    url: params.href || '/',
                });

                // Fire web-push to all endpoints in parallel
                await Promise.allSettled(
                    subs.map(async (sub) => {
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh_key,
                                auth: sub.auth_key,
                            }
                        };
                        try {
                            await webpush.sendNotification(pushSubscription, payload);
                        } catch (pushErr: any) {
                            // If endpoint is dead/unsubscribed, we could clean it up here
                            console.error('[createNotification] Push failed for endpoint:', sub.endpoint);
                            if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
                                await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                            }
                        }
                    })
                );
            }
        }
    } catch (e) {
        console.error('[createNotification] Unexpected error:', e);
    }
}
