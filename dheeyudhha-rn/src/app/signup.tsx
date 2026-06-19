import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react-native';
import Logo from '@/components/ui/Logo';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    if (!username || !fullName || !email || !password) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username,
          fullName,
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center mt-12 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Logo width={40} />
      </View>

      <Text className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2 uppercase">
        Enter The War Room.
      </Text>
      <Text className="text-sm font-medium text-slate-500 mb-8">
        Create your account and forge your legacy.
      </Text>

      {error ? <Text className="text-red-500 mb-4 font-bold">{error}</Text> : null}

      <View className="space-y-4">
        {/* Username */}
        <View className="relative justify-center">
          <View className="absolute left-3 z-10">
            <User size={20} color="#94a3b8" />
          </View>
          <TextInput
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Full Name */}
        <View className="relative justify-center mt-4">
          <View className="absolute left-3 z-10">
            <User size={20} color="#94a3b8" />
          </View>
          <TextInput
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Email */}
        <View className="relative justify-center mt-4">
          <View className="absolute left-3 z-10">
            <Mail size={20} color="#94a3b8" />
          </View>
          <TextInput
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View className="relative justify-center mt-4">
          <View className="absolute left-3 z-10">
            <Lock size={20} color="#94a3b8" />
          </View>
          <TextInput
            className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            className="absolute right-3 z-10" 
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="mt-8 bg-indigo-600 py-4 rounded-xl shadow-lg flex-row justify-center items-center"
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-black uppercase tracking-widest text-sm">Join the Battle</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="px-4 text-slate-400 text-sm">Or sign up with</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        <TouchableOpacity 
          className="flex-row items-center justify-center py-3.5 border border-slate-300 rounded-xl bg-white mb-6"
          onPress={async () => {
            if (Platform.OS === 'web') {
              supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
            } else {
              try {
                GoogleSignin.configure({
                  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // Needed for Firebase/Supabase
                });
                await GoogleSignin.hasPlayServices();
                const userInfo = await GoogleSignin.signIn();
                
                if (userInfo.data?.idToken) {
                  const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                  });
                  if (error) throw error;
                  router.replace('/(tabs)');
                }
              } catch (error: any) {
                setError(error.message);
              }
            }
          }}
        >
          <Text className="text-slate-700 font-bold">Continue with Google</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-2 mb-12">
          <Text className="text-slate-500 font-medium">Already a challenger? </Text>
          <Link href="/login">
            <Text className="text-indigo-600 font-bold">Sign in</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
