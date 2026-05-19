'use client';
import React from 'react';

const BADGE_DEFS: Record<string, React.FC<{ size?: number; animate?: boolean }>> = {};

function ShieldBadge({ gradientId, stops, glowColor, icon, size = 100, animate = false }: {
  gradientId: string; stops: string[]; glowColor: string;
  icon: React.ReactNode; size?: number; animate?: boolean;
}) {
  const uid = `${gradientId}-${size}`;
  return (
    <svg width={size} height={Math.round(size * 1.17)} viewBox="0 0 120 140" style={{ filter: `drop-shadow(0 0 ${animate ? 20 : 10}px ${glowColor})`, transition: 'filter 0.3s' }}>
      <defs>
        <linearGradient id={`g1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          {stops.map((s, i) => <stop key={i} offset={`${(i / (stops.length - 1)) * 100}%`} stop-color={s} />)}
        </linearGradient>
        <linearGradient id={`g2-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Base shield */}
      <path d="M60 6 L112 30 L112 90 Q112 122 60 136 Q8 122 8 90 L8 30 Z" fill={`url(#g1-${uid})`} />
      {/* 3D highlight overlay */}
      <path d="M60 12 L106 34 L106 90 Q106 118 60 130 Q14 118 14 90 L14 34 Z" fill={`url(#g2-${uid})`} />
      {/* Inner border */}
      <path d="M60 18 L100 38 L100 90 Q100 114 60 124 Q20 114 20 90 L20 38 Z" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.2" />
      {/* Shine spot */}
      <ellipse cx="36" cy="36" rx="13" ry="6" fill="#fff" fillOpacity="0.22" transform="rotate(-20,36,36)" />
      {/* Icon */}
      {icon}
      {/* Animated pulse ring */}
      {animate && (
        <circle cx="60" cy="71" r="52" fill="none" stroke={glowColor} strokeWidth="1" strokeOpacity="0.3">
          <animate attributeName="r" values="50;56;50" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

const BADGES: Record<string, React.FC<{ size?: number; animate?: boolean }>> = {
  Scholar: ({ size, animate }) => (
    <ShieldBadge gradientId="scholar" stops={['#cbd5e1','#64748b']} glowColor="#94a3b8" size={size} animate={animate}
      icon={<>
        <rect x="38" y="54" width="44" height="32" rx="3" fill="#fff" fillOpacity="0.9"/>
        <line x1="60" y1="54" x2="60" y2="86" stroke="#94a3b8" strokeWidth="2"/>
        <line x1="43" y1="63" x2="57" y2="63" stroke="#94a3b8" strokeWidth="1.5"/>
        <line x1="43" y1="70" x2="57" y2="70" stroke="#94a3b8" strokeWidth="1.5"/>
        <line x1="63" y1="63" x2="77" y2="63" stroke="#94a3b8" strokeWidth="1.5"/>
        <line x1="63" y1="70" x2="77" y2="70" stroke="#94a3b8" strokeWidth="1.5"/>
      </>}
    />
  ),
  Explorer: ({ size, animate }) => (
    <ShieldBadge gradientId="explorer" stops={['#4ade80','#15803d']} glowColor="#22c55e" size={size} animate={animate}
      icon={<>
        <circle cx="60" cy="70" r="20" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.9"/>
        <circle cx="60" cy="70" r="3" fill="#fff"/>
        <polygon points="60,52 56,68 60,66 64,68" fill="#fff"/>
        <polygon points="60,88 56,72 60,74 64,72" fill="#4ade80"/>
        <line x1="42" y1="70" x2="78" y2="70" stroke="#fff" strokeWidth="1" strokeOpacity="0.5"/>
      </>}
    />
  ),
  Spark: ({ size, animate }) => (
    <ShieldBadge gradientId="spark" stops={['#fde68a','#d97706']} glowColor="#f59e0b" size={size} animate={animate}
      icon={<polygon points="66,50 54,72 62,72 54,92 70,66 62,66 70,50" fill="#fff" fillOpacity="0.95"/>}
    />
  ),
  Catalyst: ({ size, animate }) => (
    <ShieldBadge gradientId="catalyst" stops={['#fb923c','#c2410c']} glowColor="#f97316" size={size} animate={animate}
      icon={<>
        <ellipse cx="60" cy="70" rx="22" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.8" transform="rotate(0,60,70)"/>
        <ellipse cx="60" cy="70" rx="22" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.8" transform="rotate(60,60,70)"/>
        <ellipse cx="60" cy="70" rx="22" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.8" transform="rotate(120,60,70)"/>
        <circle cx="60" cy="70" r="5" fill="#fff"/>
      </>}
    />
  ),
  Visionary: ({ size, animate }) => (
    <ShieldBadge gradientId="visionary" stops={['#c084fc','#7e22ce']} glowColor="#a855f7" size={size} animate={animate}
      icon={<>
        <path d="M32 70 Q60 50 88 70 Q60 90 32 70Z" fill="none" stroke="#fff" strokeWidth="2"/>
        <circle cx="60" cy="70" r="10" fill="#fff" fillOpacity="0.9"/>
        <circle cx="60" cy="70" r="6" fill="#7e22ce"/>
        <circle cx="57" cy="67" r="2" fill="#fff"/>
      </>}
    />
  ),
  Vanguard: ({ size, animate }) => (
    <ShieldBadge gradientId="vanguard" stops={['#60a5fa','#1d4ed8']} glowColor="#3b82f6" size={size} animate={animate}
      icon={<>
        <line x1="60" y1="50" x2="60" y2="92" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <line x1="48" y1="68" x2="72" y2="68" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        <polygon points="60,50 56,58 60,55 64,58" fill="#fff"/>
        <path d="M60 68 Q40 60 36 52" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.7"/>
        <path d="M60 68 Q80 60 84 52" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.7"/>
      </>}
    />
  ),
  Luminary: ({ size, animate }) => (
    <ShieldBadge gradientId="luminary" stops={['#fef08a','#eab308','#854d0e']} glowColor="#eab308" size={size} animate={animate}
      icon={<>
        <polygon points="60,50 63,64 77,64 66,72 70,86 60,78 50,86 54,72 43,64 57,64" fill="#fff" fillOpacity="0.95"/>
        <line x1="60" y1="45" x2="60" y2="40" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="60" y1="95" x2="60" y2="100" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="35" y1="70" x2="30" y2="70" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="85" y1="70" x2="90" y2="70" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.6"/>
      </>}
    />
  ),
  Apex: ({ size, animate }) => (
    <ShieldBadge gradientId="apex" stops={['#f87171','#991b1b']} glowColor="#ef4444" size={size} animate={animate}
      icon={<>
        <polygon points="60,50 40,88 80,88" fill="#fff" fillOpacity="0.9"/>
        <polygon points="60,50 50,70 60,65 70,70" fill="#f87171" fillOpacity="0.8"/>
        <line x1="40" y1="88" x2="80" y2="88" stroke="#fff" strokeWidth="2"/>
        <polygon points="60,50 54,62 66,62" fill="#fff"/>
      </>}
    />
  ),
  Pinnacle: ({ size, animate }) => (
    <svg width={size ?? 100} height={Math.round((size ?? 100) * 1.17)} viewBox="0 0 120 140"
      style={{ filter: `drop-shadow(0 0 ${animate ? 24 : 14}px #e879f9) drop-shadow(0 0 ${animate ? 12 : 6}px #818cf8)`, transition: 'filter 0.3s' }}>
      <defs>
        <linearGradient id={`pg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0abfc"/>
          <stop offset="33%" stopColor="#818cf8"/>
          <stop offset="66%" stopColor="#34d399"/>
          <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        <linearGradient id={`pg2-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.1"/>
        </linearGradient>
      </defs>
      <path d="M60 5 L112 30 L112 90 Q112 122 60 136 Q8 122 8 90 L8 30 Z" fill={`url(#pg-${size})`}/>
      <path d="M60 11 L106 34 L106 90 Q106 118 60 130 Q14 118 14 90 L14 34 Z" fill={`url(#pg2-${size})`}/>
      <path d="M60 18 L100 38 L100 90 Q100 114 60 124 Q20 114 20 90 L20 38 Z" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.2"/>
      <ellipse cx="36" cy="33" rx="14" ry="7" fill="#fff" fillOpacity="0.3" transform="rotate(-20,36,33)"/>
      {/* Crown */}
      <path d="M38 85 L38 65 L50 78 L60 60 L70 78 L82 65 L82 85 Z" fill="#fff" fillOpacity="0.95"/>
      <circle cx="38" cy="63" r="4" fill="#fbbf24"/>
      <circle cx="60" cy="58" r="4" fill="#f0abfc"/>
      <circle cx="82" cy="63" r="4" fill="#34d399"/>
      <rect x="36" y="83" width="48" height="5" rx="2.5" fill="#fff" fillOpacity="0.9"/>
      <polygon points="60,67 55,73 60,79 65,73" fill="#818cf8" fillOpacity="0.8"/>
      {animate && (
        <>
          <circle cx="60" cy="71" r="52" fill="none" stroke="#e879f9" strokeWidth="1" strokeOpacity="0.3">
            <animate attributeName="r" values="50;57;50" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="60" cy="71" r="52" fill="none" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.2">
            <animate attributeName="r" values="56;50;56" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.8s" repeatCount="indefinite"/>
          </circle>
        </>
      )}
    </svg>
  ),
};

export default function LeagueBadge({ name, size = 80, animate = false }: { name: string; size?: number; animate?: boolean }) {
  const Badge = BADGES[name];
  if (!Badge) return null;
  return <Badge size={size} animate={animate} />;
}
