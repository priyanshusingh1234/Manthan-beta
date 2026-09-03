import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, TextInput, 
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Sparkles, X, MessageCircle, Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import Constants from 'expo-constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

type Message = {
    id: string;
    role: 'user' | 'model';
    content: string;
};

export default function FloatingAIHelper() {
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Fetch History when modal opens
    useEffect(() => {
        if (isVisible && messages.length === 0) {
            fetchHistory();
        }
    }, [isVisible]);

    const fetchHistory = async () => {
        setIsFetchingHistory(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch(`${API_BASE_URL}/api/ai-chat`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            
            const data = await res.json();
            if (data.success && data.history) {
                setMessages(data.history);
            }
        } catch (error) {
            console.error('Failed to fetch AI chat history', error);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;
        
        const text = inputText.trim();
        setInputText('');
        
        const tempId = Date.now().toString();
        const userMsg: Message = { id: tempId, role: 'user', content: text };
        
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Not logged in');

            const res = await fetch(`${API_BASE_URL}/api/ai-chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` 
                },
                body: JSON.stringify({ message: text })
            });
            
            const data = await res.json();
            
            if (data.success && data.reply) {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: "Sorry, I'm having trouble connecting to my brain right now! 🧠⚡" }]);
            }
        } catch (error) {
            console.error('AI Chat error', error);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: "Network error! Make sure you are connected to the internet." }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isVisible && (
                <TouchableOpacity 
                    onPress={() => setIsVisible(true)}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
                    style={{ shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
                >
                    <Sparkles size={24} color="white" />
                </TouchableOpacity>
            )}

            {/* Chat Modal */}
            <Modal visible={isVisible} animationType="slide" presentationStyle="formSheet">
                <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                        <View className="flex-row items-center space-x-2">
                            <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center">
                                <Sparkles size={16} color="#4f46e5" />
                            </View>
                            <Text className="text-lg font-bold text-slate-800 dark:text-white">Dheeyudha AI Coach</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsVisible(false)} className="p-2">
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Chat Area */}
                    <View className="flex-1">
                        {isFetchingHistory ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" color="#4f46e5" />
                                <Text className="text-slate-500 mt-4">Waking up AI...</Text>
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                renderItem={({ item }) => {
                                    const isUser = item.role === 'user';
                                    return (
                                        <View className={`mb-4 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
                                            <View className={`p-4 rounded-2xl ${isUser ? 'bg-indigo-600 rounded-tr-sm' : 'bg-white dark:bg-slate-800 rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                                                <Text className={`text-base ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {item.content}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={() => (
                                    <View className="items-center justify-center py-10 mt-10">
                                        <MessageCircle size={48} color="#cbd5e1" />
                                        <Text className="text-slate-400 mt-4 text-center px-8">Ask me anything about your points, battles, or how the app works!</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    {/* Input Area */}
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View className="flex-row items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                            <TextInput
                                className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-full px-4 py-3 mr-3 max-h-32"
                                placeholder="Ask a question..."
                                placeholderTextColor="#94a3b8"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity 
                                onPress={sendMessage}
                                disabled={isLoading || !inputText.trim()}
                                className={`w-12 h-12 rounded-full items-center justify-center ${isLoading || !inputText.trim() ? 'bg-indigo-300' : 'bg-indigo-600'}`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Send size={18} color="white" style={{ marginLeft: 2 }} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </>
    );
}
