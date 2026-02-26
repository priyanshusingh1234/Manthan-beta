'use client';

import { AlertTriangle } from 'lucide-react';

const HeroSearch: React.FC = () => {
    return (
        <div className="p-6 md:p-8 my-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50 shadow-sm relative overflow-hidden group">
            {/* Background Icon */}
            <div className="absolute -right-6 -bottom-8 opacity-5 dark:opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle className="w-48 h-48 text-amber-500" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center border-2 border-white/20">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl md:text-2xl font-black text-amber-900 dark:text-amber-100 tracking-tight mb-2">
                        Welcome to the Beta!
                    </h2>
                    <p className="text-amber-700/80 dark:text-amber-400/80 font-medium sm:text-lg leading-relaxed max-w-2xl">
                        Dheeyudha is currently in active development. You might encounter some bugs or unpolished features. 
                        We genuinely appreciate your patience and feedback as we build the ultimate student battleground.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default HeroSearch;