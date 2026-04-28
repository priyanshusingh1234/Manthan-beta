'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── Shared animated body ──────────────────────────────────────────────────────
function FloatGroup({ children, speed = 1.5 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * speed) * 0.12;
  });
  return <group ref={ref}>{children}</group>;
}

// ── Soldier (French Royal Guard) ─────────────────────────────────────────────
function SoldierMesh({ attacking, hit }: { attacking: boolean; hit: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (attacking) groupRef.current.position.x = -1.2 + Math.sin(clock.elapsedTime * 20) * 1.0;
    else if (hit) groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 25) * 0.25;
    else { groupRef.current.position.x = 0; groupRef.current.rotation.z = 0; }
  });
  return (
    <group ref={groupRef}>
      <FloatGroup speed={1.8}>
        {/* Hat */}
        <Box args={[0.7, 0.45, 0.5]} position={[0, 2.15, 0]}>
          <meshStandardMaterial color="#8B0000" roughness={0.5} />
        </Box>
        {/* Head */}
        <Sphere args={[0.38, 20, 20]} position={[0, 1.62, 0]}>
          <meshStandardMaterial color="#FDBCB4" />
        </Sphere>
        {/* Eyes */}
        <Sphere args={[0.06]} position={[-0.13, 1.68, 0.35]}>
          <meshStandardMaterial color="#222" />
        </Sphere>
        <Sphere args={[0.06]} position={[0.13, 1.68, 0.35]}>
          <meshStandardMaterial color="#222" />
        </Sphere>
        {/* Body coat */}
        <Box args={[0.9, 1.2, 0.5]} position={[0, 0.6, 0]}>
          <meshStandardMaterial color="#CC2200" roughness={0.6} />
        </Box>
        {/* White shirt strip */}
        <Box args={[0.2, 0.8, 0.52]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#eee" />
        </Box>
        {/* Left arm */}
        <Box args={[0.25, 0.9, 0.25]} position={[-0.6, 0.65, 0]} rotation={[0, 0, 0.3]}>
          <meshStandardMaterial color="#CC2200" />
        </Box>
        {/* Right arm (sword arm) */}
        <Box args={[0.25, 0.9, 0.25]} position={[0.6, 0.65, 0]} rotation={[0, 0, -0.4]}>
          <meshStandardMaterial color="#CC2200" />
        </Box>
        {/* Sword */}
        <Box args={[0.05, 1.4, 0.05]} position={[1.0, 0.5, 0]} rotation={[0, 0, -0.3]}>
          <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Sword guard */}
        <Box args={[0.3, 0.07, 0.07]} position={[0.95, 0.95, 0]}>
          <meshStandardMaterial color="#777" metalness={0.8} />
        </Box>
        {/* Legs */}
        <Box args={[0.32, 0.9, 0.32]} position={[-0.22, -0.45, 0]}>
          <meshStandardMaterial color="#1a1a40" />
        </Box>
        <Box args={[0.32, 0.9, 0.32]} position={[0.22, -0.45, 0]}>
          <meshStandardMaterial color="#1a1a40" />
        </Box>
        {/* Boots */}
        <Box args={[0.36, 0.25, 0.45]} position={[-0.22, -0.95, 0.05]}>
          <meshStandardMaterial color="#333" />
        </Box>
        <Box args={[0.36, 0.25, 0.45]} position={[0.22, -0.95, 0.05]}>
          <meshStandardMaterial color="#333" />
        </Box>
      </FloatGroup>
    </group>
  );
}

