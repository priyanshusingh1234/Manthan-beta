const TopperBadge = () => (
  <Text className="relative inline-flex items-center justify-center group ml-1" title="Top Performer">
    {/* Animated glow effect */}
    <Text className="absolute inset-0 rounded-full bg-amber-400 blur-[2px] opacity-40 group-hover:opacity-100 group-hover:blur-[3px] transition-all duration-300 animate-pulse"></Text>
    
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10 drop-shadow-sm"
    >
      {/* The Outer Gold Shield/Hexagon */}
      <path 
        d="M12 2L4 5V11C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11V5L12 2Z" 
        fill="url(#goldGradient)"
      />
      
      {/* The Inner Star */}
      <path 
        d="M12 7L13.5 10.5H17L14.2 12.5L15.2 16L12 14L8.8 16L9.8 12.5L7 10.5H10.5L12 7Z" 
        fill="white"
      />

      <defs>
        <linearGradient id="goldGradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" /> {/* amber-400 */}
          <stop offset="50%" stopColor="#D97706" /> {/* amber-600 */}
          <stop offset="100%" stopColor="#92400E" /> {/* amber-800 */}
        </linearGradient>
      </defs>
    </svg>
  </Text>
);

export default TopperBadge;
