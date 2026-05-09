package com.dheeyudha.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID = "incoming_calls_v2";
    private static final String DUEL_CHANNEL_ID = "duels";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        if (remoteMessage.getData().size() > 0) {
            String type = remoteMessage.getData().get("type");
            
            if ("incoming_call".equals(type)) {
                String roomId = remoteMessage.getData().get("roomId");
                String callerName = remoteMessage.getData().get("callerName");

                // Grab a WakeLock to force the CPU to stay awake while we boot the app
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                PowerManager.WakeLock wakeLock = pm.newWakeLock(PowerManager.FULL_WAKE_LOCK |
                        PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        PowerManager.ON_AFTER_RELEASE, "Dheeyudha:CallWakeLock");
                
                wakeLock.acquire(15000); // Hold for 15 seconds

                showIncomingCallNotification(callerName, roomId);
            } else if ("coop_challenge".equals(type)) {
                showCoopChallengeNotification(remoteMessage);
            }
        }
    }

    private void showIncomingCallNotification(String callerName, String roomId) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setImportance(NotificationManager.IMPORTANCE_HIGH);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 1000, 500, 1000});
            
            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), attributes);
            
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("type", "incoming_call");
        intent.putExtra("roomId", roomId);
        intent.putExtra("callerName", callerName);
        intent.putExtra("fromKilledState", true);

        // FLAG_MUTABLE is required for FullScreenIntent on modern Android
        int pendingIntentFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S 
            ? PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT 
            : PendingIntent.FLAG_UPDATE_CURRENT;

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 0, intent, pendingIntentFlags);

        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(getResources().getIdentifier("ic_notification", "drawable", getPackageName()))
                .setContentTitle("Incoming Call")
                .setContentText(callerName + " is calling you")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setOngoing(true)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
                .setVibrate(new long[]{0, 500, 1000, 500, 1000})
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        notificationManager.notify(1001, notificationBuilder.build());
    }

    private void showCoopChallengeNotification(RemoteMessage remoteMessage) {
        String title = remoteMessage.getData().get("title");
        String body = remoteMessage.getData().get("body");
        String url = remoteMessage.getData().get("url");

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                DUEL_CHANNEL_ID,
                "⚔️ Duels & Battles",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.enableVibration(true);
            channel.setLightColor(0xFFF97316); // orange
            
            // Try to set battle sound if it exists in raw/
            int soundId = getResources().getIdentifier("battle", "raw", getPackageName());
            if (soundId != 0) {
                AudioAttributes attributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                channel.setSound(android.net.Uri.parse("android.resource://" + getPackageName() + "/" + soundId), attributes);
            }
            
            notificationManager.createNotificationChannel(channel);
        }

        int pendingIntentFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S 
            ? PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT 
            : PendingIntent.FLAG_UPDATE_CURRENT;

        // Default intent (tapping the notification)
        Intent defaultIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://manthan-beta-c975.vercel.app" + (url != null ? url : "/notifications")));
        defaultIntent.setPackage(getPackageName());
        PendingIntent defaultPending = PendingIntent.getActivity(this, 101, defaultIntent, pendingIntentFlags);

        // Accept intent
        String acceptUrl = url != null ? url : "/notifications";
        if (!acceptUrl.contains("autoAccept=")) {
            acceptUrl += (acceptUrl.contains("?") ? "&" : "?") + "autoAccept=1";
        }
        Intent acceptIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://manthan-beta-c975.vercel.app" + acceptUrl));
        acceptIntent.setPackage(getPackageName());
        PendingIntent acceptPending = PendingIntent.getActivity(this, 102, acceptIntent, pendingIntentFlags);

        // Reject intent
        String rejectUrl = url != null ? url : "/notifications";
        if (!rejectUrl.contains("autoReject=")) {
            rejectUrl += (rejectUrl.contains("?") ? "&" : "?") + "autoReject=1";
        }
        Intent rejectIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://manthan-beta-c975.vercel.app" + rejectUrl));
        rejectIntent.setPackage(getPackageName());
        PendingIntent rejectPending = PendingIntent.getActivity(this, 103, rejectIntent, pendingIntentFlags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, DUEL_CHANNEL_ID)
            .setSmallIcon(getResources().getIdentifier("ic_notification", "drawable", getPackageName()))
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(defaultPending)
            .addAction(0, "⚔️ Accept", acceptPending)
            .addAction(0, "❌ Decline", rejectPending);

        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, builder.build());
    }
}
