import { supabase } from '@/lib/supabaseClient';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function subscribeToPushNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to subscribe.');

  if (Platform.OS === 'web') {
    // Web fallback using standard Push API
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported by this browser.');
    }
    // Just a placeholder since the full SW logic requires a VAPID key and NextJS API routes
    console.log('Web push not fully implemented in this Expo migration phase.');
    return true;
  }

  // Native Platform using Expo Notifications
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    throw new Error('Push notification permission denied on the device.');
  }

  // Get Expo Push Token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Save the token to Supabase or your backend
  // For Expo, we would hit a custom Edge Function or insert into a `user_tokens` table.
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id);

  if (error) {
    throw new Error('Failed to save native push token: ' + error.message);
  }

  return true;
}