// ── General (Duke Metternich-style) ──────────────────────────────────────────
function GeneralMesh({ attacking, hit }: { attacking: boolean; hit: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (attacking) groupRef.current.position.x = -1.4 + Math.sin(clock.elapsedTime * 18) * 1.1;
    else if (hit) groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 22) * 0.3;
    else { groupRef.current.position.x = 0; groupRef.current.rotation.z = 0; }
  });
  return (
    <group ref={groupRef}>
      <FloatGroup speed={1.4}>
        {/* Bicorne hat */}
        <Box args={[1.1, 0.2, 0.4]} position={[0, 2.35, 0]}>
          <meshStandardMaterial color="#1a237e" />
        </Box>
        <Box args={[0.65, 0.55, 0.45]} position={[0, 2.2, 0]}>
          <meshStandardMaterial color="#283593" />
        </Box>
        {/* Face */}
        <Sphere args={[0.42, 20, 20]} position={[0, 1.62, 0]}>
          <meshStandardMaterial color="#F5CBA7" />
        </Sphere>
        {/* Stern eyes */}
        <Sphere args={[0.07]} position={[-0.15, 1.68, 0.38]}><meshStandardMaterial color="#111" /></Sphere>
        <Sphere args={[0.07]} position={[0.15, 1.68, 0.38]}><meshStandardMaterial color="#111" /></Sphere>
        {/* Sideburns */}
        <Box args={[0.12, 0.4, 0.1]} position={[-0.4, 1.5, 0.25]}><meshStandardMaterial color="#4a2c00" /></Box>
        <Box args={[0.12, 0.4, 0.1]} position={[0.4, 1.5, 0.25]}><meshStandardMaterial color="#4a2c00" /></Box>
        {/* Body — dark blue General's coat */}
        <Box args={[1.0, 1.3, 0.55]} position={[0, 0.55, 0]}>
          <meshStandardMaterial color="#283593" roughness={0.5} />
        </Box>
        {/* Gold epaulettes */}
        <Box args={[0.5, 0.18, 0.55]} position={[-0.75, 1.1, 0]}><meshStandardMaterial color="#FFD700" metalness={0.6} /></Box>
        <Box args={[0.5, 0.18, 0.55]} position={[0.75, 1.1, 0]}><meshStandardMaterial color="#FFD700" metalness={0.6} /></Box>
        {/* Gold medals */}
        <Sphere args={[0.1]} position={[-0.3, 0.9, 0.3]}><meshStandardMaterial color="#FFD700" metalness={0.8} /></Sphere>
        <Sphere args={[0.1]} position={[-0.3, 0.7, 0.3]}><meshStandardMaterial color="#e11d48" metalness={0.5} /></Sphere>
        {/* White collar */}
        <Box args={[0.28, 0.4, 0.57]} position={[0, 1.1, 0]}><meshStandardMaterial color="#eee" /></Box>
        {/* Scroll */}
        <Cylinder args={[0.15, 0.15, 0.8]} position={[0.85, 0.5, 0]} rotation={[0, 0, -0.5]}>
          <meshStandardMaterial color="#F5F5DC" roughness={0.9} />
        </Cylinder>
        {/* Arms */}
        <Box args={[0.28, 1.0, 0.28]} position={[-0.65, 0.55, 0]} rotation={[0, 0, 0.2]}><meshStandardMaterial color="#283593" /></Box>
        <Box args={[0.28, 1.0, 0.28]} position={[0.65, 0.55, 0]} rotation={[0, 0, -0.5]}><meshStandardMaterial color="#283593" /></Box>
        {/* Legs */}
        <Box args={[0.35, 1.0, 0.35]} position={[-0.25, -0.5, 0]}><meshStandardMaterial color="#1a1a3e" /></Box>
        <Box args={[0.35, 1.0, 0.35]} position={[0.25, -0.5, 0]}><meshStandardMaterial color="#1a1a3e" /></Box>
        {/* Boots */}
        <Box args={[0.42, 0.28, 0.5]} position={[-0.25, -1.05, 0.05]}><meshStandardMaterial color="#222" /></Box>
        <Box args={[0.42, 0.28, 0.5]} position={[0.25, -1.05, 0.05]}><meshStandardMaterial color="#222" /></Box>
      </FloatGroup>
    </group>
  );
}

