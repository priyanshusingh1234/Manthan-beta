import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all fields before submitting.');
      return;
    }

    // Show success message
    setShowSuccess(true);

    // Clear form
    setName('');
    setEmail('');
    setMessage('');

    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : insets.top }}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-2 text-slate-900 dark:text-white">Contact Us</Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
            Get in touch
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-8 text-base">
            Have questions about Dheeyudha? Want to partner with us or report an issue? We'd love to hear from you! Fill out the form below and we'll get back to you soon.
          </Text>

          {showSuccess && (
            <View className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex-row items-center gap-3">
              <CheckCircle2 size={20} color="#10b981" />
              <Text className="text-emerald-800 dark:text-emerald-300 font-semibold flex-1">
                Thank you for your message! We'll get back to you soon.
              </Text>
            </View>
          )}

          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <View className="mb-4">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-base"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-base"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what's on your mind..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-base min-h-[120px]"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              className="w-full bg-indigo-600 active:bg-indigo-700 rounded-xl py-4 items-center justify-center flex-row gap-2 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Text className="text-white font-bold text-base">Send Message</Text>
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
