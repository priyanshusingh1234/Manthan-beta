import { Loader2 } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-slate-950">
      {/* Skeleton Header */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Skeleton Body */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Connecting to chat...</p>
        </div>
      </div>
    </div>
  );
}
