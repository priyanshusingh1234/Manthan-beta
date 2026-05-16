'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cone, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import { createBrowserClient } from '@supabase/ssr';
import { Heart, Zap, Sparkles } from 'lucide-react';

interface PetWidgetProps {
    onClick?: () => void;
}

const PET_COMPONENTS = {
    slime: (
        <Sphere args={[1.2, 32, 32]}>
            <MeshDistortMaterial color="#10b981" attach="material" distort={0.4} speed={2} />
        </Sphere>
    ),
    blocky: (
        <Box args={[1.6, 1.6, 1.6]}>
            <MeshWobbleMaterial color="#f59e0b" attach="material" factor={0.2} speed={1} />
        </Box>
    ),
    spike: (
        <Cone args={[1.2, 2.5, 32]}>
            <MeshDistortMaterial color="#8b5cf6" attach="material" distort={0.2} speed={3} />
        </Cone>
    )
};

export default function PetWidget({ onClick }: PetWidgetProps) {
    const [activePet, setActivePet] = useState<string | null>(null);
    const [petStats, setPetStats] = useState({ name: 'Companion', health: 100, level: 1 });
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
            <div className="h-40 w-full animate-pulse bg-gray-800/50 rounded-2xl border border-gray-700/50 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">Loading Companion...</span>
            </div>
        );
    }

    if (!activePet || !PET_COMPONENTS[activePet as keyof typeof PET_COMPONENTS]) {
        return (
            <div 
                onClick={onClick}
                className="h-40 w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all group"
            >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                </div>
                <p className="text-sm font-semibold text-gray-300 group-hover:text-white">Adopt a Study Pet!</p>
                <p className="text-xs text-gray-500 mt-1">Boost your streak & XP</p>
            </div>
        );
    }

    return (
        <div 
            onClick={onClick}
            className="relative h-48 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/80 overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:border-gray-600 transition-all"
        >
            {/* Background blur/glow effect */}
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />

            {/* Pet Stats overlay */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                    <Heart className={`w-3 h-3 ${petStats.health < 30 ? 'text-red-500 fill-red-500 animate-pulse' : 'text-rose-500 fill-rose-500'}`} />
                    <span className={`text-xs font-bold ${petStats.health < 30 ? 'text-red-400' : 'text-white'}`}>{petStats.health}%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-white">Lvl {petStats.level}</span>
                </div>
            </div>

            <div className="absolute top-3 right-3 z-10">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md border border-white/5">
                    {petStats.name}
                </span>
            </div>

            {/* The 3D Canvas */}
            <div className="absolute inset-0 top-4">
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 10, 5]} intensity={1.5} />
                    <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={1} />
                    {PET_COMPONENTS[activePet as keyof typeof PET_COMPONENTS]}
                    <OrbitControls 
                        enableZoom={false} 
                        enablePan={false}
                        autoRotate 
                        autoRotateSpeed={petStats.health < 30 ? 0.5 : 1.5} // Slow down if tired
                        maxPolarAngle={Math.PI / 2 + 0.2}
                        minPolarAngle={Math.PI / 2 - 0.2}
                    />
                </Canvas>
            </div>
            
            <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
                 <div className="w-3/4 h-2 bg-black/20 blur-md rounded-[100%] shadow-[0_10px_20px_rgba(0,0,0,0.5)]"></div>
            </div>
        </div>
    );
}
