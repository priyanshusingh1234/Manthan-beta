import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions, Platform, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { getLeague, getNextLeague, LEAGUES } from '@/lib/leagues';
import LeagueBadge from '@/components/LeagueBadge';
import { ArrowLeft, Crown, Users, ChevronRight, Calendar, Zap, Shield, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const LEAGUE_NAMES = LEAGUES.map(l => l.name);

export default function LeagueScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'leaderboard' | 'friends' | 'all'>('leaderboard');
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((t) => {
      if (t === 'dark') setTheme('dark');
    });

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      try {
        const res = await fetch(`${API_URL}/api/league`, { 
          headers: { Authorization: `Bearer ${session.access_token}` } 
        });
        if (res.ok) {
          const d = await res.json();
          setData(d);
          const currentLeagueName = getLeague(d.monthlyPts).name;
          const lastLeague = await AsyncStorage.getItem('last_known_league');
          if (lastLeague && lastLeague !== currentLeagueName) {
            const oldIdx = LEAGUE_NAMES.indexOf(lastLeague as any);
            const newIdx = LEAGUE_NAMES.indexOf(currentLeagueName as any);
            if (newIdx > oldIdx) {
               DeviceEventEmitter.emit('trigger_league_up', { oldLeague: lastLeague, newLeague: currentLeagueName });
            }
          }
          await AsyncStorage.setItem('last_known_league', currentLeagueName);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme === 'dark' ? '#020617' : '#ffffff' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={[styles.loadingText, { color: theme === 'dark' ? '#64748b' : '#94a3b8' }]}>Loading your league...</Text>
      </View>
    );
  }

  if (!data) return null;

  const { monthlyPts, leagueRank, leaderboard, friends, userId } = data;
  const league = getLeague(monthlyPts);
  const nextLeague = getNextLeague(monthlyPts);
  const pctToNext = nextLeague
    ? Math.min(100, Math.round(((monthlyPts - league.min) / (nextLeague.min - league.min)) * 100))
    : 100;
  const ptsToNext = nextLeague ? nextLeague.min - monthlyPts : 0;
  
  const now = new Date();
  const daysLeft = now.getDay() === 0 ? 0 : 7 - now.getDay();
  const myEntry = leaderboard.find((p: any) => p.id === userId);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#020617' : '#f8fafc';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { borderBottomColor: borderColor }]}>
      {[
        { key: 'leaderboard', label: 'Leaderboard', Icon: Trophy },
        { key: 'friends', label: 'Friends', Icon: Users },
        { key: 'all', label: 'All Leagues', Icon: Shield },
      ].map(({ key, label, Icon }) => {
        const isActive = tab === key;
        return (
          <TouchableOpacity key={key} style={styles.tabButton} onPress={() => setTab(key as any)}>
            <Icon size={16} color={isActive ? '#6366f1' : textMuted} />
            <Text style={[styles.tabText, { color: isActive ? '#6366f1' : textMuted }]}>{label}</Text>
            {isActive && <View style={styles.tabActiveLine} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HERO */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[league.gradient[0] + '33', league.gradient[league.gradient.length - 1] + '11', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: isDark ? '#1e293b88' : '#ffffff88', borderColor }]}>
              <ArrowLeft size={20} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>League</Text>
            <View style={[styles.daysBadge, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor }]}>
              <Text style={[styles.daysBadgeText, { color: textMuted }]}>{daysLeft}d left</Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={{ shadowColor: league.glow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}>
              <LeagueBadge name={league.name} size={110} animate />
            </View>
            <Text style={[styles.leagueName, { color: league.color }]}>{league.name}</Text>
            <Text style={[styles.leagueSub, { color: textMuted }]}>League · {monthlyPts} pts this week</Text>

            <View style={styles.statsRow}>
              {[
                { icon: <Crown size={16} color="#f59e0b" />, label: 'Rank', value: `#${leagueRank}` },
                { icon: <Zap size={16} color="#6366f1" />, label: 'Weekly', value: `${monthlyPts} pts` },
                { icon: <Calendar size={16} color="#10b981" />, label: 'Days Left', value: `${daysLeft}d` },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                  {s.icon}
                  <Text style={[styles.statValue, { color: textColor }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {nextLeague ? (
              <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressText, { color: textMuted }]}>{league.name}</Text>
                  <Text style={[styles.progressText, { color: nextLeague.color }]}>{nextLeague.name} · {ptsToNext} pts away</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <LinearGradient
                    colors={[league.color, nextLeague.color]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${pctToNext}%` }]}
                  />
                </View>
                <Text style={[styles.progressFooter, { color: textMuted }]}>Earn {ptsToNext} more pts to promote</Text>
              </View>
            ) : (
              <View style={[styles.maxLeagueCard, { backgroundColor: `${league.color}20`, borderColor: `${league.color}40` }]}>
                <Text style={[styles.maxLeagueText, { color: league.color }]}>🏆 You're at the highest league!</Text>
              </View>
            )}
          </View>
        </View>

        {renderTabs()}

        <View style={styles.contentPadding}>
          {tab === 'leaderboard' && (
            <View style={styles.listContainer}>
              <Text style={[styles.listSubtitle, { color: textMuted }]}>{league.name} League · Ranked by Weekly Points</Text>
              
              {myEntry && !leaderboard.slice(0, 20).find((p: any) => p.id === userId) && (
                <View style={[styles.listItem, { borderColor: league.color, backgroundColor: `${league.color}10` }]}>
                  <Text style={[styles.rankText, { width: 32, color: textMuted }]}>#{leagueRank}</Text>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.nameText, { color: textColor }]}>You</Text>
                  </View>
                  <Text style={[styles.ptsText, { color: league.color }]}>{monthlyPts} pts</Text>
                </View>
              )}

              {leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🏜️</Text>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No one here yet</Text>
                  <Text style={[styles.emptySub, { color: textMuted }]}>Earn points to enter the league!</Text>
                </View>
              ) : (
                leaderboard.slice(0, 20).map((p: any, i: number, arr: any[]) => {
                  const isMe = p.id === userId;
                  const isPromotionZone = i < 3;
                  const isDemotionZone = arr.length >= 10 && i >= arr.length - 3;
                  
                  // Zone styling
                  let bgCol = isMe ? (isDark ? '#312e81' : '#e0e7ff') : cardBg;
                  let borderCol = isMe ? (isDark ? '#3730a3' : '#c7d2fe') : borderColor;

                  if (isPromotionZone && !isMe) {
                    bgCol = isDark ? '#022c22' : '#ecfdf5'; // slight emerald
                    borderCol = isDark ? '#059669' : '#34d399';
                  } else if (isDemotionZone && !isMe) {
                    bgCol = isDark ? '#450a0a' : '#fef2f2'; // slight red
                    borderCol = isDark ? '#dc2626' : '#fca5a5';
                  }

                  return (
                    <TouchableOpacity key={p.id} style={[styles.listItem, { backgroundColor: bgCol, borderColor: borderCol }]} onPress={() => router.push(`/user/${p.username || p.id}`)}>
                      <View style={{ width: 32, alignItems: 'center' }}>
                        {i === 0 ? <Text style={styles.rankEmoji}>🥇</Text>
                         : i === 1 ? <Text style={styles.rankEmoji}>🥈</Text>
                         : i === 2 ? <Text style={styles.rankEmoji}>🥉</Text>
                         : <Text style={[styles.rankText, { color: isMe ? '#6366f1' : (isDemotionZone ? '#ef4444' : textMuted) }]}>#{i + 1}</Text>}
                      </View>
                      
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: league.gradient[0], justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={styles.avatarLetter}>{p.full_name?.[0]?.toUpperCase() || '?'}</Text>
                        </View>
                      )}

                      <View style={styles.nameContainer}>
                        <Text style={[styles.nameText, { color: isMe ? '#4f46e5' : textColor }]} numberOfLines={1}>
                          {p.full_name}
                          {isMe && <Text style={{ color: '#4f46e5', fontSize: 10, fontWeight: '900' }}>  YOU</Text>}
                        </Text>
                        {p.username && <Text style={[styles.usernameText, { color: textMuted }]}>@{p.username}</Text>}
                      </View>

                      <View style={styles.scoreContainer}>
                        <Text style={[styles.ptsText, { color: isPromotionZone ? league.color : (isDemotionZone ? '#ef4444' : textColor) }]}>
                          {p.monthly_points > 0 ? `${p.monthly_points} w.pts` : `${p.total_points ?? 0} pts`}
                        </Text>
                        <Text style={[styles.ptsSub, { color: textMuted }]}>{p.monthly_points > 0 ? 'this week' : 'all time'}</Text>
                      </View>
                      <ChevronRight size={16} color={textMuted} />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {tab === 'friends' && (
            <View style={styles.listContainer}>
              {friends.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>Follow people to compare leagues</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.listSubtitle, { color: textMuted }]}>{friends.length} Friends · Ranked by Weekly Points</Text>
                  {friends.map((f: any, i: number) => {
                    const fl = getLeague(f.monthly_points || 0);
                    return (
                      <TouchableOpacity key={f.id} style={[styles.listItem, { backgroundColor: cardBg, borderColor }]} onPress={() => router.push(`/user/${f.username || f.id}`)}>
                        <Text style={[styles.rankText, { width: 24, color: textMuted }]}>#{i+1}</Text>
                        
                        {f.avatar_url ? (
                          <Image source={{ uri: f.avatar_url }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: fl.gradient[0], justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={styles.avatarLetter}>{f.full_name?.[0]?.toUpperCase() || '?'}</Text>
                          </View>
                        )}

                        <View style={styles.nameContainer}>
                          <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>{f.full_name}</Text>
                          <Text style={[styles.usernameText, { color: fl.color }]}>{fl.name} League</Text>
                        </View>

                        <LeagueBadge name={fl.name} size={32} />
                        
                        <View style={[styles.scoreContainer, { marginLeft: 8 }]}>
                          <Text style={[styles.ptsText, { color: textColor }]}>{f.monthly_points}</Text>
                          <Text style={[styles.ptsSub, { color: textMuted }]}>pts</Text>
                        </View>

                        {/* TAUNT BUTTON */}
                        {f.monthly_points < monthlyPts && (
                          <TouchableOpacity 
                            style={styles.tauntButton}
                            onPress={async (e) => {
                              e.stopPropagation(); // prevent navigating to profile
                              // Optimistic UI could be added, but simple alert is fine for now
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
                                await fetch(`${API_URL}/api/league/taunt`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${session?.access_token}`
                                  },
                                  body: JSON.stringify({ targetUserId: f.id })
                                });
                                // Maybe show a quick toast here
                              } catch (err) {
                                console.error('Taunt failed', err);
                              }
                            }}
                          >
                            <Text style={{ fontSize: 16 }}>💥</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          )}

          {tab === 'all' && (
            <View style={styles.listContainer}>
              <Text style={[styles.listSubtitle, { color: textMuted }]}>9 Leagues · Monthly Points Required</Text>
              {[...LEAGUES].reverse().map((l) => {
                const isCurrent = l.name === league.name;
                const isNext = nextLeague?.name === l.name;
                const unlocked = LEAGUE_NAMES.indexOf(l.name) <= LEAGUE_NAMES.indexOf(league.name);
                return (
                  <View key={l.name} style={[styles.allLeagueCard, { 
                    backgroundColor: cardBg, borderColor: isCurrent ? l.color : borderColor,
                    borderWidth: isCurrent ? 2 : 1,
                    shadowColor: isCurrent ? l.glow : 'transparent',
                    shadowOffset: { width: 0, height: 4 }, shadowOpacity: isCurrent ? 0.25 : 0, shadowRadius: 10, elevation: isCurrent ? 5 : 0
                  }]}>
                    <View style={{ opacity: (!unlocked && !isNext) ? 0.3 : 1 }}>
                      <LeagueBadge name={l.name} size={44} animate={isCurrent} />
                    </View>
                    <View style={styles.allLeagueInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.nameText, { color: textColor }]}>{l.name}</Text>
                        {isCurrent && <View style={[styles.badgePill, { backgroundColor: l.color }]}><Text style={styles.badgePillText}>CURRENT</Text></View>}
                        {isNext && <View style={[styles.badgePill, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}><Text style={[styles.badgePillText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>NEXT</Text></View>}
                      </View>
                      <Text style={[styles.usernameText, { color: textMuted, marginTop: 2 }]}>
                        {l.min === 0 ? '0–99' : l.max === Infinity ? `${l.min}+` : `${l.min}–${l.max}`} pts / month
                      </Text>
                      {isCurrent && nextLeague && (
                        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginTop: 8, height: 6 }]}>
                          <View style={[styles.progressBarFill, { width: `${pctToNext}%`, backgroundColor: l.color }]} />
                        </View>
                      )}
                    </View>
                    {unlocked && !isCurrent && <Text style={{ color: '#10b981', fontSize: 18, fontWeight: '900' }}>✓</Text>}
                  </View>
                );
              })}
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '700' },
  heroContainer: { paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 24, position: 'relative' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  backButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  daysBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  daysBadgeText: { fontSize: 12, fontWeight: '800' },
  heroContent: { alignItems: 'center', paddingHorizontal: 16 },
  leagueName: { fontSize: 28, fontWeight: '900', marginTop: 12 },
  leagueSub: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 15, fontWeight: '900', marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressText: { fontSize: 12, fontWeight: '800' },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressFooter: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  maxLeagueCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16, alignItems: 'center' },
  maxLeagueText: { fontSize: 14, fontWeight: '900' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tabButton: { flex: 1, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' },
  tabText: { fontSize: 12, fontWeight: '900' },
  tabActiveLine: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 3, backgroundColor: '#6366f1', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  contentPadding: { padding: 16 },
  listContainer: { gap: 8 },
  listSubtitle: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, gap: 12 },
  rankText: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  rankEmoji: { fontSize: 20, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  avatarLetter: { color: '#fff', fontSize: 16, fontWeight: '900' },
  nameContainer: { flex: 1 },
  nameText: { fontSize: 14, fontWeight: '900' },
  usernameText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  ptsText: { fontSize: 14, fontWeight: '900' },
  ptsSub: { fontSize: 10, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  emptySub: { fontSize: 14, fontWeight: '700' },
  allLeagueCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 16, marginBottom: 8 },
  allLeagueInfo: { flex: 1 },
  badgePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgePillText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  tauntButton: { marginLeft: 8, padding: 8, backgroundColor: '#f59e0b20', borderRadius: 20, borderWidth: 1, borderColor: '#f59e0b40' }
});
