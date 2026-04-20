import supabaseAdmin from '@/lib/supabaseAdmin';
import webpush from 'web-push';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

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
    | 'following_post'
    | 'answer_approved'
    | 'answer_flagged'
    | 'ai_confirmed_correct'
    | 'ai_confirmed_wrong'
    | 'points_earned'
    | 'new_question'
    | 'coop_challenge'
    | 'social_comment'
    | 'war_declared'
    | 'war_preparation'
    | 'war_started'
    | 'post_mention'
    | 'weekly_report'
    | 'incoming_call'
    | 'chat_message';

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
        if (params.type !== 'chat_message') {
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
        }
            // Broadcast to user's push subscriptions
            const { data: subs } = await supabaseAdmin
                .from('push_subscriptions')
                .select('endpoint, p256dh_key, auth_key')
                .eq('user_id', params.userId);

            if (subs && subs.length > 0) {
                // Prepare payloads
                const webPayload = JSON.stringify({
                    title: params.title,
                    body: params.body,
                    url: params.href || '/',
                });

                // Fire pushes to all endpoints in parallel
                await Promise.allSettled(
                    subs.map(async (sub) => {
                        // --- CASE A: NATIVE (CAPACITOR/FCM) ---
                        if (sub.p256dh_key === 'native') {
                            if (firebaseAdmin.apps.length > 0) {
                                try {
                                     await firebaseAdmin.messaging().send({
                                        token: sub.endpoint,
                                        notification: {
                                            title: params.title,
                                            body: params.body,
                                        },
                                        data: {
                                            url: params.href || '/',
                                            href: params.href || '/',
                                            link: params.href || '/',
                                            deep_link: params.href || '/',
                                            type: params.type,
                                            click_action: 'OPEN_APP',
                                        },
                                        android: {
                                            priority: 'high',
                                            notification: {
                                                channelId: 'default',
                                                color: '#4f46e5',
                                                // clickAction must match the intent-filter action in AndroidManifest.xml
                                                clickAction: 'OPEN_APP',
                                                tag: params.type,
                                                icon: 'ic_notification',
                                                sound: 'default'
                                            }
                                        }
                                    });
                                } catch (fcmErr) {
                                    console.error('[createNotification] FCM Push failed:', fcmErr);
                                }
                            }
                            return;
                        }

                        // --- CASE B: WEB PUSH ---
                        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
                            const pushSubscription = {
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: sub.p256dh_key,
                                    auth: sub.auth_key,
                                }
                            };
                            try {
                                await webpush.sendNotification(pushSubscription, webPayload);
                            } catch (pushErr: any) {
                                console.error('[createNotification] Web Push failed:', sub.endpoint);
                                if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
                                    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                                }
                            }
                        }
                    })
                );
            }
    } catch (e) {
        console.error('[createNotification] Unexpected error:', e);
    }
}
