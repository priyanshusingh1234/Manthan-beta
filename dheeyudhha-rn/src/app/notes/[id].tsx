import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NotesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: { session } } = await supabase.auth.getSession();
      
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const postRes = await fetch(`${API_URL}/api/posts/${id}`, {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}
        });

        if (!postRes.ok) throw new Error("Post not found");
        const postData = await postRes.json();
        setPost(postData);
      } catch (err: any) {
        console.error("Failed to fetch data", err);
        setError(err.message || "Failed to load note.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (error) {
    return (
      <View className="flex-1 bg-white dark:bg-[#09090b] items-center justify-center px-6">
        <Text className="mt-6 text-rose-500 font-bold tracking-wider text-sm text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm">
          <Text className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-[0.2em]">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !post) {
    return (
      <View className="flex-1 bg-white dark:bg-[#09090b] items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-6 text-slate-400 font-bold tracking-[0.2em] uppercase text-xs">Loading Note</Text>
      </View>
    );
  }

  const rawPdfUrl = post?.document_url || post?.documentUrl;
  const remotePdfUri = rawPdfUrl ? encodeURI(rawPdfUrl) : '';

  return (
    <View className="flex-1 bg-[#f8fafc] dark:bg-[#09090b]">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View className="absolute inset-0 z-0 pt-20">
        {!remotePdfUri ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-slate-500 font-bold tracking-widest text-center">
              No Document URL found.{"\n"}Make sure Vercel finished deploying!
            </Text>
          </View>
        ) : (
          <WebView
            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(remotePdfUri)}` }}
            style={{ flex: 1, width: SCREEN_WIDTH, backgroundColor: 'transparent' }}
            startInLoadingState={true}
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center bg-[#f8fafc] dark:bg-[#09090b]">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-4 text-slate-400 font-bold tracking-[0.2em] uppercase text-xs">Loading Secure Viewer...</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Floating Header */}
      <View
        className="absolute top-0 left-0 right-0 z-20 flex-row items-center px-4 pb-4 bg-white/95 dark:bg-[#09090b]/95 border-b border-slate-200/50 dark:border-white/5"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"
        >
          <ArrowLeft size={20} color={isDark ? "#fff" : "#0f172a"} />
        </TouchableOpacity>

        <View className="flex-1 ml-4 justify-center">
          <Text className="font-black text-[16px] text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>
            {post.author?.name || 'Scholar'}'s Note
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Read Only</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
