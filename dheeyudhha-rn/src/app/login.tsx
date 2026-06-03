import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '@/components/ui/Logo';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('dheeyudha_remember_email').then(saved => {
      if (saved) setEmail(saved);
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      await AsyncStorage.setItem('dheeyudha_remember_email', email);
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6" style={{ paddingTop: insets.top }}>
      <View className="items-center mt-12 mb-8">
        <Logo width={80} showTagline={true} />
      </View>
      
      <Text className="text-2xl font-extrabold text-slate-900 text-center mb-2">Welcome back, Brain!</Text>
      <Text className="text-slate-600 text-center mb-8">Ready to continue your knowledge battle?</Text>

      {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}

      <View className="space-y-4">
        {/* Email */}
        <View className="relative justify-center">
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
          className="mt-6 bg-blue-600 py-3.5 rounded-xl shadow-lg"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-base">Sign in to Dheeyudha</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="px-4 text-slate-400 text-sm">Or continue with</Text>
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
                  webClientId: 'YOUR_WEB_CLIENT_ID_HERE', // Needed for Firebase/Supabase
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

        <View className="flex-row justify-center">
          <Text className="text-slate-600">Don't have an account? </Text>
          <Link href="/signup">
            <Text className="text-blue-600 font-bold">Sign up</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
