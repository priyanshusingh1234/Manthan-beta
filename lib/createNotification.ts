import supabaseAdmin from '@/lib/supabaseAdmin';
import webpush from 'web-push';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

// Configure Web Push with VAPID keys from the .env file
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:kpk22128@gmail.com',
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
    | 'missed_call'
    | 'chat_message'
    | 'streak_friend';

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
        if (params.type !== 'chat_message' && params.type !== 'incoming_call') {
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
                                    // ─── Per-type channel & color mapping ──────────────────
                                    // Each channel is pre-created in the Capacitor app with
                                    // its own sound/vibration profile so Android shows the
                                    // right behavior without any extra code here.
                                    type ChannelId = 'duels' | 'social' | 'academic' | 'alerts' | 'calls' | 'default';
                                    const CHANNEL_MAP: Record<string, ChannelId> = {
                                        coop_challenge:       'duels',
                                        new_follower:         'social',
                                        following_post:       'social',
                                        social_comment:       'social',
                                        post_mention:         'social',
                                        streak_friend:        'social',
                                        answer_approved:      'academic',
                                        answer_flagged:       'academic',
                                        ai_confirmed_correct: 'academic',
                                        ai_confirmed_wrong:   'academic',
                                        new_question:         'academic',
                                        points_earned:        'alerts',
                                        weekly_report:        'alerts',
                                        war_declared:         'duels',
                                        war_preparation:      'duels',
                                        war_started:          'duels',
                                        incoming_call:        'calls',
                                        missed_call:          'calls',
                                        chat_message:         'social',
                                    };
                                    const COLOR_MAP: Record<string, string> = {
                                        coop_challenge:       '#f97316', // orange — battle
                                        new_follower:         '#ec4899', // pink — social
                                        social_comment:       '#3b82f6', // blue
                                        post_mention:         '#3b82f6',
                                        following_post:       '#6366f1',
                                        streak_friend:        '#f97316',
                                        answer_approved:      '#10b981', // emerald — correct
                                        ai_confirmed_correct: '#10b981',
                                        answer_flagged:       '#ef4444', // red — wrong
                                        ai_confirmed_wrong:   '#ef4444',
                                        new_question:         '#6366f1', // indigo — academic
                                        points_earned:        '#f59e0b', // amber — reward
                                        weekly_report:        '#06b6d4', // cyan
                                        war_declared:         '#dc2626',
                                        war_preparation:      '#d97706',
                                        war_started:          '#dc2626',
                                        incoming_call:        '#6366f1',
                                        chat_message:         '#3b82f6',
                                    };

                                    const channelId: ChannelId = CHANNEL_MAP[params.type] || 'default';
                                    const color = COLOR_MAP[params.type] || '#4f46e5';
                                    const isDuel = params.type === 'coop_challenge';
                                    const isIncomingCall = params.type === 'incoming_call';

                                    // Action buttons (Android only — shown in notification shade)
                                    const actions: admin.messaging.AndroidFcmOptions[] = [];
                                    // We pass actions via data so Capacitor/FCM can register them
                                    const actionsData: Record<string, string> = {};
                                    if (isDuel) {
                                        actionsData['action_1_id']    = 'accept_duel';
                                        actionsData['action_1_title'] = '⚔️ Accept';
                                        actionsData['action_1_url']   = params.href || '/duels';
                                        actionsData['action_2_id']    = 'decline_duel';
                                        actionsData['action_2_title'] = '❌ Decline';
                                    }

                                    await firebaseAdmin.messaging().send({
                                        token: sub.endpoint,

                                        // Incoming call uses data-only to wake JS (IncomingCallKit)
                                        notification: isIncomingCall ? undefined : {
                                            title: params.title,
                                            body: params.body,
                                        },

                                        data: {
                                            title: params.title,
                                            body: params.body,
                                            url: params.href || '/',
                                            href: params.href || '/',
                                            link: params.href || '/',
                                            deep_link: params.href || '/',
                                            type: params.type,
                                            roomId: params.href?.split('/chat/')?.[1]?.split('?')?.[0] || '',
                                            callerName: params.actorName || params.title || 'Scholar',
                                            // Actor info — used by the app to show avatar in notification
                                            actor_name:   params.actorName   || '',
                                            actor_avatar: params.actorAvatar || '',
                                            click_action: 'OPEN_APP',
                                            // Action buttons (handled by Capacitor PushNotifications listener)
                                            ...actionsData,
                                        },

                                        android: {
                                            priority: (isIncomingCall || isDuel) ? 'high' : 'normal',
                                            collapseKey: channelId, // group same-channel notifications
                                            notification: isIncomingCall ? undefined : {
                                                channelId,
                                                color,
                                                icon: 'ic_notification',  // white monochrome in res/drawable
                                                // Large icon = sender avatar (shows on right side on Android)
                                                ...(params.actorAvatar ? { imageUrl: params.actorAvatar } : {}),
                                                // BigText style — shows full body when pulled down
                                                body: params.body,
                                                title: params.title,
                                                clickAction: 'OPEN_APP',
                                                sound: isIncomingCall ? 'ringtone' : (channelId === 'duels' ? 'battle' : 'default'),
                                                tag: params.type, // replaces previous notif of same type (dedupes)
                                                // Notification group — Android bundles these together
                                                notificationCount: 1,
                                                // Visibility on lock screen: PUBLIC = show full content
                                                visibility: 'public',
                                                // Show ticker text in status bar
                                                ticker: params.title,
                                            },
                                        },

                                        apns: {
                                            payload: {
                                                aps: {
                                                    alert: { title: params.title, body: params.body },
                                                    sound: isDuel ? 'battle.caf' : 'default',
                                                    badge: 1,
                                                    category: isIncomingCall ? 'incoming_call' : (isDuel ? 'duel_challenge' : undefined),
                                                    'mutable-content': 1,
                                                }
                                            },
                                            headers: {
                                                // High priority for time-sensitive notifications
                                                'apns-priority': (isIncomingCall || isDuel) ? '10' : '5',
                                            },
                                        },
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
