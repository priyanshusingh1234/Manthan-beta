import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing, StyleSheet, Dimensions, DeviceEventEmitter } from 'react-native';
import LeagueBadge from './LeagueBadge';

const { width, height } = Dimensions.get('window');

const LEAGUE_COLORS: Record<string, string> = {
  Scholar: '#94a3b8', Explorer: '#22c55e', Spark: '#f59e0b',
  Catalyst: '#f97316', Visionary: '#a855f7', Vanguard: '#3b82f6',
  Luminary: '#eab308', Apex: '#ef4444', Pinnacle: '#e879f9',
};

export default function LeagueUpModal() {
  const [visible, setVisible] = useState(false);
  const [oldLeagueName, setOldLeagueName] = useState('Scholar');
  const [newLeagueName, setNewLeagueName] = useState('Explorer');

  const color = LEAGUE_COLORS[newLeagueName] || '#6366f1';
  
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

  // Particle positions
  const particles = useRef(Array.from({ length: 15 }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 5 + 2,
    animY: new Animated.Value(0),
    animOp: new Animated.Value(0),
    animScale: new Animated.Value(0),
    delay: Math.random() * 2000,
    duration: 2000 + Math.random() * 2000,
  }))).current;

  useEffect(() => {
    if (visible) {
      // Start particles
      particles.forEach((p) => {
        setTimeout(() => {
          Animated.loop(
            Animated.parallel([
              Animated.sequence([
                Animated.timing(p.animY, { toValue: -80, duration: p.duration / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
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

        Animated.timing(newBadgeOpacity, { toValue: 1, duration: 400, delay: 550, useNativeDriver: true }),
        Animated.spring(newBadgeX, { toValue: 0, friction: 6, tension: 35, delay: 550, useNativeDriver: true }),
        Animated.spring(newBadgeScale, { toValue: 1.1, friction: 5, tension: 40, delay: 550, useNativeDriver: true }),
      ]).start();
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
        particles.forEach(p => {
          p.animY.stopAnimation();
          p.animOp.stopAnimation();
          p.animScale.stopAnimation();
        });
      });
    }
  }, [visible, particles]);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('trigger_league_up', ({ oldLeague, newLeague }) => {
      setOldLeagueName(oldLeague);
      setNewLeagueName(newLeague);
      setVisible(true);
    });
    return () => listener.remove();
  }, []);

  const onDismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <Modal visible={true} transparent={true} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.bg, { backgroundColor: '#000000cc', opacity: bgOpacity }]}>
        
        {/* Glow behind the modal */}
        <View style={[styles.glow, { backgroundColor: color }]} />

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
                backgroundColor: color,
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
          
          {/* Pill */}
          <View style={[styles.pill, { backgroundColor: color, shadowColor: color }]}>
            <Text style={styles.pillText}>⚡ LEAGUE UP!</Text>
          </View>

          {/* Badges Area */}
          <View style={styles.badgesRow}>
            {/* Old Badge */}
            <Animated.View style={[styles.badgeCol, { opacity: oldBadgeOpacity, transform: [{ translateX: oldBadgeX }] }]}>
              <LeagueBadge name={oldLeagueName} size={64} />
              <Text style={styles.oldBadgeText}>{oldLeagueName}</Text>
            </Animated.View>

            {/* Arrow */}
            <Animated.Text style={[styles.arrowText, { opacity: arrowOpacity, transform: [{ scale: arrowScale }] }]}>
              →
            </Animated.Text>

            {/* New Badge */}
            <Animated.View style={[styles.badgeCol, { opacity: newBadgeOpacity, transform: [{ translateX: newBadgeX }, { scale: newBadgeScale }] }]}>
              <LeagueBadge name={newLeagueName} size={90} animate />
              <Text style={styles.newBadgeText}>{newLeagueName}</Text>
            </Animated.View>
          </View>

          {/* Title Area */}
          <View style={styles.titleArea}>
            <Text style={styles.titleLight}>You've reached</Text>
            <Text style={[styles.titleBold, { color }]}>{newLeagueName} League!</Text>
            <Text style={styles.subtitle}>Keep earning points to stay here</Text>
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity activeOpacity={0.8} onPress={onDismiss} style={[styles.button, { backgroundColor: color, shadowColor: color }]}>
            <Text style={styles.buttonText}>Awesome! Let's go 🚀</Text>
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
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
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
    textTransform: 'uppercase',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  badgeCol: {
    alignItems: 'center',
  },
  oldBadgeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  arrowText: {
    fontSize: 28,
    color: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleLight: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  titleBold: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  }
});
