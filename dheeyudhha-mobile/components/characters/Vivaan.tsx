import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Svg, Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
"use client";

export const Vivaan = ({ className = "", isWaving = false }: { className?: string; isWaving?: boolean }) => {
  return (
    <View className={`relative ${className}`}>
      <Svg width="240" height="300" viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
        <G transform="translate(60, 40) scale(1.5)">
          <View animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <G id="b1-legs">
              <Rect x="15" y="160" width="18" height="40" rx="4" fill="#3A86FF" />
              <Rect x="10" y="195" width="28" height="15" rx="7" fill="#FFD166" />
              <Rect x="45" y="160" width="18" height="40" rx="4" fill="#4A90E2" />
              <Rect x="45" y="195" width="28" height="15" rx="7" fill="#FFBE0B" />
            </G>
            <Rect x="15" y="95" width="50" height="70" rx="20" fill="#FF7B7B" />
            <Path d="M 15 130 L 65 130 L 65 165 C 65 175, 15 175, 15 165 Z" fill="#4A90E2" />
            <View 
              animate={isWaving ? { rotate: [0, 20, -20, 20, -20, 0] } : { rotate: [0, 10, 0] }} 
              transition={isWaving ? { repeat: Infinity, duration: 1.5 } : { repeat: Infinity, duration: 2 }}
              style={{ originX: "10px", originY: "110px" }}
            >
              <Rect x="-5" y="100" width="16" height="50" rx="8" fill="#FF7B7B" />
              <Circle cx="3" cy="150" r="10" fill="#FFDFC4" />
            </View>
            <View animate={{ rotate: [0, -10, 0] }} style={{ originX: "70px", originY: "110px" }}>
              <Rect x="65" y="100" width="16" height="50" rx="8" fill="#FF7B7B" />
              <Circle cx="73" cy="150" r="10" fill="#FFDFC4" />
            </View>
          </View>
          <View animate={{ rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 3 }} style={{ originX: "40px", originY: "95px" }}>
            <Rect x="33" y="85" width="14" height="15" fill="#FFDFC4" />
            <Rect x="0" y="10" width="80" height="75" rx="35" fill="#FFDFC4" />
            <Path d="M 0 45 C -10 -10, 90 -10, 80 45 Z" fill="#FFB347" />
            <View animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}>
              <Circle cx="22" cy="50" r="7" fill="#333" />
              <Circle cx="58" cy="50" r="7" fill="#333" />
            </View>
            <Path d="M 32 62 Q 40 75 48 62 Z" fill="#FF7B7B" stroke="#333" stroke-width="2" />
            <Path d="M -5 35 Q 20 0 45 25 Q 60 5 85 30 Q 60 -15 20 -10 Z" fill="#FF9F1C" />
          </View>
        </G>
      </Svg>
    </View>
  );
};
