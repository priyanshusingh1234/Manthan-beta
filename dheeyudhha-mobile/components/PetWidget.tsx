'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cone, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '@/lib/supabaseClient';
import { Heart, Zap, Sparkles } from 'lucide-react-native';

interface PetWidgetProps {
    onClick?: () => void;
}

const PetFace = ({ isTired, scale = 1, zOffset = 1.1 }: { isTired?: boolean, scale?: number, zOffset?: number }) => {
    const leftEyeRef = useRef<THREE.Mesh>(null);
    const rightEyeRef = useRef<THREE.Mesh>(null);
    
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const blinkCycle = t % 4;
        let blinkScale = 1;
        if (blinkCycle > 3.8) {
            blinkScale = 0.1;
        }
        const targetScale = isTired ? Math.min(0.4, blinkScale) : blinkScale;
        
        if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetScale, 0.4);
        if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetScale, 0.4);
    });

    return (
        <group position={[0, 0, zOffset]} scale={scale}>
            <Sphere ref={leftEyeRef} args={[0.15, 16, 16]} position={[-0.3, 0.2, 0]}>
                <meshBasicMaterial color="#111827" />
                <Sphere args={[0.05, 8, 8]} position={[0.06, 0.06, 0.12]}>
                    <meshBasicMaterial color="#ffffff" />
                </Sphere>
            </Sphere>
            <Sphere ref={rightEyeRef} args={[0.15, 16, 16]} position={[0.3, 0.2, 0]}>
                <meshBasicMaterial color="#111827" />
                <Sphere args={[0.05, 8, 8]} position={[0.06, 0.06, 0.12]}>
                    <meshBasicMaterial color="#ffffff" />
                </Sphere>
            </Sphere>
            <Box args={[0.15, isTired ? 0.02 : 0.05, 0.1]} position={[0, isTired ? -0.15 : -0.1, 0.05]}>
                <meshBasicMaterial color="#111827" />
            </Box>
        </group>
    );
};

const BreathingWrapper = ({ children, isTired }: { children: React.ReactNode, isTired?: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const speed = isTired ? 1 : 3;
        const amplitude = isTired ? 0.05 : 0.1;
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(t * speed) * amplitude;
        }
    });
    return <group ref={groupRef}>{children}</group>;
};

const VoxelDog = ({ isTired }: { isTired?: boolean }) => (
    <BreathingWrapper isTired={isTired}>
        <group position={[0, 0.2, 0]}>
            {/* Body */}
            <Box args={[0.8, 0.6, 1.2]} position={[0, -0.1, -0.2]}>
                <meshStandardMaterial color="#c28e5c" />
            </Box>
            {/* Head */}
            <group position={[0, 0.4, 0.4]}>
                <Box args={[0.6, 0.6, 0.6]}>
                    <meshStandardMaterial color="#c28e5c" />
                </Box>
                {/* Snout */}
                <Box args={[0.3, 0.2, 0.3]} position={[0, -0.1, 0.4]}>
                    <meshStandardMaterial color="#e5b787" />
                </Box>
                {/* Nose */}
                <Box args={[0.1, 0.05, 0.05]} position={[0, 0, 0.56]}>
                    <meshStandardMaterial color="#111827" />
                </Box>
                {/* Ears */}
                <Box args={[0.15, 0.3, 0.2]} position={[-0.35, 0.3, 0]}>
                    <meshStandardMaterial color="#8b5e34" />
                </Box>
                <Box args={[0.15, 0.3, 0.2]} position={[0.35, 0.3, 0]}>
                    <meshStandardMaterial color="#8b5e34" />
                </Box>
                {/* Face */}
                <PetFace isTired={isTired} scale={0.5} zOffset={0.31} />
            </group>
            {/* Legs */}
            <Box args={[0.2, 0.4, 0.2]} position={[-0.25, -0.5, 0.2]}>
                <meshStandardMaterial color="#c28e5c" />
            </Box>
            <Box args={[0.2, 0.4, 0.2]} position={[0.25, -0.5, 0.2]}>
                <meshStandardMaterial color="#c28e5c" />
            </Box>
            <Box args={[0.2, 0.4, 0.2]} position={[-0.25, -0.5, -0.6]}>
                <meshStandardMaterial color="#c28e5c" />
            </Box>
            <Box args={[0.2, 0.4, 0.2]} position={[0.25, -0.5, -0.6]}>
                <meshStandardMaterial color="#c28e5c" />
            </Box>
            {/* Tail */}
            <Box args={[0.1, 0.5, 0.1]} position={[0, 0.3, -0.8]} rotation={[Math.PI / 4, 0, 0]}>
                <meshStandardMaterial color="#c28e5c" />
            </Box>
        </group>
    </BreathingWrapper>
);

