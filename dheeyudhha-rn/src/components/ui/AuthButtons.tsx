import { Link } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
// We will create the supabase client later, stubbing for now
// import { supabase } from '@/lib/supabaseClient';
// import type { User } from '@supabase/supabase-js';

export default function AuthButtons() {
  // Stubbed user state for now until Supabase is ported
  const user = null;

  if (user) return null;

  return (
    <View className="flex-row gap-3 justify-center mt-6">
      <Link href="/login" asChild>
        <TouchableOpacity className="px-4 py-2 rounded-xl bg-white shadow border border-gray-100">
          <Text className="text-blue-600 font-semibold text-center">Sign in</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/signup" asChild>
        <TouchableOpacity className="px-4 py-2 rounded-xl bg-blue-600 shadow">
          <Text className="text-white font-semibold text-center">Sign up</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
