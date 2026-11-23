import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLevelProgress } from './levels.js';

const boundaries = [
  [0, 1, 'Rookie', 25], [24, 1, 'Rookie', 1],
  [25, 2, 'Agile Explorer', 30], [54, 2, 'Agile Explorer', 1],
  [55, 3, 'Sprinter', 35], [89, 3, 'Sprinter', 1],
  [90, 4, 'Sprint Strategist', 35], [124, 4, 'Sprint Strategist', 1],
  [125, 5, 'Scrum Pro', 0], [140, 5, 'Scrum Pro', 0],
];

for (const [xp, level, title, remaining] of boundaries) {
  test(`${xp} XP gives Level ${level} ${title}, with ${remaining} XP to the next level`, () => {
    const result = getLevelProgress(xp);
    assert.equal(result.level, level);
    assert.equal(result.levelTitle, title);
    assert.equal(result.xpToNextLevel, remaining);
    assert.equal(result.isMaxLevel, level === 5);
    assert.ok(result.levelPercent >= 0 && result.levelPercent <= 100);
    if (level === 5) {
      assert.equal(result.nextLevel, null);
      assert.equal(result.levelPercent, 100);
    } else {
      assert.equal(result.nextLevel.level, level + 1);
      assert.equal(result.nextLevel.minXp, xp + remaining);
      assert.equal(result.levelPercent, (xp - result.levelStartXp) / (xp + remaining - result.levelStartXp) * 100);
    }
  });
}

test('level progress resets at a new threshold and stays capped beyond maximum XP', () => {
  for (const xp of [0, 25, 55, 90]) assert.equal(getLevelProgress(xp).levelPercent, 0);
  assert.equal(getLevelProgress(40).levelPercent, 50);
  assert.equal(getLevelProgress(1000).levelPercent, 100);
  assert.equal(getLevelProgress(1000).level, 5);
});
