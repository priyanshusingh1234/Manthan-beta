import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, ScrollView, Platform } from 'react-native';
import { User, Building2, GraduationCap, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';

export default function CompleteProfileModal() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes just like Web
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkUser(session.user);
      } else {
        setVisible(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async (userObj?: any) => {
    try {
      let user = userObj;
      if (!user) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      const meta = user.user_metadata || {};

      if (!meta.has_completed_onboarding) {
        setUsername(meta.username || '');
        setFullName(meta.fullName || meta.name || '');
        setSchool(meta.school || '');
        setClassGrade(meta.classGrade || '');
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sanitizeUsernameInput = (input: string) => {
    return input.toLowerCase().replace(/[^a-z0-9_]/g, '');
  };

  const handleUsernameChange = (text: string) => {
    setUsername(sanitizeUsernameInput(text));
    setError('');
  };

  const handleSubmit = async () => {
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!fullName) {
      setError('Please fill in your full name');
      return;
    }
    const isTeacher = currentUser?.user_metadata?.isTeacher === true || currentUser?.user_metadata?.is_teacher === true;
    if (!isTeacher && !classGrade) {
      setError('Please select your class grade');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Check username unique
      if (username !== currentUser?.user_metadata?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();
          
        if (existingUser && existingUser.id !== currentUser.id) {
          setError('Username is already taken. Please choose a different username.');
          setSubmitting(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username,
          fullName,
          full_name: fullName,
          classGrade: isTeacher ? (currentUser?.user_metadata?.classGrade || '') : classGrade,
          school,
          ageConfirmed: true,
          has_completed_onboarding: true,
          username_updates: []
        }
      });

      if (updateError) throw updateError;

      // Sync to backend DB using the profile/sync endpoint or wait for trigger
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          // If you have a proxy or API URL, you might fetch it here.
          // Since we are in RN, we rely on the DB trigger `handle_new_user` which already handles Google logins.
          // But to be safe, we will call upsert on `profiles` manually since the trigger only runs on INSERT
          // and might have failed if required fields were missing initially.
          await supabase.from('profiles').upsert({
            id: currentUser.id,
            username,
            full_name: fullName,
            school,
            class_grade: classGrade
          });
        } catch (e) {
          console.warn("Manual profile sync failed", e);
        }
      }

      setVisible(false);
      // Optional: Navigate or refresh
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !visible) return null;

  const isPreFilled = !!currentUser?.user_metadata?.username;
  const isClassLocked = !!currentUser?.user_metadata?.classGrade;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={false}
      onRequestClose={() => {
        // Prevent dismissal on Android back button to make it truly mandatory
      }}
    >
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950 px-6 py-12">
        <View className="items-center mt-10 mb-8">
          <View className="w-16 h-16 bg-indigo-500 rounded-3xl items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
            <Sparkles size={32} color="white" />
          </View>
          
          <Text className="text-3xl font-black italic uppercase tracking-tighter text-center text-slate-900 dark:text-white mb-2">
            {isPreFilled ? "Identity Verified" : "Join the Ranks"}
          </Text>
          <Text className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            {isPreFilled ? "Welcome! Here are the details you provided:" : "Welcome to the Arena. Forging your identity..."}
          </Text>
        </View>

        <View className="space-y-4">
          <View className="relative justify-center">
            <View className="absolute left-3 z-10">
              <User size={20} color="#94a3b8" />
            </View>
            <TextInput
              editable={!isPreFilled}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Username (e.g. shadowwarrior)"
              className={`w-full pl-10 pr-4 py-4 border-2 rounded-2xl text-[15px] font-bold ${isPreFilled ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
              autoCapitalize="none"
            />
          </View>

          <View className="relative justify-center mt-4">
            <View className="absolute left-3 z-10">
              <User size={20} color="#94a3b8" />
            </View>
            <TextInput
              editable={!isPreFilled}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              className={`w-full pl-10 pr-4 py-4 border-2 rounded-2xl text-[15px] font-bold ${isPreFilled ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
            />
          </View>

          <View className="relative justify-center mt-4">
            <View className="absolute left-3 z-10">
              <Building2 size={20} color="#94a3b8" />
            </View>
            <TextInput
              value={school}
              onChangeText={setSchool}
              placeholder="School Name (Optional)"
              className="w-full pl-10 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white"
            />
          </View>

          {!(currentUser?.user_metadata?.isTeacher || currentUser?.user_metadata?.is_teacher) && (
            <View className="relative justify-center mt-4">
              <View className="absolute left-3 z-10">
                <GraduationCap size={20} color="#94a3b8" />
              </View>
              <TextInput
                editable={!isClassLocked}
                value={classGrade}
                onChangeText={setClassGrade}
                placeholder="Class Grade (e.g. 10)"
                keyboardType="number-pad"
                className={`w-full pl-10 pr-4 py-4 border-2 rounded-2xl text-[15px] font-bold ${isClassLocked ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
              />
            </View>
          )}

          {error ? (
            <View className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl mt-4">
              <Text className="text-red-500 dark:text-red-400 text-center font-bold text-xs">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="w-full py-4 mt-6 bg-indigo-600 rounded-2xl shadow-xl flex justify-center items-center"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-sm uppercase tracking-widest">Confirm & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}
