"use client";

import React, { useState } from 'react';

export default function HotspotArena({ question, disabled, onSubmit }: { question: any, disabled: boolean, onSubmit: (isCorrect: boolean) => void }) {
    const [pin, setPin] = useState<{ x: number, y: number } | null>(null);

    const imageUrl = question.image_url || (question.image_path ? `https://dheeyudhha.supabase.co/storage/v1/object/public/question-images/${question.image_path}` : null);
    
    // In hotspot questions, the matchPairs field holds the hotspot array
    const hotspots = question.match_pairs || [];

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (disabled) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setPin({ x, y });
    };

    const handleSubmit = () => {
        if (!pin || disabled) return;
        
        // Validate if pin is inside any hotspot
        let isCorrect = false;
        for (const h of hotspots) {
            const dist = Math.sqrt(Math.pow(pin.x - h.x, 2) + Math.pow(pin.y - h.y, 2));
            if (dist <= h.radius) {
                isCorrect = true;
                break;
            }
        }
        
        onSubmit(isCorrect);
    };

    return (
        <div className="space-y-6">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Click on the image to place your pin at the correct location.</p>
            
            <div className="relative inline-block border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-w-full bg-slate-50 dark:bg-slate-800">
                {imageUrl && (
                    <img 
                        src={imageUrl} 
                        alt="Hotspot image" 
                        className={`max-w-full max-h-[600px] object-contain block ${disabled ? 'cursor-default' : 'cursor-crosshair'}`} 
                        onClick={handleImageClick}
                        draggable={false}
                    />
                )}
                
                {/* User Pin */}
                {pin && (
                    <div 
                        className="absolute w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                    >
                        {/* Inner dot */}
                        <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                )}
                
                {/* Reveal hotspots if disabled (e.g. after submit) */}
                {disabled && hotspots.map((h: any, i: number) => (
                    <div 
                        key={i}
                        className="absolute rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, width: `${h.radius * 2 * 100}%`, height: `${h.radius * 2 * 100}%` }}
                    >
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!pin || disabled}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-lg px-8 py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                >
                    Submit Location
                </button>
            </div>
        </div>
    );
}
