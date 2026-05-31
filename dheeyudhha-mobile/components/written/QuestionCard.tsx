import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { FileImage, Info } from 'lucide-react-native';
import TeacherBadge from "@/ticks/teacher";
import type { WrittenQuestion } from "./types";

interface QuestionCardProps {
    question: WrittenQuestion;
}

export default function QuestionCard({ question }: QuestionCardProps) {
    return (
        <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
            <View className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 dark:bg-violet-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            {/* Teacher info */}
            <View className="flex items-center gap-4 p-4 mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex-row">
                {question.teacherAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                        src={question.teacherAvatar}
                        alt="Teacher"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                    />
                ) : (
                    <View className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center text-lg border-2 border-white dark:border-slate-800 shadow-sm flex-row">
                        {String(question.teacherName?.[0] || "T").toUpperCase()}
                    </View>
                )}
                <View>
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Posted By</Text>
                    <View className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 flex-row">
                        {question.teacherName || "Verified Teacher"}<TeacherBadge />
                    </View>
                </View>
                <View className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-xs font-bold border border-violet-200 dark:border-violet-800/50 flex-row">
                    <FileImage className="w-3.5 h-3.5" /> Written Answer
                </View>
            </View>

            {/* Meta tags */}
            <View className="mb-6 flex flex-wrap gap-2 flex-row">
                {question.class_grade && (
                    <Text className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                        Class {question.class_grade}
                    </Text>
                )}
                {question.subject && (
                    <Text className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                        {question.subject}
                    </Text>
                )}
                {question.difficulty && (
                    <Text className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium capitalize">
                        {question.difficulty}
                    </Text>
                )}
            </View>

            <Text className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4 leading-snug">
                {question.title}
            </Text>
            {question.body && (
                <Text className="text-gray-600 dark:text-slate-400 leading-relaxed text-base sm:text-lg mb-6 whitespace-pre-wrap">
                    {question.body}
                </Text>
            )}

            {/* Question image */}
            {(question.publicUrl || question.image_url) && (
                <View className="mb-6 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 flex items-center justify-center p-4 flex-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                        src={question.publicUrl || question.image_url}
                        alt="Question"
                        className="max-h-80 object-contain rounded-xl"
                    />
                </View>
            )}

            {/* Rules notice */}
            <View className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl flex gap-3 flex-row">
                <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <View className="text-sm text-violet-800 dark:text-violet-300">
                    <Text className="font-bold mb-1">How written answers work:</Text>
                    <View className="space-y-1 list-decimal list-inside text-violet-700 dark:text-violet-400">
                        <View>Solve on paper, take a clear photo</View>
                        <View>Upload your photo within the time limit</View>
                        <View>Compare with the teacher&apos;s model answer</View>
                        <View>If correct, click <Text>&quot;I got it right&quot;</Text> to earn points instantly</View>
                        <View>Community members will verify your answer.</View>
                        <View>If 2 members flag it, our deeply-integrated AI will review.</View>
                        <View>False claims = point loss + 3 extra penalty points</View>
                    </View>
                </View>
            </View>
        </View>
    );
}
