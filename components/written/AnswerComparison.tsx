"use client";

import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student answer */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">You</span>
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Your Answer</h3>
                </div>
                {submission.submission_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={submission.submission_url}
                        alt="Your answer"
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    />
                ) : previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={previewUrl}
                        alt="Your uploaded answer"
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                ) : (
                    <div className="h-40 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                        No preview available
                    </div>
                )}
            </div>

            {/* Teacher model answer */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                        <TeacherBadge />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Teacher&apos;s Model Answer</h3>
                </div>

                {!showTeacherAnswer ? (
                    <div className="h-48 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 border border-slate-100 dark:border-slate-700">
                        <EyeOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center px-4">
                            Reveal after you&apos;ve checked your own work.
                        </p>
                        <button
                            onClick={onRevealTeacherAnswer}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-500 transition-colors"
                        >
                            <Eye className="w-4 h-4" /> Reveal Answer
                        </button>
                    </div>
                ) : loadingTeacherAnswer ? (
                    <div className="h-48 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    </div>
                ) : teacherSolutionUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={teacherSolutionUrl}
                        alt="Teacher model answer"
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border border-violet-100 dark:border-violet-900/40"
                    />
                ) : (
                    <div className="h-48 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100 dark:border-slate-700">
                        <AlertTriangle className="w-7 h-7 text-amber-400" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                            No model answer uploaded by teacher yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
