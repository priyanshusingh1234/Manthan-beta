'use client';

import { Megaphone } from 'lucide-react';

const HeroSearch: React.FC = () => {
    return (
        <div className="p-6 md:p-8 my-8 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20 border border-sky-200/60 dark:border-sky-800/60 shadow-sm relative overflow-hidden group">
            {/* Background Icon */}
            <div className="absolute -right-6 -bottom-8 opacity-5 dark:opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                <Megaphone className="w-48 h-48 text-sky-500" />
            </div>
            
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-500/30 flex items-center justify-center border-2 border-white/20">
                    <Megaphone className="w-8 h-8" />
                </div>
                
                <div className="flex-1 text-left">
                    <h2 className="text-xl md:text-2xl font-black text-sky-900 dark:text-sky-100 tracking-tight mb-2">
                        Notice: New War Mode Updates
                    </h2>
                    <ul className="space-y-2 text-sky-800/90 dark:text-sky-300/90 font-medium leading-relaxed max-w-3xl list-disc pl-5">
                        <li>No negative marking in Wars: wrong answers now have no penalty.</li>
                        <li>War team sizes now support 5, 10, 15, 20, 25, and 30 players.</li>
                        <li>Preparation phase now uses per-member question picks.</li>
                        <li>Prep and war timers now update live without refresh.</li>
                        <li>Ghost School is smarter: per-member picks, MCQ-only draft, and active solving.</li>
                        <li>Ghost School is hidden from Top Schools rankings.</li>
                        <li>War history tracking is improved and logs now show results more reliably.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default HeroSearch;