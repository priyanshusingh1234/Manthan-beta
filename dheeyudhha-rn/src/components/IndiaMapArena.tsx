import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { IndiaMapData } from './IndiaMapData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function IndiaMapArena({ question, disabled, onSubmit }: { question: any, disabled: boolean, onSubmit: (isCorrect: boolean) => void }) {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // Answer stored in match_pairs[0].label
    const expectedAnswer = question.match_pairs && question.match_pairs.length > 0 ? question.match_pairs[0].label : null;

    const handleStateClick = (id: string) => {
        if (disabled) return;
        setSelectedState(id);
    };

    const handleSubmit = () => {
        if (!selectedState || disabled) return;
        
        let isCorrect = false;
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

    // Calculate map scale to fit the screen
    // The IndiaMapData viewBox is "0 0 612 696"
    const mapOriginalWidth = 612;
    const mapOriginalHeight = 696;
    const containerWidth = SCREEN_WIDTH - 32; // 16px padding on each side
    const scale = containerWidth / mapOriginalWidth;
    const containerHeight = mapOriginalHeight * scale;

    return (
        <View className="space-y-6">
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
                Tap on the correct state to select it.
            </Text>
            
            <View className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 p-2 items-center justify-center">
                <Svg
                    width={containerWidth}
                    height={containerHeight}
                    viewBox={IndiaMapData.viewBox}
                >
                    {IndiaMapData.locations.map((location: any) => {
                        const isSelected = selectedState === location.id;
                        let fillColor = '#cbd5e1'; // slate-300
                        
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
                            <Path
                                key={location.id}
                                d={location.path}
                                fill={fillColor}
                                stroke="#ffffff"
                                strokeWidth="2"
                                onPress={() => handleStateClick(location.id)}
                            />
                        );
                    })}
                </Svg>
            </View>

            <View className="flex-row justify-between items-center mt-4">
                <View className="flex-1">
                    {selectedState ? (
                        <Text className="text-sm font-black text-slate-700 dark:text-slate-300">
                            Selected: {IndiaMapData.locations.find((l: any) => l.id === selectedState)?.name}
                        </Text>
                    ) : null}
                </View>
                
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!selectedState || disabled}
                    className={`flex-row items-center gap-2 px-6 py-3.5 rounded-2xl shadow-sm ${!selectedState || disabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600'}`}
                >
                    <Text className={`font-black text-lg ${!selectedState || disabled ? 'text-slate-400' : 'text-white'}`}>
                        Submit
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
