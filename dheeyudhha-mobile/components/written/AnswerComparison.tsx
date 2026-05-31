import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react-native';
import TeacherBadge from "@/ticks/teacher";
import type { Submission } from "./types";

interface AnswerComparisonProps {
    submission: Submission;
    previewUrl: string | null;
    showTeacherAnswer: boolean;
    loadingTeacherAnswer: boolean;
    teacherSolutionUrl: string | null;
    onRevealTeacherAnswer: () => void;
}

export default function AnswerComparison({
    submission,
    previewUrl,
    showTeacherAnswer,
    loadingTeacherAnswer,
    teacherSolutionUrl,
    onRevealTeacherAnswer,
}: AnswerComparisonProps) {
    return (
        <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student answer */}
            <View className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
                <View className="flex items-center gap-2 mb-3 flex-row">
                    <View className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-row">
                        <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">You</Text>
                    </View>
                    <Text className="font-bold text-slate-700 dark:text-slate-300 text-sm">Your Answer</Text>
                </View>
                {submission.submission_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                        src={submission.submission_url}
                        alt="Your answer"
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    />
                ) : previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                        src={previewUrl}
                        alt="Your uploaded answer"
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                ) : (
                    <View className="h-40 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm flex-row">
                        No preview available
                    </View>
                )}
            </View>

            {/* Teacher model answer */}
            <View className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
                <View className="flex items-center gap-2 mb-3 flex-row">
                    <View className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-row">
                        <TeacherBadge />
                    </View>
                    <Text className="font-bold text-slate-700 dark:text-slate-300 text-sm">Teacher&apos;s Model Answer</Text>
                </View>

                {!showTeacherAnswer ? (
                    <View className="h-48 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 border border-slate-100 dark:border-slate-700">
                        <EyeOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center px-4">
                            Reveal after you&apos;ve checked your own work.
                        </Text>
                        <View
                            onPress={onRevealTeacherAnswer}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-500 transition-colors flex-row"
                        >
                            <Eye className="w-4 h-4" /> Reveal Answer
                        </View>
                    </View>
                ) : loadingTeacherAnswer ? (
                    <View className="h-48 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 flex-row">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    </View>
                ) : teacherSolutionUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                        src={teacherSolutionUrl}
                        alt="Teacher model answer"
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border border-violet-100 dark:border-violet-900/40"
                    />
                ) : (
                    <View className="h-48 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100 dark:border-slate-700">
                        <AlertTriangle className="w-7 h-7 text-amber-400" />
                        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
                            No model answer uploaded by teacher yet.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
