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

export function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Monthly reset: what pts a user starts with next month
export function getResetPoints(pts: number): number {
  if (pts >= 450) return 200;
  if (pts >= 400) return 200;
  if (pts >= 350) return 200;
  if (pts >= 250) return 150;
  if (pts >= 200) return 150;
  if (pts >= 100) return 50;
  return 50;
}
