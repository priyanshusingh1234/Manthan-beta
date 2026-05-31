import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type ProfileSummary = {
  username: string | null;
  full_name: string | null;
  points: number | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const authUser = data.user ?? null;
      setUser(authUser);

      if (!authUser) {
        router.replace('/login');
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, points')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setProfile(profileRow ?? null);
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load account data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>React Native Migration - Phase 1</Text>
      <Text style={styles.subheading}>
        Auth and profile fetch now run natively with the same Supabase database.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? 'Unknown'}</Text>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{profile?.username ?? 'Not set'}</Text>
        <Text style={styles.label}>Full name</Text>
        <Text style={styles.value}>{profile?.full_name ?? 'Not set'}</Text>
        <Text style={styles.label}>Points</Text>
        <Text style={styles.value}>{profile?.points ?? 0}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Pressable onPress={signOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    marginBottom: 18,
    padding: 18,
  },
  error: {
    color: '#dc2626',
    marginTop: 8,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  heading: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  loaderWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  subheading: {
    color: '#334155',
    marginBottom: 16,
  },
  value: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '600',
  },
});
