package com.dheeyudha.app;

import android.content.Intent;
import android.net.Uri;
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
     * Handle call-related intents:
     *  - accept_call  → stop ringtone, cancel notification, navigate to chat room
     *  - decline_call → stop ringtone, cancel notification, stay on current screen
     *  - incoming_call → stop ringtone, cancel notification (full-screen tap)
     */
    private void handleCallIntent(Intent intent) {
        if (intent == null || intent.getExtras() == null) return;

        String type = intent.getStringExtra("type");
        Log.d(TAG, "handleCallIntent type=" + type);

        if (type == null) return;

        // ── Common cleanup: always stop ringtone + cancel notification ────────
        MyFirebaseMessagingService.stopRingtone();
        MyFirebaseMessagingService.cancelCallNotification(this);

        // Clear the intent extras so it doesn't re-trigger on config changes
        intent.removeExtra("type");

        if ("accept_call".equals(type)) {
            // Navigate to the chat page with autoAccept so Agora call starts
            String roomId = intent.getStringExtra("roomId");
            String callerName = intent.getStringExtra("callerName");
            if (roomId == null) roomId = "";
            if (callerName == null) callerName = "Scholar";

            String chatUrl = "https://manthan-beta-c975.vercel.app/chat/" + roomId
                    + "?autoAccept=1&callType=voice&callerName=" + Uri.encode(callerName);

            Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(chatUrl));
            webIntent.setPackage(getPackageName());
            webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(webIntent);
        }
        // For decline_call and incoming_call, cleanup above is sufficient
    }
}