// ── BOSS — Bismarck (Iron Chancellor) ────────────────────────────────────────
function BossMesh({ attacking, hit }: { attacking: boolean; hit: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (attacking) groupRef.current.position.x = -1.6 + Math.sin(clock.elapsedTime * 15) * 1.3;
    else if (hit) groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 20) * 0.35;
    else { groupRef.current.position.x = 0; groupRef.current.rotation.z = 0; }
    if (glowRef.current) glowRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 3) * 0.5;
  });

  return (
    <group ref={groupRef} scale={[1.3, 1.3, 1.3]}>
      <pointLight ref={glowRef} color="#ff6600" intensity={1.5} position={[0, 1, 1]} distance={5} />
      <FloatGroup speed={1.0}>
        {/* Pickelhaube spike */}
        <Cylinder args={[0.04, 0.12, 0.7]} position={[0, 2.9, 0]}>
          <meshStandardMaterial color="#aaa" metalness={0.9} />
        </Cylinder>
        {/* Helmet */}
        <Box args={[0.9, 0.55, 0.8]} position={[0, 2.45, 0]}>
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
        </Box>
        <Box args={[1.05, 0.18, 0.9]} position={[0, 2.18, 0]}>
          <meshStandardMaterial color="#333" metalness={0.4} />
        </Box>
        {/* Face */}
        <Box args={[0.75, 0.75, 0.65]} position={[0, 1.62, 0]}>
          <meshStandardMaterial color="#c9956a" />
        </Box>
        {/* Glowing eyes */}
        <Sphere args={[0.1]} position={[-0.2, 1.72, 0.35]}><meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2} /></Sphere>
        <Sphere args={[0.1]} position={[0.2, 1.72, 0.35]}><meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2} /></Sphere>
        {/* Huge mustache */}
        <Box args={[0.55, 0.12, 0.2]} position={[0, 1.47, 0.35]}><meshStandardMaterial color="#3d2000" /></Box>
        {/* Body — Iron military coat */}
        <Box args={[1.1, 1.5, 0.65]} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#111" roughness={0.7} />
        </Box>
        {/* Gold epaulettes */}
        <Box args={[0.6, 0.22, 0.65]} position={[-0.85, 1.15, 0]}><meshStandardMaterial color="#B8860B" metalness={0.7} /></Box>
        <Box args={[0.6, 0.22, 0.65]} position={[0.85, 1.15, 0]}><meshStandardMaterial color="#B8860B" metalness={0.7} /></Box>
        {/* Iron Cross medal */}
        <Box args={[0.3, 0.3, 0.1]} position={[-0.35, 0.9, 0.35]}><meshStandardMaterial color="#111" metalness={0.8} /></Box>
        <Box args={[0.32, 0.06, 0.12]} position={[-0.35, 0.9, 0.37]}><meshStandardMaterial color="#888" metalness={0.9} /></Box>
        <Box args={[0.06, 0.32, 0.12]} position={[-0.35, 0.9, 0.37]}><meshStandardMaterial color="#888" metalness={0.9} /></Box>
        {/* White collar */}
        <Box args={[0.32, 0.42, 0.67]} position={[0, 1.1, 0]}><meshStandardMaterial color="#eee" /></Box>
        {/* Iron fist */}
        <Box args={[0.38, 0.38, 0.38]} position={[0.9, 0.3, 0]}><meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} /></Box>
        {/* Arms */}
        <Box args={[0.32, 1.1, 0.32]} position={[-0.72, 0.45, 0]} rotation={[0, 0, 0.15]}><meshStandardMaterial color="#111" /></Box>
        <Box args={[0.32, 1.1, 0.32]} position={[0.72, 0.45, 0]} rotation={[0, 0, -0.15]}><meshStandardMaterial color="#111" /></Box>
        {/* Thick legs */}
        <Box args={[0.42, 1.1, 0.42]} position={[-0.28, -0.55, 0]}><meshStandardMaterial color="#0a0a0a" /></Box>
        <Box args={[0.42, 1.1, 0.42]} position={[0.28, -0.55, 0]}><meshStandardMaterial color="#0a0a0a" /></Box>
        {/* Iron boots */}
        <Box args={[0.5, 0.32, 0.6]} position={[-0.28, -1.2, 0.08]}><meshStandardMaterial color="#444" metalness={0.5} /></Box>
        <Box args={[0.5, 0.32, 0.6]} position={[0.28, -1.2, 0.08]}><meshStandardMaterial color="#444" metalness={0.5} /></Box>
      </FloatGroup>
    </group>
  );
}

