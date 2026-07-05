import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { Trophy, Award, FlaskConical } from 'lucide-react-native';

interface AnimatedTitleBadgeProps {
  titleName: string;
  size?: number;
}

export default function AnimatedTitleBadge({ titleName, size = 64 }: AnimatedTitleBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Rotate animation (for outer rings/effects)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const reverseSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg']
  });

  // Matter Analyst Special Animated Badge
  if (titleName === 'Matter Analyst') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer glowing pulse ring */}
        <Animated.View 
          style={{ 
            position: 'absolute', 
            width: size * 1.2, 
            height: size * 1.2, 
            borderRadius: size, 
            backgroundColor: 'rgba(249, 115, 22, 0.2)', // Orange glow
            transform: [{ scale: pulseAnim }]
          }} 
        />
        
        {/* Spinning atom rings */}
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: spin }] }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <SvgLinearGradient id="matterGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#f97316" />
                <Stop offset="100%" stopColor="#e11d48" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="45" stroke="url(#matterGrad)" strokeWidth="2" strokeDasharray="10 5" fill="none" opacity="0.6"/>
          </Svg>
        </Animated.View>
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: reverseSpin }] }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="35" stroke="#e11d48" strokeWidth="1" strokeDasharray="5 5" fill="none" opacity="0.4"/>
          </Svg>
        </Animated.View>

        {/* Floating Core Icon */}
        <Animated.View style={{ 
          width: size * 0.6, 
          height: size * 0.6, 
          borderRadius: size, 
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#e11d48',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 5,
          transform: [{ translateY: floatAnim }]
        }}>
          <FlaskConical size={size * 0.35} color="#e11d48" fill="rgba(225, 29, 72, 0.2)" />
        </Animated.View>
      </View>
    );
  }

  // Generic Title Badge Animation
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View 
        style={{ 
          position: 'absolute', 
          width: size * 1.1, 
          height: size * 1.1, 
          borderRadius: size, 
          backgroundColor: 'rgba(99, 102, 241, 0.15)', // Indigo glow
          transform: [{ scale: pulseAnim }]
        }} 
      />
      <Animated.View style={{ 
        width: size * 0.8, 
        height: size * 0.8, 
        borderRadius: size, 
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
        transform: [{ translateY: floatAnim }]
      }}>
        <Award size={size * 0.4} color="#fff" />
      </Animated.View>
    </View>
  );
}
