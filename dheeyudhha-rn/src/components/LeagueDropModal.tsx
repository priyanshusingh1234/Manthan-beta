import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import { getLeague, getWeekKey, LEAGUES } from '@/lib/leagues';
import LeagueBadge from './LeagueBadge';

const { width, height } = Dimensions.get('window');

const LEAGUE_COLORS: Record<string, string> = {};
LEAGUES.forEach(l => { LEAGUE_COLORS[l.name] = l.color; });

export default function LeagueDropModal() {
  const [visible, setVisible] = useState(false);
  const [oldPoints, setOldPoints] = useState(0);
  const [oldLeagueName, setOldLeagueName] = useState('Scholar');
  const [displayPoints, setDisplayPoints] = useState(0);

  const oldColor = LEAGUE_COLORS[oldLeagueName] || '#94a3b8';
  const newColor = LEAGUE_COLORS['Scholar'] || '#94a3b8';
  
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.5)).current;
  const contentY = useRef(new Animated.Value(80)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  const oldBadgeOpacity = useRef(new Animated.Value(0)).current;
  const oldBadgeX = useRef(new Animated.Value(-30)).current;
  
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const arrowScale = useRef(new Animated.Value(0.5)).current;
  
  const newBadgeOpacity = useRef(new Animated.Value(0)).current;
  const newBadgeX = useRef(new Animated.Value(30)).current;
  const newBadgeScale = useRef(new Animated.Value(0.7)).current;
  
  const pointsAnim = useRef(new Animated.Value(0)).current;

  // Particle positions
  const particles = useRef(Array.from({ length: 20 }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 6 + 2,
    animY: new Animated.Value(0),
    animOp: new Animated.Value(0),
    animScale: new Animated.Value(0),
    delay: Math.random() * 2000,
    duration: 2000 + Math.random() * 2000,
  }))).current;

  useEffect(() => {
    async function checkLeagueDrop() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const currentWeek = getWeekKey();
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('monthly_points_month, monthly_points')
          .eq('id', session.user.id)
          .single();

        if (!profile) return;
        
        const storedWeek = profile.monthly_points_month;
        const storedPts = profile.monthly_points || 0;
        
        // Show modal if the week changed and points > 0
        if (storedWeek !== currentWeek && storedWeek !== null && storedPts > 0) {
          const shownKey = `league_drop_shown_${currentWeek}_${session.user.id}`;
          const hasShown = await AsyncStorage.getItem(shownKey);
          
          if (!hasShown) {
            const league = getLeague(storedPts);
            setOldPoints(storedPts);
            setOldLeagueName(league.name);
            
            // Set initial animated value to old points
            pointsAnim.setValue(storedPts);
            setDisplayPoints(storedPts);
            
            setVisible(true);
            await AsyncStorage.setItem(shownKey, 'true');
          }
        }
      } catch (e) {
        console.error('Error checking league drop', e);
      }
    }
    
    checkLeagueDrop();
  }, []);

  useEffect(() => {
    if (visible) {
      // Start particles
      particles.forEach((p) => {
        setTimeout(() => {
          Animated.loop(
            Animated.parallel([
              Animated.sequence([
                Animated.timing(p.animY, { toValue: -100, duration: p.duration / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(p.animY, { toValue: 0, duration: 0, useNativeDriver: true }),
              ]),
              Animated.sequence([
                Animated.timing(p.animOp, { toValue: 1, duration: p.duration / 4, useNativeDriver: true }),
                Animated.timing(p.animOp, { toValue: 0, duration: p.duration * 3 / 4, useNativeDriver: true }),
              ]),
              Animated.sequence([
                Animated.timing(p.animScale, { toValue: 1.5, duration: p.duration / 2, useNativeDriver: true }),
                Animated.timing(p.animScale, { toValue: 0, duration: p.duration / 2, useNativeDriver: true }),
              ])
            ])
          ).start();
        }, p.delay);
      });

      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
        Animated.spring(contentScale, { toValue: 1, friction: 6, tension: 40, delay: 100, useNativeDriver: true }),
        Animated.spring(contentY, { toValue: 0, friction: 6, tension: 40, delay: 100, useNativeDriver: true }),
        
        Animated.timing(oldBadgeOpacity, { toValue: 0.4, duration: 400, delay: 400, useNativeDriver: true }),
        Animated.spring(oldBadgeX, { toValue: 0, friction: 5, tension: 30, delay: 400, useNativeDriver: true }),

        Animated.timing(arrowOpacity, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }),
        Animated.spring(arrowScale, { toValue: 1, friction: 5, tension: 40, delay: 500, useNativeDriver: true }),

        Animated.timing(newBadgeOpacity, { toValue: 1, duration: 400, delay: 600, useNativeDriver: true }),
        Animated.spring(newBadgeX, { toValue: 0, friction: 6, tension: 35, delay: 600, useNativeDriver: true }),
        Animated.spring(newBadgeScale, { toValue: 1.1, friction: 5, tension: 40, delay: 600, useNativeDriver: true }),
      ]).start(() => {
        // After UI finishes arriving, animate the points dropping to 0
        setTimeout(() => {
          Animated.timing(pointsAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false // Must be false for text layout animations
          }).start();
        }, 300);
      });

      // Update state when animation value changes
      pointsAnim.addListener(({ value }) => {
        setDisplayPoints(Math.floor(value));
      });
      
    } else {
      Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        bgOpacity.setValue(0);
        contentScale.setValue(0.5);
        contentY.setValue(80);
        contentOpacity.setValue(0);
        oldBadgeOpacity.setValue(0);
        oldBadgeX.setValue(-30);
        arrowOpacity.setValue(0);
        arrowScale.setValue(0.5);
        newBadgeOpacity.setValue(0);
        newBadgeX.setValue(30);
        newBadgeScale.setValue(0.7);
        pointsAnim.removeAllListeners();
        particles.forEach(p => {
          p.animY.stopAnimation();
          p.animOp.stopAnimation();
          p.animScale.stopAnimation();
        });
      });
    }
  }, [visible, particles, pointsAnim]);

  const onDismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <Modal visible={true} transparent={true} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.bg, { backgroundColor: '#000000cc', opacity: bgOpacity }]}>
        
        {/* Glow behind the modal */}
        <View style={[styles.glow, { backgroundColor: oldColor }]} />

        {/* Particles */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: i % 2 === 0 ? oldColor : newColor,
                opacity: p.animOp,
                transform: [{ translateY: p.animY }, { scale: p.animScale }],
              }}
            />
          ))}
        </View>

        <Animated.View style={[styles.container, {
          opacity: contentOpacity,
          transform: [{ scale: contentScale }, { translateY: contentY }]
        }]}>
          
          <View style={[styles.pill, { backgroundColor: oldColor, shadowColor: oldColor }]}>
            <Text style={styles.pillText}>⏳ THE WEEK HAS ENDED!</Text>
          </View>

          <View style={styles.titleArea}>
            <Text style={styles.titleLight}>Last Week:</Text>
            <Text style={[styles.titleBold, { color: oldColor }]}>{oldLeagueName} League</Text>
          </View>

          {/* Badges Area */}
          <View style={styles.badgesRow}>
            {/* Old Badge */}
            <Animated.View style={[styles.badgeCol, { opacity: oldBadgeOpacity, transform: [{ translateX: oldBadgeX }] }]}>
              <LeagueBadge name={oldLeagueName} size={70} />
            </Animated.View>

            {/* Arrow */}
            <Animated.Text style={[styles.arrowText, { opacity: arrowOpacity, transform: [{ scale: arrowScale }] }]}>
              →
            </Animated.Text>

            {/* New Badge */}
            <Animated.View style={[styles.badgeCol, { opacity: newBadgeOpacity, transform: [{ translateX: newBadgeX }, { scale: newBadgeScale }] }]}>
              <LeagueBadge name="Scholar" size={90} animate />
            </Animated.View>
          </View>

          {/* Points Drop Animation */}
          <View style={styles.pointsArea}>
            <Text style={styles.pointsLabel}>Points Reset</Text>
            <Text style={[styles.pointsValue, { color: displayPoints === 0 ? newColor : oldColor }]}>
              {displayPoints} <Text style={{fontSize: 20}}>pts</Text>
            </Text>
          </View>

          <Text style={styles.subtitle}>A new week begins! Time to climb back to the top.</Text>

          {/* Dismiss Button */}
          <TouchableOpacity activeOpacity={0.8} onPress={onDismiss} style={[styles.button, { backgroundColor: newColor, shadowColor: newColor }]}>
            <Text style={styles.buttonText}>Let's go! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  container: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    zIndex: 10,
    backgroundColor: '#0f172a',
    padding: 28,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  pillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  badgeCol: {
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
    fontWeight: '900',
  },
  titleArea: {
    alignItems: 'center',
  },
  titleLight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleBold: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  pointsArea: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
  },
  pointsLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '900',
    marginTop: -4,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
