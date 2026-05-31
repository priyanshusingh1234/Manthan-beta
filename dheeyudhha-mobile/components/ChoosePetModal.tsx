import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cone, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import { X, CheckCircle, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface ChoosePetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (petId: string) => void;
}

const PetFace = () => (
    <group position={[0, 0, 0.95]}>
        <Sphere args={[0.12, 16, 16]} position={[-0.25, 0.15, 0]}>
            <meshBasicMaterial color="#111827" />
        </Sphere>
        <Sphere args={[0.12, 16, 16]} position={[0.25, 0.15, 0]}>
            <meshBasicMaterial color="#111827" />
        </Sphere>
        <Box args={[0.1, 0.04, 0.1]} position={[0, -0.1, 0.05]}>
            <meshBasicMaterial color="#111827" />
        </Box>
    </group>
);

const PETS = [
    {
        id: 'slime',
        name: 'Slimey',
        description: 'A bouncy, friendly slime that loves learning.',
        color: '#10b981', // Emerald
        component: (color: string) => (
            <group>
                <Sphere args={[1, 32, 32]}>
                    <MeshDistortMaterial color={color} attach="material" distort={0.4} speed={2} />
                </Sphere>
                <PetFace />
            </group>
        )
    },
    {
        id: 'blocky',
        name: 'Blocky',
        description: 'A sturdy companion who never breaks a streak.',
        color: '#f59e0b', // Amber
        component: (color: string) => (
            <group>
                <Box args={[1.5, 1.5, 1.5]}>
                    <MeshWobbleMaterial color={color} attach="material" factor={0.2} speed={1} />
                </Box>
                <group position={[0, 0, -0.2]}><PetFace /></group>
            </group>
        )
    },
    {
        id: 'spike',
        name: 'Spike',
        description: 'Sharp, focused, and always ready for a duel.',
        color: '#8b5cf6', // Violet
        component: (color: string) => (
            <group>
                <Cone args={[1, 2, 32]}>
                    <MeshDistortMaterial color={color} attach="material" distort={0.2} speed={3} />
                </Cone>
                <group position={[0, -0.2, 0]}><PetFace /></group>
            </group>
        )
    }
];

export default function ChoosePetModal({ isOpen, onClose, onSelect }: ChoosePetModalProps) {
    const [selectedPet, setSelectedPet] = useState<string | null>(null);
    const [petName, setPetName] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedPet || !petName.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { active_pet: selectedPet, pet_name: petName.trim() }
            });
            if (error) throw error;
            
            toast.success('Pet selected successfully! 🎉');
            onSelect(selectedPet);
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save pet');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <View 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm flex-row"
            >
                <View 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden bg-gray-900 border border-gray-700 shadow-2xl rounded-3xl"
                >
                    {/* Header */}
                    <View className="flex items-center justify-between p-6 pb-2 flex-row">
                        <Text className="flex items-center gap-2 text-2xl font-bold text-white flex-row">
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                            Choose Your Pet
                        </Text>
                        <View 
                            onPress={onClose}
                            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-800 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </View>
                    </View>
                    
                    <Text className="px-6 mb-6 text-sm text-gray-400">
                        Pick a companion to join you on your learning journey. You can change this later!
                    </Text>

                    {/* Pet Carousel / Grid */}
                    <View className="grid grid-cols-1 gap-4 px-6 mb-6 md:grid-cols-3">
                        {PETS.map(pet => (
                            <View 
                                key={pet.id}
                                onPress={() => setSelectedPet(pet.id)}
                                className={`relative p-3 rounded-2xl cursor-pointer transition-all ${
                                    selectedPet === pet.id 
                                        ? 'bg-gray-800 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                                        : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800'
                                }`}
                            >
                                {selectedPet === pet.id && (
                                    <View className="absolute z-10 top-2 right-2 text-blue-500">
                                        <CheckCircle className="w-5 h-5 fill-current bg-white rounded-full" />
                                    </View>
                                )}
                                
                                <View className="h-32 w-full rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden mb-3">
                                    <Canvas camera={{ position: [0, 0, 4] }}>
                                        <ambientLight intensity={0.5} />
                                        <directionalLight position={[10, 10, 5]} intensity={1} />
                                        {pet.component(pet.color)}
                                        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                                    </Canvas>
                                </View>
                                <Text className="text-center font-semibold text-white mb-1">{pet.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Pet Name Input */}
                    <View className="px-6 mb-4">
                        <Text className="block text-sm font-medium text-gray-400 mb-1">Name your companion</Text>
                        <TextInput 
                            type="text" 
                            maxLength={15}
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                            placeholder="e.g. Sir Reginald"
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </View>

                    {/* Selected Pet Description */}
                    <View className="px-6 h-10 flex items-center justify-center text-center flex-row">
                        <Text className="text-sm text-gray-300">
                            {selectedPet ? PETS.find(p => p.id === selectedPet)?.description : 'Select a pet to view its details.'}
                        </Text>
                    </View>

                    {/* Footer */}
                    <View className="p-6 pt-4 bg-gray-800/50">
                        <View
                            onPress={handleSave}
                            disabled={!selectedPet || !petName.trim() || saving}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all ${
                                !selectedPet || !petName.trim() || saving
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-blue-500/25'
                            }`}
                        >
                            {saving ? 'Saving...' : 'Adopt Pet'}
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}
