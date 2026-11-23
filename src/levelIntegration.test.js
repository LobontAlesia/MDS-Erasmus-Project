import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { STORAGE_KEY, MAX_XP, PRACTICES, QUESTIONS, ROLES } from './data.js';
import { derive, emptyProgress, loadProgress, recordMissionCompletion, recordPracticeOpen, recordQuizAnswer } from './progress.js';

beforeEach(() => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, String(value)),
  };
});
afterEach(() => { delete globalThis.localStorage; });

function reload(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return loadProgress();
}

function completeMissions() {
  let progress = recordMissionCompletion(emptyProgress(), 'intro');
  progress = recordMissionCompletion(progress, 'risks');
  for (let index = 0; index < PRACTICES.length; index++) progress = recordPracticeOpen(progress, index);
  return progress;
}

test('existing Sprint 1 saves derive the new level while preserving rewards, badges and roles', () => {
  const saved = { role: 'Scrum Master', done: { intro: true, risks: true }, opened: [0, 1, 2, 3], correct: [0, 1, 2] };
  const restored = reload(saved);
  const result = derive(restored);
  assert.equal(result.xp, 70);
  assert.equal(result.level, 3);
  assert.equal(result.levelTitle, 'Sprinter');
  assert.equal(result.xpToNextLevel, 20);
  assert.deepEqual(result.badges, [true, true, false, true]);
  assert.deepEqual(result.order, [0, 3, 1, 2]);
  assert.equal(result.nextIndex, 2);
  assert.deepEqual(reload(restored), restored);
});

test('saved 125 and 140 XP progress derives maximum level without storing or rewarding a level', () => {
  for (const misses of [0, 1]) {
    let progress = completeMissions();
    for (const [index, q] of QUESTIONS.entries()) {
      if (misses && index < 3) progress = recordQuizAnswer(progress, q.id, (q.correct + 1) % q.a.length);
      progress = recordQuizAnswer(progress, q.id, q.correct);
    }
    const before = structuredClone(progress);
    for (let repeat = 0; repeat < 3; repeat++) {
      progress = reload(progress);
      for (const role of ROLES) {
        const result = derive({ ...progress, role: role.id });
        assert.equal(result.xp, misses ? 125 : MAX_XP);
        assert.equal(result.quizXp, misses ? 85 : 100);
        assert.equal(result.level, 5);
        assert.equal(result.levelTitle, 'Scrum Pro');
        assert.equal(result.isMaxLevel, true);
        assert.equal(result.nextLevel, null);
        assert.equal(result.xpToNextLevel, 0);
        assert.equal(result.levelPercent, 100);
        assert.deepEqual(result.badges, [true, true, true, true]);
        assert.equal(result.doneCount, 4);
        assert.equal(result.nextIndex, -1);
      }
      assert.deepEqual(progress, before);
    }
  }
});

test('crossing a level threshold keeps 10/5/0 quiz rewards and ignores repeated answers', () => {
  for (const misses of [0, 1, 2]) {
    let progress = recordMissionCompletion(emptyProgress(), 'intro');
    progress = recordMissionCompletion(progress, 'risks');
    const q = QUESTIONS[0];
    for (let index = 0; index < misses; index++) progress = recordQuizAnswer(progress, q.id, (q.correct + 1) % q.a.length);
    progress = recordQuizAnswer(progress, q.id, q.correct);
    const result = derive(progress);
    assert.equal(result.xp, 20 + [10, 5, 0][misses]);
    assert.equal(result.quizXp, [10, 5, 0][misses]);
    assert.equal(result.level, misses === 2 ? 1 : 2);
    assert.equal(result.nextIndex, 1);
    assert.strictEqual(recordQuizAnswer(progress, q.id, q.correct), progress);
    assert.deepEqual(derive(reload(progress)), result);
  }
});

test('repeated mission and practice updates grant each existing reward only once', () => {
  let progress = emptyProgress();
  for (let repeat = 0; repeat < 20; repeat++) {
    progress = recordMissionCompletion(progress, 'intro');
    progress = recordMissionCompletion(progress, 'risks');
    for (let index = 0; index < PRACTICES.length; index++) progress = recordPracticeOpen(progress, index);
  }
  assert.equal(derive(progress).xp, 40);
  assert.equal(derive(progress).level, 2);
  assert.deepEqual(progress.opened, [0, 1, 2, 3]);
  assert.strictEqual(recordMissionCompletion(progress, 'poker'), progress);
  for (const index of [-1, 4, '0', 0.5]) assert.strictEqual(recordPracticeOpen(progress, index), progress);
  assert.equal(derive(emptyProgress()).level, 1);
});
