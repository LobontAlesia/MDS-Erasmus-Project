/** US-11: levels are derived from earned XP, never saved or rewarded separately. */
export const LEVELS = Object.freeze([
  { level: 1, title: 'Rookie', minXp: 0 },
  { level: 2, title: 'Agile Explorer', minXp: 25 },
  { level: 3, title: 'Sprinter', minXp: 55 },
  { level: 4, title: 'Sprint Strategist', minXp: 90 },
  { level: 5, title: 'Scrum Pro', minXp: 125 },
].map(Object.freeze));

export function getLevelProgress(xp) {
  const current = LEVELS.findLast((entry) => xp >= entry.minXp) ?? LEVELS[0];
  const nextLevel = LEVELS[current.level] ?? null;
  return {
    level: current.level,
    levelTitle: current.title,
    levelStartXp: current.minXp,
    nextLevel,
    xpToNextLevel: nextLevel ? nextLevel.minXp - xp : 0,
    levelPercent: nextLevel
      ? Math.max(0, Math.min(100, (xp - current.minXp) / (nextLevel.minXp - current.minXp) * 100))
      : 100,
    isMaxLevel: nextLevel === null,
  };
}
