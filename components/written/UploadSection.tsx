"use client";

import { Upload, Loader2, FileImage, AlertTriangle, X } from "lucide-react";

interface UploadSectionProps {
    previewUrl: string | null;
    selectedFile: File | null;
    uploading: boolean;
    solveTimeLeft: number;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearFile: () => void;
    onUpload: () => void;
}

export default function UploadSection({
    previewUrl,
    selectedFile,
    uploading,
    solveTimeLeft,
    onFileChange,
    onClearFile,
    onUpload,
}: UploadSectionProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Upload Your Answer</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
                Take a clear photo of your handwritten solution. Max 10MB (JPG, PNG, PDF)
            </p>

            {/* Drop zone or preview */}
            {!previewUrl ? (
                <label
                    htmlFor="answer-upload"
                    className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 rounded-2xl cursor-pointer transition-all"
                >
                    <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/40 rounded-2xl flex items-center justify-center pointer-events-none">
                        <Upload className="w-7 h-7 text-violet-500 dark:text-violet-400" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium pointer-events-none">Click to upload your answer</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs pointer-events-none">JPG, PNG, PDF up to 10MB</span>
                    <input
                        id="answer-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="sr-only"
                        onChange={onFileChange}
                    />
                </label>
            ) : (
                <div className="w-full rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 overflow-hidden">
                    <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Your answer preview"
                            className="w-full max-h-72 object-contain bg-white dark:bg-slate-900"
                        />
                        <button
                            onClick={onClearFile}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800/50 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                            title="Remove and choose different file"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {/* File info bar */}
                    <div className="px-4 py-2.5 flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 border-t border-violet-200 dark:border-violet-800/50">
                        <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300 font-medium min-w-0">
                            <FileImage className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{selectedFile?.name}</span>
                            <span className="text-violet-400 dark:text-violet-500 shrink-0">
                                ({((selectedFile?.size ?? 0) / 1024).toFixed(0)} KB)
                            </span>
                        </div>
                        <label htmlFor="answer-upload-change" className="ml-3 text-xs text-violet-600 dark:text-violet-400 font-bold cursor-pointer hover:text-violet-800 dark:hover:text-violet-300 shrink-0">
                            Change
                            <input
                                id="answer-upload-change"
                                type="file"
                                accept="image/*,.pdf"
                                className="sr-only"
                                onChange={onFileChange}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Time's up warning */}
            {solveTimeLeft === 0 && (
                <div className="mt-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Time&apos;s up! You can still upload but the answer will be marked late.
                </div>
            )}

            <button
                onClick={onUpload}
                disabled={!selectedFile || uploading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-violet-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
                {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    : <><Upload className="w-4 h-4" /> Submit My Answer</>
                }
            </button>
        </div>
    );
}
