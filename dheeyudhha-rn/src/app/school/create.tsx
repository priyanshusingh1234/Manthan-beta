import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabaseClient';

const API_URL = 'https://manthan-beta-c975.vercel.app';

export default function CreateSchoolScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [schoolName, setSchoolName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async () => {
    if (schoolName.trim().length < 3) {
      setErrorMsg('School name must be at least 3 characters.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Authentication error. Please login again.');
        return;
      }

      const res = await fetch(`${API_URL}/api/schools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: schoolName.trim(), isPrivate })
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh session to update user metadata (is_general, school, etc.)
        await supabase.auth.refreshSession();
        // Go back to the dashboard which will now reload and show the new school
        router.back();
      } else {
        // Display the specific error from the API (profanity, duplicate branch, etc.)
        setErrorMsg(data.error || 'Failed to create faction.');
      }
    } catch (e) {
      setErrorMsg('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View 
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4 shadow-sm" 
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        >
          <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Create Faction</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ 
          padding: 20, 
          paddingBottom: Math.max(insets.bottom, 40) 
        }}
      >
        <View className="mb-6 items-center mt-4">
          <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck size={36} color="#10b981" />
          </View>
          <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">
            Lead Your School
          </Text>
          <Text className="text-slate-500 text-center px-4 leading-relaxed">
            Create a new faction and become its General. Invite your classmates to join and dominate the leaderboards.
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
            Faction Name
          </Text>
          <TextInput
            value={schoolName}
            onChangeText={(text) => {
              setSchoolName(text);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="e.g. DPS Delhi - Vasant Kunj"
            placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-slate-100 font-bold text-base"
            autoCapitalize="words"
          />
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2 ml-1">
            If your school already exists, please append your specific branch name (e.g. "Branch Name").
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 mt-4 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Private Faction</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Require new students to send a join request for your approval.
            </Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: isDarkMode ? '#334155' : '#e2e8f0', true: '#10b981' }}
            thumbColor={'#ffffff'}
          />
        </View>

        {errorMsg ? (
          <View className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 flex-row items-start">
            <AlertCircle size={20} color={isDarkMode ? '#f87171' : '#dc2626'} style={{ marginTop: 2 }} />
            <Text className="flex-1 ml-3 text-red-700 dark:text-red-400 font-medium leading-relaxed">
              {errorMsg}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCreate}
          disabled={loading || schoolName.trim().length < 3}
          className={`mt-6 py-4 rounded-2xl shadow-md flex-row items-center justify-center ${
            schoolName.trim().length < 3 || loading
              ? 'bg-slate-300 dark:bg-slate-800 shadow-none'
              : 'bg-emerald-600 dark:bg-emerald-500 shadow-emerald-500/30'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className={`font-bold text-lg ${
              schoolName.trim().length < 3 ? 'text-slate-500 dark:text-slate-400' : 'text-white'
            }`}>
              Establish Faction
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
