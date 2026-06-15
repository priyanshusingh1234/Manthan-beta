import { supabase } from '@/lib/supabaseClient';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Set default notification behavior (show alert, sound, badge while app is open)
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // shows banner when app is in foreground (replaces shouldShowAlert in v56+)
    shouldShowList: true,     // shows in notification center
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save the FCM token to push_subscriptions.
 * 
 * The web backend (createNotification.ts) reads from push_subscriptions where
 * p256dh_key = 'native', and uses the endpoint as an FCM token to send via firebase-admin.
 * This function registers the device token in that exact format.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Skip on web — web push uses VAPID/service workers, not FCM
  if (Platform.OS === 'web') return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Ask for permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied by user');
      return null;
    }

    // Register Notification Categories for actionable push notifications (Accept/Decline)
    await Notifications.setNotificationCategoryAsync('duel_challenge', [
      {
        identifier: 'accept_duel',
        buttonTitle: '⚔️ Accept',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'decline_duel',
        buttonTitle: '❌ Decline',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('chat_message', [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        options: { opensAppToForeground: false },
        textInput: {
          submitButtonTitle: 'Send',
          placeholder: 'Type a message...',
        },
      },
    ]);

    // 2. Get the native device push token (raw FCM token on Android, APNs on iOS)
    // This is the token the web firebase-admin SDK sends to directly.
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = tokenData.data as string;

    if (!fcmToken) {
      console.warn('[Push] Could not get device push token');
      return null;
    }

    // 3. Upsert this FCM token into push_subscriptions matching web's format:
    //    - endpoint = the FCM token
    //    - p256dh_key = 'native'  (signals to backend: send via Firebase Admin, not web-push)
    //    - auth_key = 'native'
    //    - user_id = current user
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: fcmToken,
          p256dh_key: 'native',
          auth_key: 'native',
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('[Push] Failed to save push token to push_subscriptions:', error.message);
      return null;
    }

    console.log('[Push] FCM token registered:', fcmToken.substring(0, 20) + '...');
    return fcmToken;
  } catch (err) {
    console.error('[Push] registerForPushNotificationsAsync error:', err);
    return null;
  }
}

/**
 * Remove the current device's push token from push_subscriptions on logout.
 */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = tokenData.data as string;
    if (fcmToken) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', fcmToken);
    }
  } catch (err) {
    console.error('[Push] Failed to unregister push token:', err);
  }
}