// ── Player (Student / Kabir) ──────────────────────────────────────────────────
function PlayerMesh({ attacking, hit }: { attacking: boolean; hit: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (attacking) groupRef.current.position.x = Math.sin(clock.elapsedTime * 20) * 1.0;
    else if (hit) groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 25) * -0.3;
    else { groupRef.current.position.x = 0; groupRef.current.rotation.z = 0; }
  });
  return (
    <group ref={groupRef}>
      <FloatGroup speed={2}>
        {/* Hair */}
        <Sphere args={[0.38, 16, 16]} position={[0, 1.65, 0]}><meshStandardMaterial color="#2c1810" /></Sphere>
        {/* Face */}
        <Sphere args={[0.35, 20, 20]} position={[0, 1.52, 0]}><meshStandardMaterial color="#FDBCB4" /></Sphere>
        <Sphere args={[0.06]} position={[-0.12, 1.58, 0.33]}><meshStandardMaterial color="#333" /></Sphere>
        <Sphere args={[0.06]} position={[0.12, 1.58, 0.33]}><meshStandardMaterial color="#333" /></Sphere>
        {/* Smile */}
        <Box args={[0.18, 0.05, 0.05]} position={[0, 1.42, 0.34]} rotation={[0.2, 0, 0]}><meshStandardMaterial color="#c0845c" /></Box>
        {/* Hoodie body */}
        <Box args={[0.88, 1.15, 0.5]} position={[0, 0.5, 0]}><meshStandardMaterial color="#4338CA" roughness={0.7} /></Box>
        {/* Book */}
        <Box args={[0.55, 0.72, 0.1]} position={[0.7, 0.5, 0]} rotation={[0, -0.2, 0]}><meshStandardMaterial color="#FBBF24" /></Box>
        <Box args={[0.48, 0.64, 0.04]} position={[0.72, 0.5, 0.07]}><meshStandardMaterial color="#FFF9C4" /></Box>
        {/* Arms */}
        <Box args={[0.26, 1.0, 0.26]} position={[-0.6, 0.5, 0]} rotation={[0, 0, 0.15]}><meshStandardMaterial color="#4338CA" /></Box>
        <Box args={[0.26, 1.0, 0.26]} position={[0.6, 0.5, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color="#4338CA" /></Box>
        {/* Jeans */}
        <Box args={[0.34, 0.95, 0.34]} position={[-0.22, -0.45, 0]}><meshStandardMaterial color="#1E40AF" /></Box>
        <Box args={[0.34, 0.95, 0.34]} position={[0.22, -0.45, 0]}><meshStandardMaterial color="#1E40AF" /></Box>
        {/* Sneakers */}
        <Box args={[0.4, 0.22, 0.5]} position={[-0.22, -1.0, 0.05]}><meshStandardMaterial color="#f8fafc" /></Box>
        <Box args={[0.4, 0.22, 0.5]} position={[0.22, -1.0, 0.05]}><meshStandardMaterial color="#f8fafc" /></Box>
      </FloatGroup>
    </group>
  );
}

// ── Scene background ──────────────────────────────────────────────────────────
function BattleBg({ isBoss }: { isBoss: boolean }) {
  return (
    <>
      <Stars radius={100} depth={50} count={isBoss ? 2000 : 1000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={[isBoss ? '#1a0000' : '#0a0a1a', 8, 25]} />
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={isBoss ? '#1a0000' : '#0a0a1a'} roughness={1} />
      </mesh>
    </>
  );
}

// ── Public battle Canvas components ──────────────────────────────────────────
export type CharState = 'idle' | 'attacking' | 'hit' | 'dead';

interface BattleSceneProps {
  enemyType: 'soldier' | 'general' | 'boss';
  enemyState: CharState;
  playerState: CharState;
}

export function BattleScene({ enemyType, enemyState, playerState }: BattleSceneProps) {
  const isAttacking = (s: CharState) => s === 'attacking';
  const isHit = (s: CharState) => s === 'hit';

  return (
    <Canvas camera={{ position: [0, 1, 6], fov: 45 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      {enemyType === 'boss' && <pointLight position={[-2, 2, 3]} color="#ff6600" intensity={2} />}

      <BattleBg isBoss={enemyType === 'boss'} />

      {/* Player — left side */}
      <group position={[-2.2, 0, 0]}>
        <PlayerMesh attacking={isAttacking(playerState)} hit={isHit(playerState)} />
      </group>

      {/* Enemy — right side, faces left */}
      <group position={[2.2, 0, 0]} scale={[-1, 1, 1]}>
        {enemyType === 'soldier' && <SoldierMesh attacking={isAttacking(enemyState)} hit={isHit(enemyState)} />}
        {enemyType === 'general' && <GeneralMesh attacking={isAttacking(enemyState)} hit={isHit(enemyState)} />}
        {enemyType === 'boss'    && <BossMesh    attacking={isAttacking(enemyState)} hit={isHit(enemyState)} />}
      </group>
    </Canvas>
  );
}
