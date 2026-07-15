import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, Platform, ActivityIndicator, AppState } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind, StartUpdateOptions } from 'sp-react-native-in-app-updates';
import Constants from 'expo-constants';
import { ShieldAlert } from 'lucide-react-native';

export default function UpdateManager() {
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // We run the check on mount, and also every time the app comes to foreground
    const checkUpdates = async () => {
      try {
        let nativeUpdateTriggered = false;

        // 1. Check Native Play Store Update API (Safely, in case native module is missing from an older binary receiving this OTA)
        try {
          // Only instantiate if the native module actually exists, to prevent crashes on old binaries!
          const { NativeModules } = require('react-native');
          if (NativeModules.SpInAppUpdates) {
            const inAppUpdates = new SpInAppUpdates(false);
            const result = await inAppUpdates.checkNeedsUpdate();
            if (result.shouldUpdate) {
              let updateOptions: StartUpdateOptions = {};
              if (Platform.OS === 'android') {
                updateOptions = {
                  updateType: IAUUpdateKind.IMMEDIATE, // Forces a full-screen native block
                };
              }
              await inAppUpdates.startUpdate(updateOptions);
              nativeUpdateTriggered = true;
            }
          } else {
            console.log('[UpdateManager] Native module SpInAppUpdates not found. Skipping native check.');
          }
        } catch (nativeErr) {
          console.log('[UpdateManager] Native in-app update check failed:', nativeErr);
        }

        // 2. Check Custom Backend Config
        // If the native UI was triggered, it blocks the screen anyway. But if it wasn't, 
        // we should double check our strict minimum version from Supabase.
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const res = await fetch(`${apiUrl}/api/config/version`);
        
        if (res.ok) {
          const config = await res.json();
          const currentVersionCode = Constants.expoConfig?.android?.versionCode || 1;
          
          if (Platform.OS === 'android' && config.min_android_version && currentVersionCode < config.min_android_version) {
            // Out of date!
            if (!nativeUpdateTriggered) {
              setShowFallbackModal(true);
            }
          }
        }
      } catch (e) {
        console.error('[UpdateManager] Error checking updates:', e);
      } finally {
        setChecking(false);
      }
    };

    checkUpdates();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkUpdates();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleManualUpdate = () => {
    if (Platform.OS === 'android') {
      Linking.openURL('market://details?id=com.dheeyudha.app').catch(() => {
        Linking.openURL('https://play.google.com/store/apps/details?id=com.dheeyudha.app');
      });
    }
  };

  if (!showFallbackModal) return null;

  return (
    <Modal visible={showFallbackModal} animationType="fade" transparent={false}>
      <View className="flex-1 bg-slate-900 justify-center items-center px-6">
        <View className="w-20 h-20 bg-rose-500/20 rounded-full items-center justify-center mb-6 border border-rose-500/30">
          <ShieldAlert size={40} color="#f43f5e" />
        </View>
        <Text className="text-2xl font-black text-white mb-3 text-center">
          Critical Update Required
        </Text>
        <Text className="text-slate-400 text-center mb-8 leading-relaxed font-medium">
          Your version of Dheeyudhha is out of date and can no longer connect to our servers. Please update from the Play Store to continue your journey!
        </Text>

        <TouchableOpacity 
          onPress={handleManualUpdate}
          className="w-full bg-indigo-600 rounded-2xl py-4 items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
        >
          <Text className="text-white font-black text-sm uppercase tracking-widest">
            Update Now
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
