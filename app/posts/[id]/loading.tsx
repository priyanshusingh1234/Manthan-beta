import { Loader2 } from 'lucide-react';

export default function PostLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium">Loading post...</p>
            </div>
        </div>
    );
}
