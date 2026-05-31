import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { X } from 'lucide-react-native';
import { sanitizeUsernameInput } from "@/lib/username";

interface EditProfileForm {
    name: string;
    username: string;
    school: string;
    grade: string;
    bio: string;
    showWeeklyReport: boolean;
    showImpact?: boolean;
}


interface EditProfileModalProps {
    form: EditProfileForm;
    message: string;
    onFormChange: (form: EditProfileForm) => void;
    onSave: () => void;
    onClose: () => void;
}

export default function EditProfileModal({
    form,
    message,
    onFormChange,
    onSave,
    onClose,
}: EditProfileModalProps) {
    return (
        <View className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 animate-in fade-in zoom-in-95 overflow-hidden flex-row">
            <View className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onPress={onClose} />
            <View className="relative bg-white dark:bg-slate-900 sm:rounded-[2rem] shadow-2xl w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                {/* Header */}
                <View className="px-6 py-4 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-row">
                    <Text className="text-xl font-black text-slate-900 dark:text-white">Edit Profile</Text>
                    <View
                        onPress={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </View>
                </View>

                {/* Fields */}
                <View className="p-6 space-y-4 flex-1 overflow-y-auto flex-row">
                    {message && (
                        <View className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium">
                            {message}
                        </View>
                    )}

                    <View className="space-y-1">
                        <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</Text>
                        <TextInput
                            value={form.name}
                            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200"
                            placeholder="E.g. Elon Musk"
                        />
                    </View>

                    <View className="space-y-1">
                        <Text className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex-row">
                            <Text>Username</Text>
                            <Text className="text-xs font-normal opacity-70">Max 3 updates/month</Text>
                        </Text>
                        <View className="relative">
                            <Text className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</Text>
                            <TextInput
                                value={form.username}
                                onChange={(e) =>
                                    onFormChange({ ...form, username: sanitizeUsernameInput(e.target.value) })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors font-mono font-medium text-slate-800 dark:text-slate-200"
                                placeholder="username"
                            />
                        </View>
                    </View>

                    <View className="grid grid-cols-2 gap-4">
                        <View className="space-y-1">
                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">School</Text>
                            <TextInput
                                value={form.school}
                                onChange={(e) => onFormChange({ ...form, school: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200"
                                placeholder="High School"
                            />
                        </View>
                        <View className="space-y-1">
                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Grade / Class</Text>
                            <TextInput
                                value={form.grade}
                                onChange={(e) => onFormChange({ ...form, grade: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200"
                                placeholder="10th"
                            />
                        </View>
                    </View>

                    <View className="space-y-1">
                        <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Bio</Text>
                        <textarea
                            value={form.bio}
                            onChange={(e) => onFormChange({ ...form, bio: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200 min-h-[100px] resize-none"
                            placeholder="A little about yourself..."
                        />
                    </View>

                    <View className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-row">
                        <View>
                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Show Weekly Report</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">Display your weekly performance rating on your profile.</Text>
                        </View>
                        <Text className="relative inline-flex items-center cursor-pointer flex-row">
                            <TextInput
                                type="checkbox"
                                checked={form.showWeeklyReport}
                                onChange={(e) => onFormChange({ ...form, showWeeklyReport: e.target.checked })}
                                className="sr-only peer"
                            />
                            <View className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></View>
                        </Text>
                    </View>

                    <View className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-row">
                        <View>
                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Show Teaching Impact</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">Show accuracy, reach, and solve counts to other users.</Text>
                        </View>
                        <Text className="relative inline-flex items-center cursor-pointer flex-row">
                            <TextInput
                                type="checkbox"
                                checked={form.showImpact ?? true}
                                onChange={(e) => onFormChange({ ...form, showImpact: e.target.checked })}
                                className="sr-only peer"
                            />
                            <View className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></View>
                        </Text>
                    </View>
                </View>


                {/* Footer */}
                <View className="p-6 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <View
                        onPress={onSave}
                        className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold px-4 py-4 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-md active:translate-y-0.5"
                    >
                        Save Changes
                    </View>
                </View>
            </View>
        </View>
    );
}
