import React from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Clock, Target, Trophy, Flame } from 'lucide-react';

export default function ArenaBattleCard({ gauntlet }: { gauntlet: any }) {
    const router = useRouter();

    if (!gauntlet) return null;

    const handleEnterArena = () => {
        router.push(`/arena/${gauntlet.slug}`);
    };

    return (
        <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-6 shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden isolate group transition-all">
            {/* Background Gradient Mesh */}
            <div className={`absolute inset-0 opacity-[0.03] dark:opacity-[0.1] bg-gradient-to-br ${gauntlet.color || 'from-indigo-600 to-violet-800'} -z-10 transition-opacity group-hover:opacity-[0.05] dark:group-hover:opacity-[0.15]`} />
            
            <div className="flex flex-col gap-4 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${gauntlet.color || 'from-indigo-500 to-violet-600'} text-white shadow-lg`}>
                            <Swords className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                {gauntlet._label || '⚔️ Arena Battle'}
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {gauntlet.title}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {gauntlet.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {gauntlet.description}
                    </p>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center">
                        <Target className="w-4 h-4 text-rose-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Difficulty</span>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 capitalize">{gauntlet.difficulty || 'Mixed'}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center">
                        <Flame className="w-4 h-4 text-orange-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Questions</span>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{gauntlet.question_count} Qs</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</span>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{gauntlet.time_minutes} min</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center">
                        <Trophy className="w-4 h-4 text-yellow-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reward</span>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 text-center line-clamp-1">{gauntlet.reward || 'Fame & Glory'}</span>
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={handleEnterArena}
                    className={`w-full py-4 mt-2 bg-gradient-to-r ${gauntlet.color || 'from-indigo-500 to-violet-600'} text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                >
                    Start Practice <Swords className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