const VoxelCat = ({ isTired }: { isTired?: boolean }) => (
    <BreathingWrapper isTired={isTired}>
        <group position={[0, 0.1, 0]}>
            {/* Body */}
            <Box args={[0.6, 0.5, 1.0]} position={[0, -0.1, -0.1]}>
                <meshStandardMaterial color="#f97316" />
            </Box>
            {/* Head */}
            <group position={[0, 0.3, 0.4]}>
                <Box args={[0.5, 0.5, 0.5]}>
                    <meshStandardMaterial color="#f97316" />
                </Box>
                {/* Ears */}
                <Cone args={[0.15, 0.3, 4]} position={[-0.2, 0.4, 0]} rotation={[0, Math.PI/4, 0]}>
                    <meshStandardMaterial color="#ea580c" />
                </Cone>
                <Cone args={[0.15, 0.3, 4]} position={[0.2, 0.4, 0]} rotation={[0, Math.PI/4, 0]}>
                    <meshStandardMaterial color="#ea580c" />
                </Cone>
                {/* Face */}
                <PetFace isTired={isTired} scale={0.4} zOffset={0.26} />
            </group>
            {/* Legs */}
            <Box args={[0.12, 0.3, 0.12]} position={[-0.2, -0.4, 0.3]}>
                <meshStandardMaterial color="#f97316" />
            </Box>
            <Box args={[0.12, 0.3, 0.12]} position={[0.2, -0.4, 0.3]}>
                <meshStandardMaterial color="#f97316" />
            </Box>
            <Box args={[0.12, 0.3, 0.12]} position={[-0.2, -0.4, -0.5]}>
                <meshStandardMaterial color="#f97316" />
            </Box>
            <Box args={[0.12, 0.3, 0.12]} position={[0.2, -0.4, -0.5]}>
                <meshStandardMaterial color="#f97316" />
            </Box>
            {/* Tail */}
            <Box args={[0.08, 0.6, 0.08]} position={[0, 0.3, -0.6]} rotation={[-Math.PI / 6, 0, 0]}>
                <meshStandardMaterial color="#ea580c" />
            </Box>
        </group>
    </BreathingWrapper>
);

const VoxelBird = ({ isTired }: { isTired?: boolean }) => (
    <BreathingWrapper isTired={isTired}>
        <group position={[0, 0.3, 0]}>
            {/* Body/Head */}
            <Sphere args={[0.6, 16, 16]}>
                <meshStandardMaterial color="#3b82f6" />
            </Sphere>
            {/* Beak */}
            <Cone args={[0.15, 0.3, 16]} position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#eab308" />
            </Cone>
            {/* Wings */}
            <Box args={[0.1, 0.4, 0.6]} position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 8]}>
                <meshStandardMaterial color="#60a5fa" />
            </Box>
            <Box args={[0.1, 0.4, 0.6]} position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 8]}>
                <meshStandardMaterial color="#60a5fa" />
            </Box>
            {/* Legs */}
            <Box args={[0.05, 0.3, 0.05]} position={[-0.2, -0.7, 0]}>
                <meshStandardMaterial color="#eab308" />
            </Box>
            <Box args={[0.05, 0.3, 0.05]} position={[0.2, -0.7, 0]}>
                <meshStandardMaterial color="#eab308" />
            </Box>
            {/* Feet */}
            <Box args={[0.15, 0.05, 0.2]} position={[-0.2, -0.85, 0.05]}>
                <meshStandardMaterial color="#eab308" />
            </Box>
            <Box args={[0.15, 0.05, 0.2]} position={[0.2, -0.85, 0.05]}>
                <meshStandardMaterial color="#eab308" />
            </Box>
            {/* Face */}
            <PetFace isTired={isTired} scale={0.4} zOffset={0.55} />
        </group>
    </BreathingWrapper>
);

