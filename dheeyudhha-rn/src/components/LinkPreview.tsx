import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { FileText, HelpCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const DOMAIN_WITH_OPTIONAL_PATH_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+(?:\/.*)?$/;
const MAX_PREVIEW_LENGTH = 80;

export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchMeta() {
      try {
        const trimmedUrl = url.trim();
        let path = '';
        
        if (trimmedUrl.startsWith('/')) {
          path = trimmedUrl;
        } else if (/^https?:\/\//i.test(trimmedUrl)) {
          // Extract pathname manually to avoid URL constructor issues on React Native
          const match = trimmedUrl.match(/^https?:\/\/[^\/]+(\/.*)$/i);
          path = match ? match[1] : '';
        } else if (DOMAIN_WITH_OPTIONAL_PATH_REGEX.test(trimmedUrl)) {
          const match = trimmedUrl.match(/^[^\/]+(\/.*)$/i);
          path = match ? match[1] : '';
        } else {
          path = trimmedUrl;
        }

        const segments = path.split('/').filter(Boolean);
        const postIdx = segments.indexOf('posts');
        const questionIdx = segments.indexOf('questions');

        if (postIdx !== -1) {
          const postId = segments[postIdx + 1];
          if (!postId) throw new Error('Invalid post ID');

          const { data: post, error } = await supabase
            .from('posts')
            .select('content, author_id, image_url')
            .eq('id', postId)
            .single();

          if (error || !post) throw error;

          let authorName = 'Scholar';
          let authorAvatar = null;
          
          if (post.author_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', post.author_id)
                .maybeSingle();
                
            if (profile) {
              authorName = profile.full_name || 'Scholar';
              authorAvatar = profile.avatar_url;
            }
          }

          setData({
            type: 'post',
            title: 'Community Post',
            description: post.content
              ? `${post.content.slice(0, MAX_PREVIEW_LENGTH)}${post.content.length > MAX_PREVIEW_LENGTH ? '...' : ''}`
              : 'Open this community post.',
            image: post.image_url,
            authorName,
            authorAvatar,
            link: `/posts/${postId}`
          });
        } else if (questionIdx !== -1) {
          const qId = segments[questionIdx + 1];
          if (!qId) throw new Error('Invalid question ID');

          const { data: q, error } = await supabase
            .from('questions')
            .select('title, subject, points, image_url, image_path')
            .eq('id', qId)
            .single();

          if (error || !q) throw error;

          let qImage = q.image_url;
          if (!qImage && q.image_path) {
            const { data: publicUrlData } = supabase.storage.from('question-images').getPublicUrl(q.image_path);
            qImage = publicUrlData.publicUrl;
          }

          setData({
            type: 'question',
            title: q.title || 'Question Challenge',
            description: `Subject: ${q.subject} • ${q.points} Points`,
            image: qImage,
            link: `/questions/${qId}`
          });
        } else {
          setError(true); // not an internal URL we care about
        }
      } catch (err) {
        console.error("LinkPreview error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, [url]);

  if (error) return null; // Fallback to raw text link in parent if not recognized

  if (loading) {
    return (
      <View className="flex-row items-center gap-2 p-3 mt-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <ActivityIndicator size="small" color="#94a3b8" />
        <Text className="text-xs text-slate-500">Loading preview...</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push(data.link as any)}
      className="mt-2 w-full max-w-[280px]"
    >
      <View className="flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        {data.image && (
          <View className="w-full h-32 relative bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
            <Image source={{ uri: data.image }} className="w-full h-full" resizeMode="cover" />
          </View>
        )}
        <View className="p-3">
          <View className="flex-row items-center gap-1.5 mb-1.5">
            {data.type === 'post' ? <FileText size={14} color="#6366f1" /> : <HelpCircle size={14} color="#f97316" />}
            <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {data.type === 'post' ? 'Community Post' : 'Challenge'}
            </Text>
          </View>
          <Text className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1" numberOfLines={1}>
            {data.title}
          </Text>
          <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed" numberOfLines={2}>
            {data.description}
          </Text>
          {data.authorName && (
            <View className="flex-row items-center gap-1.5 mt-2.5">
              {data.authorAvatar ? (
                <Image source={{ uri: data.authorAvatar }} className="rounded-full w-4 h-4 bg-slate-200" />
              ) : (
                <View className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center">
                  <Text className="text-[8px] font-bold text-indigo-600">{data.authorName[0]}</Text>
                </View>
              )}
              <Text className="text-[10px] font-semibold text-slate-600 dark:text-slate-300" numberOfLines={1}>
                {data.authorName}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
