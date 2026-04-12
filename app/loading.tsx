import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      </div>
    </div>
  );
}
