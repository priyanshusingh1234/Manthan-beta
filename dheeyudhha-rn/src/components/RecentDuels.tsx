import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Swords, Trophy, Minus } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

interface DuelPlayer {
  name: string;
  username: string;
  avatar: string | null;
}

interface Duel {
  id: string;
  subject: string;
  isDraw: boolean;
  winner: DuelPlayer | null;
  loser: DuelPlayer | null;
  challenger: { name: string; username: string };
  challenged: { name: string; username: string };
  winnerCorrect: number | null;
  loserCorrect: number | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ uri, name, size = 36 }: { uri: string | null; name: string; size?: number }) {
  const initials = name.substring(0, 2).toUpperCase();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#e2e8f0' }}
      />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#4f46e5', fontWeight: '800', fontSize: size * 0.33 }}>{initials}</Text>
    </View>
  );
}

async function fetchRecentDuels(): Promise<Duel[]> {
  const { data: duels, error } = await supabase
    .from('duel_challenges')
    .select('id, winner_id, challenger_id, challenged_id, created_at, challenger_correct, challenged_correct, question_id')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !duels || duels.length === 0) return [];

  // Fetch profiles for all players
  const userIds = [...new Set(duels.flatMap((d: any) => [d.challenger_id, d.challenged_id]))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', userIds);

  const profileMap: Record<string, any> = Object.fromEntries(
    (profiles || []).map((p: any) => [p.id, p])
  );

  // Fetch subjects for questions
  const questionIds = [...new Set(duels.map((d: any) => d.question_id).filter(Boolean))];
  const subjectMap: Record<string, string> = {};
  if (questionIds.length > 0) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, subject')
      .in('id', questionIds);
    (questions || []).forEach((q: any) => { subjectMap[q.id] = q.subject; });
  }

  const isGoogleAvatar = (url: string | null) => !!url && url.includes('googleusercontent.com');

  return duels.map((d: any) => {
    const challenger = profileMap[d.challenger_id] || {};
    const challenged = profileMap[d.challenged_id] || {};
    const winner = d.winner_id ? profileMap[d.winner_id] : null;
    const isDraw = !d.winner_id;

    return {
      id: d.id,
      subject: subjectMap[d.question_id] || 'General',
      isDraw,
      winner: winner
        ? {
            name: winner.full_name || 'Unknown',
            username: winner.username || '',
            avatar: winner.avatar_url && !isGoogleAvatar(winner.avatar_url) ? winner.avatar_url : null,
          }
        : null,
      loser: !isDraw
        ? d.winner_id === d.challenger_id
          ? {
              name: challenged.full_name || 'Unknown',
              username: challenged.username || '',
              avatar: challenged.avatar_url && !isGoogleAvatar(challenged.avatar_url) ? challenged.avatar_url : null,
            }
          : {
              name: challenger.full_name || 'Unknown',
              username: challenger.username || '',
              avatar: challenger.avatar_url && !isGoogleAvatar(challenger.avatar_url) ? challenger.avatar_url : null,
            }
        : null,
      challenger: { name: challenger.full_name || 'Unknown', username: challenger.username || '' },
      challenged: { name: challenged.full_name || 'Unknown', username: challenged.username || '' },
      winnerCorrect: d.winner_id === d.challenger_id ? d.challenger_correct : d.challenged_correct,
      loserCorrect: d.winner_id === d.challenger_id ? d.challenged_correct : d.challenger_correct,
      createdAt: d.created_at,
    };
  });
}

export default function RecentDuels() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDuels()
      .then(setDuels)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center justify-center py-10">
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
    );
  }

  if (duels.length === 0) {
    return (
      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center justify-center py-10">
        <Swords size={32} color="#94a3b8" />
        <Text className="text-slate-900 font-bold text-center mt-3">No Recent Duels</Text>
        <Text className="text-slate-500 text-xs text-center mt-1">Challenge your friends to a 1v1 battle.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12 }}
    >
      {duels.map((duel) => (
        <TouchableOpacity
          key={duel.id}
          activeOpacity={0.85}
          style={{
            width: 200,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 14,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
            borderWidth: 1,
            borderColor: '#f1f5f9',
          }}
        >
          {/* Subject badge */}
          <View className="flex-row items-center gap-1.5 mb-3">
            <Swords size={12} color="#6366f1" />
            <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-wider" numberOfLines={1}>
              {duel.subject}
            </Text>
          </View>

          {/* Players row */}
          <View className="flex-row items-center justify-between mb-3">
            {/* Winner / Challenger */}
            <View className="items-center flex-1">
              <Avatar uri={duel.winner?.avatar ?? null} name={duel.winner?.name || duel.challenger.name} size={38} />
              <Text className="text-xs font-bold text-slate-900 mt-1 text-center" numberOfLines={1}>
                {duel.isDraw ? duel.challenger.name : (duel.winner?.name || '?')}
              </Text>
              {!duel.isDraw && (
                <View className="bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mt-1 flex-row items-center gap-1">
                  <Trophy size={9} color="#d97706" />
                  <Text className="text-amber-700 text-[9px] font-black">WIN</Text>
                </View>
              )}
            </View>

            {/* VS / Draw */}
            <View className="items-center mx-2">
              {duel.isDraw ? (
                <>
                  <Minus size={16} color="#94a3b8" />
                  <Text className="text-[9px] text-slate-400 font-bold mt-0.5">DRAW</Text>
                </>
              ) : (
                <>
                  <Text className="text-slate-400 font-black text-xs">VS</Text>
                  {duel.winnerCorrect != null && duel.loserCorrect != null && (
                    <Text className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      {duel.winnerCorrect}-{duel.loserCorrect}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Loser / Challenged */}
            <View className="items-center flex-1">
              <Avatar uri={duel.loser?.avatar ?? null} name={duel.loser?.name || duel.challenged.name} size={38} />
              <Text className="text-xs font-bold text-slate-400 mt-1 text-center" numberOfLines={1}>
                {duel.isDraw ? duel.challenged.name : (duel.loser?.name || '?')}
              </Text>
              {!duel.isDraw && (
                <View className="bg-red-50 border border-red-100 rounded-full px-2 py-0.5 mt-1">
                  <Text className="text-red-400 text-[9px] font-black">LOST</Text>
                </View>
              )}
            </View>
          </View>

          {/* Time */}
          <Text className="text-[10px] text-slate-400 text-center font-medium">
            {timeAgo(duel.createdAt)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
