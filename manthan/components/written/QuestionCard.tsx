"use client";

import { FileImage, Info } from "lucide-react";
import TeacherBadge from "@/ticks/teacher";
import type { WrittenQuestion } from "./types";

interface QuestionCardProps {
    question: WrittenQuestion;
}

export default function QuestionCard({ question }: QuestionCardProps) {
    return (
        <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            {/* Teacher info */}
            <div className="flex items-center gap-4 p-4 mb-6 bg-slate-50 border border-slate-100 rounded-2xl">
                {question.teacherAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={question.teacherAvatar}
                        alt="Teacher"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm">
                        {String(question.teacherName?.[0] || "T").toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Posted By</p>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        {question.teacherName || "Verified Teacher"}<TeacherBadge />
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200">
                    <FileImage className="w-3.5 h-3.5" /> Written Answer
                </div>
            </div>

            {/* Meta tags */}
            <div className="mb-6 flex flex-wrap gap-2">
                {question.class_grade && (
                    <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        Class {question.class_grade}
                    </span>
                )}
                {question.subject && (
                    <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        {question.subject}
                    </span>
                )}
                {question.difficulty && (
                    <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium capitalize">
                        {question.difficulty}
                    </span>
                )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                {question.title}
            </h1>
            {question.body && (
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-6 whitespace-pre-wrap">
                    {question.body}
                </p>
            )}

            {/* Question image */}
            {question.publicUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={question.publicUrl}
                        alt="Question"
                        className="max-h-80 object-contain rounded-xl"
                    />
                </div>
            )}

            {/* Rules notice */}
            <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <div className="text-sm text-violet-800">
                    <p className="font-bold mb-1">How written answers work:</p>
                    <ol className="space-y-1 list-decimal list-inside text-violet-700">
                        <li>Solve on paper, take a clear photo</li>
                        <li>Upload your photo within the time limit</li>
                        <li>Compare with the teacher&apos;s model answer</li>
                        <li>If correct, click <strong>&quot;I got it right&quot;</strong> to earn points instantly</li>
                        <li>Community members will verify your answer.</li>
                        <li>If 2 members flag it, our deeply-integrated AI will review.</li>
                        <li>False claims = point loss + 3 extra penalty points</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
