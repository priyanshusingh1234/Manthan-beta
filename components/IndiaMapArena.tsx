"use client";

import React, { useState } from 'react';
import { IndiaMapData } from './IndiaMapData';

export default function IndiaMapArena({ question, disabled, onSubmit }: { question: any, disabled: boolean, onSubmit: (isCorrect: boolean) => void }) {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // The answer is stored in the database. For new questions, we expect `match_pairs` to have an item with `label` equal to the state ID (e.g., 'UP', 'MH') or the state name.
    // Let's assume the question author stores the state ID or name in `match_pairs[0].label`.
    const expectedAnswer = question.match_pairs && question.match_pairs.length > 0 ? question.match_pairs[0].label : null;

    const handleStateClick = (id: string) => {
        if (disabled) return;
        setSelectedState(id);
    };

    const handleSubmit = () => {
        if (!selectedState || disabled) return;
        
        let isCorrect = false;
        // Check if selected state matches expected answer (case-insensitive)
        if (expectedAnswer) {
            const selectedLoc = IndiaMapData.locations.find((l: any) => l.id === selectedState);
            const expectedStr = String(expectedAnswer).toLowerCase().trim();
            if (
                selectedState.toLowerCase() === expectedStr || 
                (selectedLoc && selectedLoc.name.toLowerCase() === expectedStr)
            ) {
                isCorrect = true;
            }
        }
        
        onSubmit(isCorrect);
    };

    return (
        <div className="space-y-6">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Click on the correct state to select it.
            </p>
            
            <div className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 p-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={IndiaMapData.viewBox}
                    className="w-full max-h-[600px] h-auto"
                    aria-label={IndiaMapData.label}
                >
                    {IndiaMapData.locations.map((location: any) => {
                        const isSelected = selectedState === location.id;
                        let fillColor = '#cbd5e1'; // default slate-300
                        
                        if (isSelected) {
                            fillColor = '#6366f1'; // indigo-500
                        }
                        
                        // If disabled (submitted), reveal the correct answer
                        if (disabled && expectedAnswer) {
                            const expectedStr = String(expectedAnswer).toLowerCase().trim();
                            const isThisCorrectState = location.id.toLowerCase() === expectedStr || location.name.toLowerCase() === expectedStr;
                            
                            if (isThisCorrectState) {
                                fillColor = '#22c55e'; // green-500
                            } else if (isSelected && !isThisCorrectState) {
                                fillColor = '#ef4444'; // red-500
                            }
                        }

                        return (
                            <path
                                key={location.id}
                                id={location.id}
                                name={location.name}
                                d={location.path}
                                fill={fillColor}
                                stroke="#ffffff"
                                strokeWidth="1"
                                className={`transition-colors duration-200 ${!disabled ? 'cursor-pointer hover:fill-indigo-300' : ''}`}
                                onClick={() => handleStateClick(location.id)}
                            >
                                <title>{location.name}</title>
                            </path>
                        );
                    })}
                </svg>
            </div>

            <div className="flex justify-between items-center">
                {selectedState ? (
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Selected: {IndiaMapData.locations.find((l: any) => l.id === selectedState)?.name}
                    </p>
                ) : (
                    <div />
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedState || disabled}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-lg px-8 py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                >
                    Submit Location
                </button>
            </div>
        </div>
    );
}
