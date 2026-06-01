import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { BadgeCheck, Sparkles, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

export default function BottomBanner() {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const checkHidden = async () => {
      try {
        const hidden = await AsyncStorage.getItem('dheeyudha_premium_banner_hidden');
        if (hidden === '1') setShowBanner(false);
      } catch {}
    };
    checkHidden();
  }, []);

  const hideBanner = async () => {
    try {
      await AsyncStorage.setItem('dheeyudha_premium_banner_hidden', '1');
    } catch {}
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <Animated.View 
        entering={SlideInDown} 
        exiting={SlideOutDown}
        className="absolute bottom-20 left-4 right-4 z-40"
      >
        <View className="rounded-2xl bg-blue-500 p-4 shadow-2xl overflow-hidden border border-white/20">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2 flex-1">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
                <BadgeCheck size={24} color="#713f12" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Sparkles size={14} color="white" />
                  <Text className="text-sm font-bold text-white" numberOfLines={1}>Go Pro for ₹49/month</Text>
                </View>
                <Text className="text-[10px] text-white/90" numberOfLines={1}>No Ads • Verified Badge • Priority Support</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="items-center justify-center rounded-full bg-white px-4 py-2 shadow-lg"
            >
              <Text className="text-sm font-semibold text-blue-600">Upgrade</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={hideBanner}
              className="absolute -top-2 -right-2 h-8 w-8 items-center justify-center rounded-full bg-black/30"
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center p-4 bg-black/50">
          <Animated.View entering={FadeIn} exiting={FadeOut} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="absolute top-4 right-4 h-10 w-10 items-center justify-center rounded-lg bg-gray-100"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-yellow-400 mb-4">
                <BadgeCheck size={32} color="white" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</Text>
              <Text className="text-gray-600 mb-6 text-center">Get access to exclusive features and benefits</Text>
              
              <View className="bg-blue-50 rounded-xl p-4 mb-6 w-full">
                <View className="flex-row items-center gap-3 mb-3">
                  <Sparkles size={20} color="#2563eb" />
                  <Text className="text-gray-700">Ad-free experience</Text>
                </View>
                <View className="flex-row items-center gap-3 mb-3">
                  <BadgeCheck size={20} color="#2563eb" />
                  <Text className="text-gray-700">Verified badge</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Sparkles size={20} color="#2563eb" />
                  <Text className="text-gray-700">Priority support</Text>
                </View>
              </View>

              <View className="flex-row items-end mb-6">
                <Text className="text-3xl font-bold text-gray-900">₹49</Text>
                <Text className="text-lg text-gray-600 mb-1">/month</Text>
              </View>
              
              <TouchableOpacity className="w-full items-center justify-center rounded-full bg-blue-600 py-3 shadow-lg h-12">
                <Text className="text-white font-semibold text-lg">Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
