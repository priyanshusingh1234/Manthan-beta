import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Share, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { Share2, X, Sparkles } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// SVG Badges extracted
const GoldBadge = () => (
  <Svg width="140" height="140" viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="goldGrad" x1="4" y1="2" x2="20" y2="22">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="40%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#92400E" />
      </LinearGradient>
    </Defs>
    <Path d="M4 10C2 8 2 4 6 4M20 10C22 8 22 4 18 4" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <Path d="M12 2L15 5H9L12 2Z" fill="#FBBF24" />
    <Path d="M12 4L5 7V12C5 17.5 8.5 21.5 12 23C15.5 21.5 19 17.5 19 12V7L12 4Z" fill="url(#goldGrad)" stroke="#78350F" strokeWidth="0.5" />
    <Path d="M12 9L13.2 11.5H16L13.8 13.2L14.6 15.8L12.4 14.2L10.2 15.8L11 13.2L8.8 11.5H11.6L12.8 9Z" fill="white" />
  </Svg>
);

const SilverBadge = () => (
  <Svg width="120" height="120" viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="silverGrad" x1="4" y1="4" x2="20" y2="20">
        <Stop offset="0%" stopColor="#F1F5F9" />
        <Stop offset="50%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#334155" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2L20 6V12C20 18 12 22 12 22C12 22 4 18 4 12V6L12 2Z" fill="url(#silverGrad)" stroke="#1E293B" strokeWidth="1" />
    <SvgText x="12" y="16" fill="white" fontSize="11" fontWeight="900" textAnchor="middle">2</SvgText>
  </Svg>
);

const BronzeBadge = () => (
  <Svg width="120" height="120" viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="bronzeGrad" x1="12" y1="2" x2="12" y2="22">
        <Stop offset="0%" stopColor="#F97316" />
        <Stop offset="100%" stopColor="#7C2D12" />
      </LinearGradient>
    </Defs>
    <Path d="M8 15V22L12 20L16 22V15" fill="#7C2D12" opacity="0.8" />
    <Circle cx="12" cy="11" r="9" fill="url(#bronzeGrad)" stroke="#431407" strokeWidth="1.5" />
    <Circle cx="12" cy="11" r="7" stroke="white" strokeWidth="0.5" strokeDasharray="2 1" opacity="0.5" />
    <SvgText x="12" y="15" fill="white" fontSize="12" fontWeight="900" textAnchor="middle">3</SvgText>
  </Svg>
);

export default function CongratsBadgeModal() {
  const [userRank, setUserRank] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState<string>('');

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkRank = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (profile) setUsername(profile.username);

        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const res = await fetch(`${API_URL}/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          const top3 = data.topBrains || [];
          const myRank = top3.findIndex((u: any) => u.id === user.id);
          
          if (myRank !== -1 && myRank < 3) {
            const actualRank = myRank + 1;
            const lastShownKey = `badge_congrats_seen_v2_${user.id}_rank${actualRank}`;
            const alreadyShown = await AsyncStorage.getItem(lastShownKey);
            
            if (!alreadyShown) {
              setUserRank(actualRank);
              setShow(true);
              Animated.parallel([
                Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
              ]).start();
            }
          }
        }
      } catch (err) {
        console.error("Failed to check rank for congrats:", err);
      }
    };

    checkRank();
  }, []);

  const dismiss = async () => {
    if (userRank) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await AsyncStorage.setItem(`badge_congrats_seen_v2_${user.id}_rank${userRank}`, 'true');
      }
    }
    Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setShow(false);
    });
  };

  const handleShare = async () => {
    const shareTitle = `I just earned a ${userRank === 1 ? 'GOLD' : userRank === 2 ? 'SILVER' : 'BRONZE'} badge! 🏆`;
    const shareText = `I'm currently Rank #${userRank} on Dheeyudhha! 🧠 Join the ultimate battle of brains and see if you can beat my score.`;
    const shareUrl = username ? `https://dheeyudhha.com/user/${username}` : `https://dheeyudhha.com/leaderboard`; 

    try {
      await Share.share({
        message: `${shareTitle}\n\n${shareText}\n${shareUrl}`,
        url: shareUrl,
        title: shareTitle,
      });
      dismiss();
    } catch (err) {
      console.error(err);
    }
  };

  if (!show || !userRank) return null;

  const rankInfo = [
    { title: "CHAMPION", badge: <GoldBadge />, colors: ['#fbbf24', '#b45309'] as const, text: "You are the undisputed leader of the leaderboard. Keep your crown!" },
    { title: "ELITE CHALLENGER", badge: <SilverBadge />, colors: ['#cbd5e1', '#475569'] as const, text: "You've proven your brilliance. The top spot is only a few points away!" },
    { title: "PRO WARRIOR", badge: <BronzeBadge />, colors: ['#fb923c', '#c2410c'] as const, text: "Outstanding performance! You are among the elite students." }
  ][userRank - 1];

  return (
    <Modal visible={true} transparent={true} animationType="none" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2, 6, 23, 0.8)', opacity: opacityAnim }]} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />
        
        <Animated.View style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          
          <ExpoLinearGradient colors={rankInfo.colors} style={styles.header}>
            <View style={styles.badgeWrapper}>{rankInfo.badge}</View>
          </ExpoLinearGradient>

          <View style={styles.content}>
            <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.sparkleRow}>
              <Sparkles size={20} color="#fbbf24" />
              <Text style={styles.badgeEarned}>BADGE EARNED!</Text>
            </View>

            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.text}>"{rankInfo.text}"</Text>

            <TouchableOpacity activeOpacity={0.8} onPress={handleShare} style={styles.shareButtonWrapper}>
              <ExpoLinearGradient colors={rankInfo.colors} style={styles.shareButton}>
                <Share2 size={20} color="white" />
                <Text style={styles.shareText}>SHARE ACHIEVEMENT</Text>
              </ExpoLinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={dismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  badgeWrapper: {
    transform: [{ scale: 1.2 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    padding: 32,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  badgeEarned: {
    fontSize: 14,
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: 2,
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  text: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  shareButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  shareText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dismissButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  }
});
