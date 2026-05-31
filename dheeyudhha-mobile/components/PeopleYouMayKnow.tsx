import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'expo-router';
import { Users, X, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

interface Suggestion {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  isTeacher: boolean;
  reason: string;
  totalPoints: number;
}

export default function PeopleYouMayKnow() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const d = localStorage.getItem('dismissed_suggestions');
      return new Set(d ? JSON.parse(d) : []);
    } catch { return new Set(); }
  });
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        // Pre-load who I already follow so buttons show correct state
        const { data: myFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', session.user.id);
        const alreadyFollowing = new Set((myFollows || []).map((f: any) => f.following_id));
        setFollowing(alreadyFollowing);

        const res = await fetch('/api/suggestions', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        // Filter out anyone we already follow from what the API returned
        const filtered = (data.suggestions || []).filter((s: Suggestion) => !alreadyFollowing.has(s.id));
        setSuggestions(filtered);
      } catch (err) {
        console.error('[PeopleYouMayKnow]', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFollow = async (suggestion: Suggestion) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      if (following.has(suggestion.id)) return;
      setFollowing(prev => new Set([...prev, suggestion.id]));

      await supabase.from('follows').upsert({
        follower_id: session.user.id,
        following_id: suggestion.id
      }, { onConflict: 'follower_id,following_id' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem('dismissed_suggestions', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const visible = suggestions.filter(s => !dismissed.has(s.id));

  if (loading) return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <View className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 animate-pulse" />
      <View className="flex gap-3 flex-row">
        {[...Array(3)].map((_, i) => (
          <View key={i} className="w-32 shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-800 h-44 animate-pulse" />
        ))}
      </View>
    </View>
  );

  if (!visible.length) return null;

  return (
    <View className="mb-4 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header */}
      <View className="flex items-center justify-between px-4 pt-4 pb-2 flex-row">
        <View className="flex items-center gap-2 flex-row">
          <View className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-row">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </View>
          <Text className="font-black text-[15px] text-slate-900 dark:text-white">People You May Know</Text>
        </View>
        <Link href="/search" className="flex items-center gap-0.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex-row">
          See All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </View>

      {/* Horizontal scroll cards */}
      <View
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 scrollbar-none flex-row"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {visible.map(suggestion => (
          <View
            key={suggestion.id}
            className="relative shrink-0 w-[130px] rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center p-3 gap-2 group"
          >
            {/* Dismiss */}
            <View
              onPress={() => handleDismiss(suggestion.id)}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10 flex-row"
            >
              <X className="w-2.5 h-2.5" />
            </View>

            {/* Avatar */}
            <Link href={`/${suggestion.isTeacher ? 'teacher' : 'user'}/${suggestion.username || suggestion.id}`}>
              <View className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/20 border-2 border-white dark:border-slate-700 shadow-md">
                {suggestion.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image src={suggestion.avatar} alt={suggestion.name} className="w-full h-full object-cover" />
                ) : (
                  <View className="w-full h-full flex items-center justify-center text-xl font-black text-indigo-500 dark:text-indigo-400 flex-row">
                    {suggestion.name[0]?.toUpperCase()}
                  </View>
                )}
              </View>
            </Link>

            {/* Info */}
            <View className="text-center w-full">
              <Text className="font-bold text-[12px] text-slate-900 dark:text-white truncate leading-tight">{suggestion.name}</Text>
              {suggestion.username && (
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 truncate">@{suggestion.username}</Text>
              )}
              <Text className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">{suggestion.reason}</Text>
            </View>

            {/* Follow Button */}
            <View
              onPress={() => handleFollow(suggestion)}
              className={`w-full py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                following.has(suggestion.id)
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  : 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-700'
              }`}
            >
              {following.has(suggestion.id) ? '✓ Following' : 'Follow'}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
