package com.dheeyudha.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "DheeyudhaMain";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Force Wake Up Screen & Bypass Lock Screen (Critical for Incoming Calls)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        );

        handleCallIntent(getIntent());
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCallIntent(intent);
    }

    /**
     * If the user tapped "Decline" on the call notification, we just need to:
     * 1. Stop the ringtone
     * 2. Cancel the ongoing call notification
     * No need to open the app UI for decline.
     */
    private void handleCallIntent(Intent intent) {
        if (intent == null) return;

        // Handle extras-based intents (fullScreenIntent, decline button)
        String type = intent.getStringExtra("type");
        Log.d(TAG, "handleCallIntent type=" + type + " action=" + intent.getAction());

        if ("decline_call".equals(type)) {
            // Stop ringtone
            MyFirebaseMessagingService.stopRingtone();

            // Cancel the call notification
            android.app.NotificationManager nm =
                    (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(1001); // matches CALL_NOTIFICATION_ID
            }

            // Clear the intent so it doesn't re-trigger
            intent.removeExtra("type");
        } else if ("incoming_call".equals(type)) {
            // Stop ringtone when app opens for the call (user will hear in-app audio)
            MyFirebaseMessagingService.stopRingtone();
        }

        // Handle ACTION_VIEW deep-link intents (Accept button on notification)
        // These come as Intent.ACTION_VIEW with a URL containing autoAccept=1
        if (Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            String url = intent.getData().toString();
            if (url.contains("autoAccept=1")) {
                Log.d(TAG, "Accept deep-link detected, stopping ringtone");
                MyFirebaseMessagingService.stopRingtone();

                // Cancel the call notification
                android.app.NotificationManager nm =
                        (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.cancel(1001);
                }
            }
        }
    }
}
