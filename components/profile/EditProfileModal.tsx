"use client";

import { X } from "lucide-react";

interface EditProfileForm {
    name: string;
    username: string;
    school: string;
    grade: string;
    bio: string;
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="px-6 py-4 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit Profile</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Fields */}
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    {message && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium">
                            {message}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200"
                            placeholder="E.g. Elon Musk"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                            <span>Username</span>
                            <span className="text-xs font-normal opacity-70">Max 3 updates/month</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                            <input
                                value={form.username}
                                onChange={(e) =>
                                    onFormChange({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors font-mono font-medium text-slate-800 dark:text-slate-200"
                                placeholder="username"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">School</label>
                            <input
                                value={form.school}
                                onChange={(e) => onFormChange({ ...form, school: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200"
                                placeholder="High School"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Grade / Class</label>
                            <input
                                value={form.grade}
                                onChange={(e) => onFormChange({ ...form, grade: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200"
                                placeholder="10th"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Bio</label>
                        <textarea
                            value={form.bio}
                            onChange={(e) => onFormChange({ ...form, bio: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-slate-800 dark:text-slate-200 min-h-[100px] resize-none"
                            placeholder="A little about yourself..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        onClick={onSave}
                        className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold px-4 py-4 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-md active:translate-y-0.5"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
