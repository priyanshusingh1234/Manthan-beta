import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

export default function AnimatedCrusherPill() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 20,
      transform: [{ scale: pulseAnim }],
      // Add a subtle shadow for the glowing effect
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 4,
    }}>
      <Text style={{ fontSize: 11 }}>⚡</Text>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
        The Crusher
      </Text>
      <View style={{ backgroundColor: '#fff2', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
        <Text style={{ color: '#fca5a5', fontSize: 7, fontWeight: '900', letterSpacing: 1 }}>RARE</Text>
      </View>
    </Animated.View>
  );
}
