import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react-native';

interface RepostModalProps {
  post: any;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
}

export default function RepostModal({ post, visible, onClose, onSuccess, isDark }: RepostModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          repost_id: post.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to repost');
      }

      setContent('');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorName = post.author?.name || post.author?.full_name || 'User';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-slate-950 p-4 pt-10">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Repost</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={isSubmitting || !content.trim()} 
            className={`px-4 py-1.5 rounded-full ${!content.trim() ? 'bg-slate-300 dark:bg-slate-800' : 'bg-indigo-600'}`}
          >
            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold">Post</Text>}
          </TouchableOpacity>
        </View>

        <TextInput
          className="text-lg text-slate-900 dark:text-white mb-4"
          placeholder="Add your thoughts..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        {/* Repost Preview */}
        <View className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900">
          <View className="flex-row items-center mb-2">
            {post.author?.avatar_url && (
              <Image source={{ uri: post.author.avatar_url }} className="w-6 h-6 rounded-full mr-2" />
            )}
            <Text className="font-bold text-sm text-slate-900 dark:text-slate-100">{authorName}</Text>
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400" numberOfLines={3}>
            {post.content || 'Media Post'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
