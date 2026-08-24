import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Keyboard } from 'react-native';
import { Bot, X, Send, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITutorChatProps {
  visible: boolean;
  onClose: () => void;
  questionId: string;
  userId?: string | null;
}

export default function AITutorChat({ visible, onClose, questionId, userId }: AITutorChatProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI Tutor. I'm here to help you understand this question step-by-step. Where are you getting stuck?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const res = await fetch(`${API_URL}/api/ai-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Network error');

      // Since RN fetch streaming is tricky without polyfills, we await the full streamed text
      const text = await res.text();
      
      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Oops, I'm having trouble connecting right now. Try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string, role: string) => {
    // Check if there is a [CHART] tag
    const chartRegex = /\[CHART\]([\s\S]*?)\[\/CHART\]/g;
    const match = chartRegex.exec(content);

    if (match) {
      const textBefore = content.substring(0, match.index).trim();
      const textAfter = content.substring(match.index + match[0].length).trim();
      let chartData = null;
      try {
        chartData = JSON.parse(match[1].trim());
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }

      return (
        <View>
          {!!textBefore && <Text className={`text-base mb-3 ${role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{textBefore}</Text>}
          
          {chartData && chartData.data && (
            <View className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-700 my-2 shadow-sm w-full min-w-[200px]">
              {chartData.title && <Text className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-center">{chartData.title}</Text>}
              {chartData.data.map((item: any, i: number) => {
                // Determine max value for relative bar width
                const maxVal = Math.max(...chartData.data.map((d: any) => d.value), 1);
                const widthPct = Math.min((item.value / maxVal) * 100, 100);
                return (
                  <View key={i} className="mb-2">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</Text>
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}</Text>
                    </View>
                    <View className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full">
                      <View 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${widthPct}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {!!textAfter && <Text className={`text-base mt-2 ${role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{textAfter}</Text>}
        </View>
      );
    }

    return (
      <Text className={`text-base ${role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
        {content}
      </Text>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View 
            className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden shadow-2xl border-t border-slate-200 dark:border-slate-800"
            style={{ height: '80%', paddingBottom: insets.bottom }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-900/20">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center">
                  <Bot size={20} color="white" />
                </View>
                <View>
                  <Text className="font-black text-lg text-slate-800 dark:text-slate-100">AI Tutor</Text>
                  <Text className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Powered by Teacher's Logic</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2 bg-slate-200/50 dark:bg-slate-800 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView 
              ref={scrollViewRef}
              className="flex-1 p-4"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {messages.map((msg, idx) => (
                <View 
                  key={idx} 
                  className={`flex-row mb-4 max-w-[85%] ${msg.role === 'user' ? 'self-end justify-end' : 'self-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <View className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center mr-2 mt-1">
                      <Bot size={12} color="#4f46e5" />
                    </View>
                  )}
                  
                  <View 
                    className={`rounded-2xl p-3 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 rounded-tr-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {renderMessageContent(msg.content, msg.role)}
                  </View>
                  
                  {msg.role === 'user' && (
                    <View className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center ml-2 mt-1">
                      <User size={12} color="#64748b" />
                    </View>
                  )}
                </View>
              ))}
              
              {isLoading && (
                <View className="flex-row items-center self-start mb-4">
                   <View className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center mr-2">
                      <Bot size={12} color="#4f46e5" />
                    </View>
                    <View className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 border border-slate-200 dark:border-slate-700">
                      <ActivityIndicator size="small" color="#4f46e5" />
                    </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row items-end gap-2">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask a question..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={300}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl px-4 py-3 max-h-32 text-base border border-slate-200 dark:border-slate-700"
              />
              <TouchableOpacity 
                onPress={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  !input.trim() || isLoading ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600'
                }`}
              >
                <Send size={20} color={!input.trim() || isLoading ? '#94a3b8' : 'white'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
