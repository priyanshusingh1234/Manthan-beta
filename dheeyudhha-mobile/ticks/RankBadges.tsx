import React from 'react';

const BadgeContainer = ({ children, label, glowColor }: { children: React.ReactNode, label: string, glowColor: string }) => (
  <Text className="relative inline-flex items-center justify-center group ml-1 select-none" title={label}>
    {/* Animated glow effect */}
    <Text className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-70 group-hover:blur-[6px] transition-all duration-500 animate-pulse" style={{ backgroundColor: glowColor, filter: 'blur(3px)' }}></Text>
    <View className="relative z-10 transform transition-all duration-500 group-hover:scale-125 group-hover:-translate-y-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
      {children}
    </View>
  </Text>
);

export const GoldBadge = () => (
  <BadgeContainer label="1st Place Champion" glowColor="#FBBF24">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur stdDeviation="1" result="blur" />
           <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Wings / Aura */}
      <path d="M4 10C2 8 2 4 6 4M20 10C22 8 22 4 18 4" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
      
      {/* Crown Shape */}
      <path d="M12 2L15 5H9L12 2Z" fill="#FBBF24" />
      
      {/* The Shield */}
      <path 
        d="M12 4L5 7V12C5 17.5 8.5 21.5 12 23C15.5 21.5 19 17.5 19 12V7L12 4Z" 
        fill="url(#goldGrad)"
        stroke="#78350F"
        strokeWidth="0.5"
      />
      
      {/* Rank Icon (Star) */}
      <path 
        d="M12 9L13.2 11.5H16L13.8 13.2L14.6 15.8L12.4 14.2L10.2 15.8L11 13.2L8.8 11.5H11.6L12.8 9Z" 
        fill="white"
        filter="url(#goldGlow)"
      />
    </svg>
  </BadgeContainer>
);

export const SilverBadge = () => (
  <BadgeContainer label="2nd Place Elite" glowColor="#94A3B8">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="silverGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      
      {/* Sharp Diamond Shield */}
      <path 
        d="M12 2L20 6V12C20 18 12 22 12 22C12 22 4 18 4 12V6L12 2Z" 
        fill="url(#silverGrad)"
        stroke="#1E293B"
        strokeWidth="1"
      />
      
      {/* Rank Number */}
      <text x="12" y="16" fill="white" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="system-ui" stroke="#000" strokeWidth="0.2">2</text>
    </svg>
  </BadgeContainer>
);

export const BronzeBadge = () => (
  <BadgeContainer label="3rd Place Pro" glowColor="#D97706">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bronzeGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>
      </defs>
      
      {/* Ribbon */}
      <path d="M8 15V22L12 20L16 22V15" fill="#7C2D12" opacity="0.8" />
      
      {/* Circular Medal */}
      <circle cx="12" cy="11" r="9" fill="url(#bronzeGrad)" stroke="#431407" strokeWidth="1.5" />
      <circle cx="12" cy="11" r="7" stroke="white" strokeWidth="0.5" strokeDasharray="2 1" opacity="0.5" />
      
      {/* Rank Number */}
      <text x="12" y="15" fill="white" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="system-ui">3</text>
    </svg>
  </BadgeContainer>
);

// Map rank to badge
export const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <GoldBadge />;
  if (rank === 2) return <SilverBadge />;
  if (rank === 3) return <BronzeBadge />;
  return null;
};
