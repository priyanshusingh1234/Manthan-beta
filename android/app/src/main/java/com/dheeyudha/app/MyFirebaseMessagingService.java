package com.dheeyudha.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.core.app.NotificationCompat;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "DheeyudhaFCM";

    // Must match the channel ID created in Capacitor JS (ClientLayout.tsx)
    private static final String CALL_CHANNEL_ID = "calls";
    private static final String DUEL_CHANNEL_ID = "duels";
    private static final int CALL_NOTIFICATION_ID = 1001;

    // Static ringtone so we can stop it when the notification is dismissed
    private static Ringtone activeRingtone;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "onMessageReceived: data=" + remoteMessage.getData());

        if (remoteMessage.getData().size() > 0) {
            String type = remoteMessage.getData().get("type");

            if ("incoming_call".equals(type)) {
                String roomId = remoteMessage.getData().get("roomId");
                String callerName = remoteMessage.getData().get("callerName");
                String url = remoteMessage.getData().get("url");

                // Wake the device so the user can see/hear the call
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    PowerManager.WakeLock wakeLock = pm.newWakeLock(
                            PowerManager.FULL_WAKE_LOCK |
                            PowerManager.ACQUIRE_CAUSES_WAKEUP |
                            PowerManager.ON_AFTER_RELEASE,
                            "Dheeyudha:CallWakeLock");
                    wakeLock.acquire(30000); // 30 seconds
                }

                showIncomingCallNotification(callerName, roomId, url);
            } else if ("coop_challenge".equals(type)) {
                showCoopChallengeNotification(remoteMessage);
            }
        }
    }

    private void showIncomingCallNotification(String callerName, String roomId, String url) {
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // ── Create/update the call notification channel ──────────────────────
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CALL_CHANNEL_ID,
                    "📞 Calls",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 1000, 500, 1000, 500, 1000});
            channel.setBypassDnd(true);

            // Use the device default ringtone
            AudioAttributes ringtoneAttrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            channel.setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                    ringtoneAttrs);

            notificationManager.createNotificationChannel(channel);
        }

        // ── PendingIntent flags ──────────────────────────────────────────────
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                : PendingIntent.FLAG_UPDATE_CURRENT;

        // ── Full-screen intent → opens the app on the call page ─────────────
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("type", "incoming_call");
        fullScreenIntent.putExtra("roomId", roomId != null ? roomId : "");
        fullScreenIntent.putExtra("callerName", callerName != null ? callerName : "Scholar");
        fullScreenIntent.putExtra("fromKilledState", true);
        PendingIntent fullScreenPI = PendingIntent.getActivity(this, 0, fullScreenIntent, piFlags);

        // ── Accept action → deep-link into the chat with autoAccept ─────────
        String chatPath = "/chat/" + (roomId != null ? roomId : "");
        String acceptUrl = "https://manthan-beta-c975.vercel.app" + chatPath
                + "?autoAccept=1&callType=voice&callerName=" + Uri.encode(callerName != null ? callerName : "Scholar");

        Intent acceptIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(acceptUrl));
        acceptIntent.setPackage(getPackageName());
        acceptIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent acceptPI = PendingIntent.getActivity(this, 200, acceptIntent, piFlags);

        // ── Decline action → just dismiss notification (no navigation) ──────
        Intent declineIntent = new Intent(this, MainActivity.class);
        declineIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        declineIntent.putExtra("type", "decline_call");
        declineIntent.putExtra("roomId", roomId != null ? roomId : "");
        PendingIntent declinePI = PendingIntent.getActivity(this, 201, declineIntent, piFlags);

        // ── Build notification with Accept / Decline buttons ─────────────────
        String displayName = (callerName != null && !callerName.isEmpty()) ? callerName : "Scholar";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
                .setSmallIcon(getResources().getIdentifier("ic_notification", "drawable", getPackageName()))
                .setContentTitle("📞 Incoming Call")
                .setContentText(displayName + " is calling you")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setOngoing(true)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
                .setVibrate(new long[]{0, 500, 1000, 500, 1000, 500, 1000})
                .setFullScreenIntent(fullScreenPI, true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setTimeoutAfter(45000) // Auto-dismiss after 45 seconds
                .addAction(android.R.drawable.sym_action_call, "✅ Accept", acceptPI)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "❌ Decline", declinePI);

        notificationManager.notify(CALL_NOTIFICATION_ID, builder.build());

        // ── Also play the ringtone manually (belt-and-suspenders) ────────────
        // Some Android skins ignore the channel sound for data-only messages.
        try {
            stopRingtone(); // Stop any previous ringtone
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            activeRingtone = RingtoneManager.getRingtone(getApplicationContext(), ringtoneUri);
            if (activeRingtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    activeRingtone.setLooping(true);
                }
                activeRingtone.play();

                // Auto-stop after 45 seconds
                new android.os.Handler(getMainLooper()).postDelayed(() -> stopRingtone(), 45000);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to play ringtone", e);
        }

        Log.d(TAG, "Incoming call notification shown for " + displayName + " (room=" + roomId + ")");
    }

    /** Stop the active ringtone if one is playing. */
    public static void stopRingtone() {
        if (activeRingtone != null) {
            try {
                if (activeRingtone.isPlaying()) {
                    activeRingtone.stop();
                }
            } catch (Exception ignored) {}
            activeRingtone = null;
        }
    }

    private void showCoopChallengeNotification(RemoteMessage remoteMessage) {
        String title = remoteMessage.getData().get("title");
        String body = remoteMessage.getData().get("body");
        String url = remoteMessage.getData().get("url");

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

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
                channel.setSound(
                        Uri.parse("android.resource://" + getPackageName() + "/" + soundId),
                        attributes);
            }

            notificationManager.createNotificationChannel(channel);
        }

        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                : PendingIntent.FLAG_UPDATE_CURRENT;

        // Default intent (tapping the notification)
        Intent defaultIntent = new Intent(Intent.ACTION_VIEW,
                Uri.parse("https://manthan-beta-c975.vercel.app" + (url != null ? url : "/notifications")));
        defaultIntent.setPackage(getPackageName());
        PendingIntent defaultPending = PendingIntent.getActivity(this, 101, defaultIntent, piFlags);

        // Accept intent
        String acceptUrl = url != null ? url : "/notifications";
        if (!acceptUrl.contains("autoAccept=")) {
            acceptUrl += (acceptUrl.contains("?") ? "&" : "?") + "autoAccept=1";
        }
        Intent acceptIntent = new Intent(Intent.ACTION_VIEW,
                Uri.parse("https://manthan-beta-c975.vercel.app" + acceptUrl));
        acceptIntent.setPackage(getPackageName());
        PendingIntent acceptPending = PendingIntent.getActivity(this, 102, acceptIntent, piFlags);

        // Reject intent
        String rejectUrl = url != null ? url : "/notifications";
        if (!rejectUrl.contains("autoReject=")) {
            rejectUrl += (rejectUrl.contains("?") ? "&" : "?") + "autoReject=1";
        }
        Intent rejectIntent = new Intent(Intent.ACTION_VIEW,
                Uri.parse("https://manthan-beta-c975.vercel.app" + rejectUrl));
        rejectIntent.setPackage(getPackageName());
        PendingIntent rejectPending = PendingIntent.getActivity(this, 103, rejectIntent, piFlags);

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
