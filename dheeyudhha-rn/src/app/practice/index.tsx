import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight, BookOpen, Search, X } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  'Science':   { bg: '#eff6ff', icon: '#3b82f6' },
  'Maths':     { bg: '#f0fdf4', icon: '#22c55e' },
  'SST':       { bg: '#fff7ed', icon: '#f97316' },
  'English':   { bg: '#fdf4ff', icon: '#a855f7' },
  'Hindi':     { bg: '#fff1f2', icon: '#f43f5e' },
  'Hindi Gr':  { bg: '#fff1f2', icon: '#f43f5e' },
};

export default function PracticeIndexScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<{ title: string; data: string[] }[]>([]);
  const [filtered, setFiltered] = useState<{ title: string; data: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [classGrade, setClassGrade] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`${API_URL}/api/practice/chapters`, { headers });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setClassGrade(data.classGrade);

        const secs = Object.entries(data.categories as Record<string, string[]>).map(
          ([title, chapters]) => ({ title, data: chapters })
        );
        setSections(secs);
        setFiltered(secs);
      } catch (e: any) {
        setError(e.message || 'Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(sections);
      return;
    }
    const q = text.toLowerCase();
    const result = sections
      .map(sec => ({ ...sec, data: sec.data.filter(ch => ch.toLowerCase().includes(q)) }))
      .filter(sec => sec.data.length > 0);
    setFiltered(result);
  }, [sections]);

  const goToChapter = (chapter: string) => {
    router.push({ pathname: '/practice/questions' as any, params: { chapter } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: '#0f172a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
            Practice Mode
          </Text>
          {classGrade && (
            <View style={{ backgroundColor: '#4f46e5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Class {classGrade}</Text>
            </View>
          )}
        </View>
        <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '500' }}>
          Choose a chapter to start practising all questions
        </Text>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          marginTop: 16, backgroundColor: '#1e293b', borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#334155',
        }}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' }}
            placeholder="Search chapters..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ color: '#64748b', marginTop: 12, fontWeight: '600' }}>Loading chapters...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>😕</Text>
          <Text style={{ color: '#ef4444', fontWeight: '700', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
          <Text style={{ color: '#64748b', fontWeight: '700' }}>No chapters found</Text>
        </View>
      ) : (
        <SectionList
          sections={filtered}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => {
            const colors = CATEGORY_COLORS[section.title] || { bg: '#f1f5f9', icon: '#64748b' };
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10, gap: 8 }}>
                <View style={{ width: 4, height: 20, backgroundColor: colors.icon, borderRadius: 2 }} />
                <Text style={{ color: '#e2e8f0', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 }}>
                  {section.title}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#1e293b', marginLeft: 4 }} />
                <Text style={{ color: '#475569', fontSize: 12, fontWeight: '700' }}>
                  {section.data.length} chapters
                </Text>
              </View>
            );
          }}
          renderItem={({ item: chapter, section }) => {
            const colors = CATEGORY_COLORS[section.title] || { bg: '#f1f5f9', icon: '#64748b' };
            return (
              <TouchableOpacity
                onPress={() => goToChapter(chapter)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#1e293b', borderRadius: 16,
                  padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: '#334155',
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <BookOpen size={20} color={colors.icon} />
                </View>
                <Text style={{ flex: 1, color: '#f1f5f9', fontWeight: '700', fontSize: 14, lineHeight: 20 }}>
                  {chapter}
                </Text>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
