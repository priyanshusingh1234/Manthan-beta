export default function Loading() {
    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading...</p>
            </div>
        </div>
    );
}