export const PetModels = {
    dog: VoxelDog,
    cat: VoxelCat,
    bird: VoxelBird,
    // Legacy support for previously selected pets
    blocky: VoxelDog,
    slime: VoxelCat,
    spike: VoxelBird
};

export default function PetWidget({ onClick }: PetWidgetProps) {
    const [activePet, setActivePet] = useState<string | null>(null);
    const [petStats, setPetStats] = useState({ name: 'Companion', health: 100, level: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPet() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.active_pet) {
                    setActivePet(user.user_metadata.active_pet);
                    
                    // Fetch real stats from profiles
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('pet_name, pet_health, pet_level, pet_last_fed_at')
                        .eq('id', user.id)
                        .single();
                        
                    if (profile) {
                        let currentHealth = profile.pet_health ?? 100;
                        if (profile.pet_last_fed_at) {
                            const hoursSinceFed = (Date.now() - new Date(profile.pet_last_fed_at).getTime()) / (1000 * 60 * 60);
                            currentHealth = Math.max(0, Math.round(currentHealth - (hoursSinceFed * 4)));
                        }
                        
                        setPetStats({
                            name: profile.pet_name || user.user_metadata.pet_name || 'Companion',
                            health: currentHealth,
                            level: profile.pet_level || 1
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch pet:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPet();
        
        // Setup listener for auth state changes (if user updates pet in same session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user?.user_metadata?.active_pet) {
                setActivePet(session.user.user_metadata.active_pet);
            }
        });
        
        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    if (loading) {
        return (
            <View className="h-40 w-full animate-pulse bg-gray-800/50 rounded-2xl border border-gray-700/50 flex items-center justify-center flex-row">
                <Text className="text-gray-500 text-sm font-medium">Loading Companion...</Text>
            </View>
        );
    }

    if (!activePet || !PetModels[activePet as keyof typeof PetModels]) {
        return (
            <View 
                onPress={onClick}
                className="h-40 w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all group"
            >
                <View className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform flex-row">
                    <Sparkles className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                </View>
                <Text className="text-sm font-semibold text-gray-300 group-hover:text-white">Adopt a Study Pet!</Text>
                <Text className="text-xs text-gray-500 mt-1">Boost your streak & XP</Text>
            </View>
        );
    }

    return (
        <View 
            onPress={onClick}
            className="relative h-48 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/80 overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:border-gray-600 transition-all"
        >
            {/* Background blur/glow effect */}
            <View className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />

            {/* Pet Stats overlay */}
            <View className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                <View className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 flex-row">
                    <Heart className={`w-3 h-3 ${petStats.health < 30 ? 'text-red-500 fill-red-500 animate-pulse' : 'text-rose-500 fill-rose-500'}`} />
                    <Text className={`text-xs font-bold ${petStats.health < 30 ? 'text-red-400' : 'text-white'}`}>{petStats.health}%</Text>
                </View>
                <View className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 flex-row">
                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <Text className="text-xs font-bold text-white">Lvl {petStats.level}</Text>
                </View>
            </View>

            <View className="absolute top-3 right-3 z-10">
                <Text className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md border border-white/5">
                    {petStats.name}
                </Text>
            </View>

            {/* The 3D Canvas */}
            <View className="absolute inset-0 top-4">
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 10, 5]} intensity={1.5} />
                    <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={1} />
                    {(() => {
                        const Model = PetModels[activePet as keyof typeof PetModels];
                        return Model ? <Model isTired={petStats.health < 30} /> : null;
                    })()}
                    <OrbitControls 
                        enableZoom={false} 
                        enablePan={false}
                        autoRotate 
                        autoRotateSpeed={petStats.health < 30 ? 0.5 : 1.5} // Slow down if tired
                        maxPolarAngle={Math.PI / 2 + 0.2}
                        minPolarAngle={Math.PI / 2 - 0.2}
                    />
                </Canvas>
            </View>
            
            <View className="absolute bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none flex-row">
                 <View className="w-3/4 h-2 bg-black/20 blur-md rounded-[100%] shadow-[0_10px_20px_rgba(0,0,0,0.5)]"></View>
            </View>
        </View>
    );
}
