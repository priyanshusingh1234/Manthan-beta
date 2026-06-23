// Shared league logic — used by both API and client components
export const LEAGUES = [
  { name: 'Scholar',   min: 0,   max: 99,   color: '#94a3b8', glow: '#94a3b8', gradient: ['#cbd5e1','#475569'] },
  { name: 'Explorer',  min: 100, max: 149,  color: '#22c55e', glow: '#22c55e', gradient: ['#4ade80','#15803d'] },
  { name: 'Spark',     min: 150, max: 199,  color: '#f59e0b', glow: '#f59e0b', gradient: ['#fde68a','#d97706'] },
  { name: 'Catalyst',  min: 200, max: 249,  color: '#f97316', glow: '#f97316', gradient: ['#fb923c','#c2410c'] },
  { name: 'Visionary', min: 250, max: 299,  color: '#a855f7', glow: '#a855f7', gradient: ['#c084fc','#7e22ce'] },
  { name: 'Vanguard',  min: 300, max: 349,  color: '#3b82f6', glow: '#3b82f6', gradient: ['#60a5fa','#1d4ed8'] },
  { name: 'Luminary',  min: 350, max: 399,  color: '#eab308', glow: '#eab308', gradient: ['#fef08a','#854d0e'] },
  { name: 'Apex',      min: 400, max: 449,  color: '#ef4444', glow: '#ef4444', gradient: ['#f87171','#991b1b'] },
  { name: 'Pinnacle',  min: 450, max: Infinity, color: '#e879f9', glow: '#e879f9', gradient: ['#f0abfc','#818cf8','#34d399','#fbbf24'] },
] as const;

export function getLeague(pts: number) {
  return LEAGUES.find(l => pts >= l.min && pts <= l.max) ?? LEAGUES[0];
}

export function getNextLeague(pts: number) {
  const idx = LEAGUES.findIndex(l => pts >= l.min && pts <= l.max);
  return idx < LEAGUES.length - 1 ? LEAGUES[idx + 1] : null;
}

export function getWeekKey() {
  // Use IST timezone for Indian users to align with midnight Sunday resets
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay()); // Roll back to Sunday
  return `${d.getFullYear()}-W${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Weekly reset: Free Fire style soft-reset
// Higher leagues drop more tiers, lower leagues drop fewer.
export function getResetPoints(pts: number): number {
  const currentIdx = LEAGUES.findIndex(l => pts >= l.min && pts <= l.max);
  const idx = currentIdx === -1 ? LEAGUES.length - 1 : currentIdx;
  
  let demotedIdx = 0;
  if (idx >= 7) {
    // Pinnacle (8) & Apex (7) drop to Visionary (4) [250 pts]
    demotedIdx = 4;
  } else if (idx >= 5) {
    // Luminary (6) & Vanguard (5) drop to Catalyst (3) [200 pts]
    demotedIdx = 3;
  } else if (idx >= 3) {
    // Visionary (4) & Catalyst (3) drop to Spark (2) [150 pts]
    demotedIdx = 2;
  } else if (idx >= 1) {
    // Spark (2) & Explorer (1) drop to Scholar (0) [0 pts]
    demotedIdx = 0;
  }
  
  return LEAGUES[demotedIdx].min;
}
