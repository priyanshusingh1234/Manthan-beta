// Level thresholds: Level 1 = 0 XP, Level 2 = 50 XP, Level 3 = 100 XP, etc.
// Level N starts at (N-1) * 50 XP
export const XP_PER_LEVEL = 50;

export function getLevel(xp: number) {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const levelStartXp = (level - 1) * XP_PER_LEVEL;
    const nextLevelXp = level * XP_PER_LEVEL;
    const xpInLevel = xp - levelStartXp;
    const progressPct = (xpInLevel / XP_PER_LEVEL) * 100;
    return { level, xpInLevel, nextLevelXp, levelStartXp, progressPct };
}
