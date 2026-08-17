import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Settings, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabaseClient';

const API_URL = 'https://manthan-beta-c975.vercel.app';

export default function EditSchoolScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [usi, setUsi] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCurrentSchool();
  }, []);

  const fetchCurrentSchool = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/squad`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data?.school) {
          setSchoolName(data.school.name || '');
          setDescription(data.school.description || '');
          setIsPrivate(data.school.is_private || false);
          setUsi(data.school.usi || '');
        }
      }
    } catch (e) {
      console.error('Failed to fetch school details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (schoolName.trim().length < 3) {
      setErrorMsg('School name must be at least 3 characters.');
      return;
    }
    
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Authentication error. Please login again.');
        return;
      }

      const res = await fetch(`${API_URL}/api/schools/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: schoolName.trim(),
          description: description.trim(),
          isPrivate
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh session just in case user metadata was manually synced
        await supabase.auth.refreshSession();
        router.back();
      } else {
        setErrorMsg(data.error || 'Failed to update faction details.');
      }
    } catch (e) {
      setErrorMsg('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

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
        <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Faction Settings</Text>
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
          <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4 border border-indigo-200 dark:border-indigo-800">
            <Settings size={36} color="#4f46e5" />
          </View>
          <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">
            Edit Your Faction
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-6">
          <View>
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
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2 ml-1 leading-relaxed">
              Changing your faction's name will automatically update the profile for all your current members.
            </Text>
          </View>

          <View>
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="What makes your school the best?"
              placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-slate-100 font-medium text-base h-32"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between">
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

          {usi ? (
            <View className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm mt-2">
              <Text className="text-sm font-black text-amber-800 dark:text-amber-500 mb-1">
                Unique School ID (USI)
              </Text>
              <Text className="text-xs text-amber-700/80 dark:text-amber-400/80 mb-3 leading-relaxed">
                This is your confidential ID used for B2B features and integrations. Keep it secure and only share it with trusted partners.
              </Text>
              <TextInput
                value={usi}
                editable={false}
                selectTextOnFocus={true}
                className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3 text-amber-900 dark:text-amber-100 font-mono font-bold text-center tracking-widest text-lg"
              />
            </View>
          ) : null}
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
          onPress={handleUpdate}
          disabled={submitting || schoolName.trim().length < 3}
          className={`mt-6 py-4 rounded-2xl shadow-md flex-row items-center justify-center ${
            schoolName.trim().length < 3 || submitting
              ? 'bg-slate-300 dark:bg-slate-800 shadow-none'
              : 'bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/30'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className={`font-bold text-lg ${
              schoolName.trim().length < 3 ? 'text-slate-500 dark:text-slate-400' : 'text-white'
            }`}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
