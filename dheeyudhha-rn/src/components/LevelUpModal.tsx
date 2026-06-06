import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, TouchableOpacity, Animated, Easing, StyleSheet, DeviceEventEmitter } from "react-native";
import { Zap, Trophy, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// ── Level colour palette (cycles every 10 levels) ────────────────────────────
const LEVEL_PALETTES = [
  { from: "#6366f1", to: "#8b5cf6", glow: "#6366f133", label: "Apprentice"   },
  { from: "#3b82f6", to: "#06b6d4", glow: "#3b82f633", label: "Scholar"      },
  { from: "#10b981", to: "#34d399", glow: "#10b98133", label: "Achiever"     },
  { from: "#f59e0b", to: "#fbbf24", glow: "#f59e0b33", label: "Expert"       },
  { from: "#ef4444", to: "#f97316", glow: "#ef444433", label: "Champion"     },
  { from: "#ec4899", to: "#f43f5e", glow: "#ec489933", label: "Elite"        },
  { from: "#8b5cf6", to: "#a855f7", glow: "#8b5cf633", label: "Legend"       },
  { from: "#0ea5e9", to: "#6366f1", glow: "#0ea5e933", label: "Master"       },
  { from: "#f59e0b", to: "#ef4444", glow: "#f59e0b44", label: "Grandmaster"  },
  { from: "#fbbf24", to: "#f97316", glow: "#fbbf2444", label: "Immortal"     },
];

function getPalette(level: number) {
  return LEVEL_PALETTES[(level - 1) % LEVEL_PALETTES.length];
}

export default function LevelUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const palette = getPalette(newLevel);
  const [show, setShow] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0.4)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(badgeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(badgeAnim, { toValue: 1, friction: 3, tension: 50, useNativeDriver: true }),
        ]).start(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(floatAnim, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
          ).start();
        });
      }, 300);
    } else {
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setShow(false);
        scaleAnim.setValue(0.85);
        badgeAnim.setValue(0.4);
        badgeOpacity.setValue(0);
        floatAnim.setValue(0);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('trigger_level_up', ({ level }) => {
      setNewLevel(level);
      setIsOpen(true);
    });
    return () => listener.remove();
  }, []);

  const onClose = () => setIsOpen(false);

  if (!isOpen && !show) return null;

  return (
    <Modal visible={true} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          
          <Animated.View style={{ opacity: badgeOpacity, transform: [{ scale: badgeAnim }, { translateY: floatAnim }], marginBottom: 24 }}>
            <LinearGradient
              colors={[palette.from, palette.to]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Zap size={32} color="white" fill="white" />
              <Text style={styles.badgeText}>{newLevel}</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.textContainer}>
            <Text style={[styles.titleSmall, { color: palette.from }]}>LEVEL UP!</Text>
            <Text style={styles.titleLarge}>You reached{"\n"}Level {newLevel}</Text>
            <Text style={styles.subtitle}>{palette.label} — Keep the momentum going!</Text>
          </View>

          <View style={[styles.statPill, { backgroundColor: `${palette.from}22`, borderColor: `${palette.from}55` }]}>
            <Trophy size={16} color={palette.from} />
            <Text style={styles.statText}>{(newLevel - 1) * 50} XP reached!</Text>
            <Zap size={16} fill="#fbbf24" color="#fbbf24" />
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.ctaButton}>
            <LinearGradient
              colors={[palette.from, palette.to]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Keep Grinding 🔥</Text>
              <ChevronRight size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.dismissText}>Tap anywhere to dismiss</Text>
        </Animated.View>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '900',
    marginTop: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleSmall: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 8,
  },
  titleLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
    gap: 8,
  },
  statText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  dismissText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
  }
});
