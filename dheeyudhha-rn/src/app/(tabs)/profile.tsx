import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, Target, Zap, Star, LogOut, Settings, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setProfile({
        name: dbProfile?.full_name || user.user_metadata?.fullName || 'Guest',
        username: dbProfile?.username || user.user_metadata?.username || '',
        avatar: dbProfile?.avatar_url || user.user_metadata?.avatar_url || null,
        banner: user.user_metadata?.banner_url || null,
        school: dbProfile?.school || user.user_metadata?.school || '',
        points: Math.max(Number(user.user_metadata?.totalPoints) || 0, Number(dbProfile?.total_points) || 0),
        xp: Number(dbProfile?.xp) || Number(user.user_metadata?.xp) || 0,
        battlesWon: Number(user.user_metadata?.battlesWon) || 0,
        battlesAttempted: Number(user.user_metadata?.battlesAttempted) || 0,
      });
    } catch (error) {
      console.error('Error loading profile', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!userId) return;
    try {
      setUploading(true);
      const res = await fetch(uri);
      const blob = await res.blob();
      const path = `avatars/${userId}/avatar_${Date.now()}.jpg`;

      const { data, error } = await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/jpeg',
      });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl, avatar_path: path }
      });

      setProfile((prev: any) => ({ ...prev, avatar: publicUrl }));
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const winRate = profile?.battlesAttempted > 0 ? Math.round((profile.battlesWon / profile.battlesAttempted) * 100) : 0;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Banner */}
      <View className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
        {profile?.banner && (
          <Image source={{ uri: profile.banner }} className="absolute inset-0 w-full h-full opacity-90" />
        )}
      </View>
      
      {/* Avatar & Basic Info */}
      <View className="px-6 relative">
        <View className="flex-row justify-between items-start -mt-12">
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden items-center justify-center">
              {uploading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} className="w-full h-full object-cover" />
              ) : (
                <Text className="text-4xl">🧠</Text>
              )}
              <View className="absolute bottom-0 w-full h-6 bg-black/50 items-center justify-center">
                <Camera size={12} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          
          <View className="flex-row gap-2 mt-16">
            <TouchableOpacity className="bg-white border border-slate-200 p-2.5 rounded-full shadow-sm">
              <Settings size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleLogout}
              className="bg-white border border-slate-200 p-2.5 rounded-full shadow-sm"
            >
              <LogOut size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-2xl font-black text-slate-900">{profile?.name}</Text>
          <Text className="text-slate-500 font-medium">@{profile?.username || 'user'}</Text>
          {profile?.school ? (
            <Text className="text-slate-500 text-sm mt-1">📍 {profile.school}</Text>
          ) : null}
        </View>

        {/* Stats Grid */}
        <View className="mt-8 flex-row flex-wrap justify-between gap-y-4">
          <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 items-center">
            <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mb-2">
              <Trophy size={20} color="#eab308" />
            </View>
            <Text className="text-2xl font-black text-slate-900">{profile?.battlesWon}</Text>
            <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">Battles Won</Text>
          </View>

          <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 items-center">
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mb-2">
              <Target size={20} color="#22c55e" />
            </View>
            <Text className="text-2xl font-black text-slate-900">{winRate}%</Text>
            <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">Win Rate</Text>
          </View>

          <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 items-center">
            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mb-2">
              <Zap size={20} color="#f97316" />
            </View>
            <Text className="text-2xl font-black text-slate-900">{profile?.battlesAttempted}</Text>
            <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">Attempted</Text>
          </View>

          <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 items-center">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mb-2">
              <Star size={20} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-black text-slate-900">{profile?.points}</Text>
            <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Points</Text>
          </View>
        </View>

        <View className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 items-center">
          <Text className="text-indigo-800 font-bold text-center mb-2">XP Progress</Text>
          <View className="w-full h-4 bg-white rounded-full overflow-hidden border border-indigo-100">
            <View 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
              style={{ width: `${Math.min((profile?.xp / 1000) * 100, 100)}%` }} 
            />
          </View>
          <Text className="text-indigo-600 text-xs font-black mt-2">{profile?.xp} / 1000 XP</Text>
        </View>
      </View>
    </ScrollView>
  );
}
