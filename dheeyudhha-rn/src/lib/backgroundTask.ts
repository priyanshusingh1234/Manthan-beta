import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabaseClient';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error('[BackgroundTask] Error in background task:', error);
    return;
  }

  if (data) {
    const { notification, actionIdentifier, userText } = data as any;
    
    // Handle inline chat replies from the notification tray (when app is killed or backgrounded)
    if (actionIdentifier === 'reply' && userText) {
      const payload = notification?.request?.content?.data as any;
      const roomId = payload?.roomId;
      
      // Attempt to retrieve the session securely since this is a headless execution
      const { data: { session } } = await supabase.auth.getSession();
      
      if (roomId && session?.user?.id) {
        try {
          const content = userText.trim();
          
          // 1. Insert the new message directly into the chat
          await supabase.from('chat_messages').insert({
            room_id: roomId,
            sender_id: session.user.id,
            content,
            message_type: 'text'
          });

          // 2. Ping the notify API to alert the recipient that they received a reply
          const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
          await fetch(`${API_URL}/api/chat/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: payload?.callerId || '', 
              senderId: session.user.id,
              roomId,
              content: content.substring(0, 50)
            })
          }).catch(() => null);

          console.log('[BackgroundTask] Successfully sent background reply.');

        } catch (e) {
          console.error('[BackgroundTask] Failed to send inline reply', e);
        }
      }
    }
  }
});
