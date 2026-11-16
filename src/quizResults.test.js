import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QUESTIONS } from './data.js';
import { getQuizStars } from './quiz.js';
import { derive, emptyProgress, recordQuizAnswer } from './progress.js';

function finishWithXp(target) {
  let progress = emptyProgress();
  for (const question of QUESTIONS) {
    const reward = target >= 10 ? 10 : target >= 5 ? 5 : 0;
    const misses = reward === 10 ? 0 : reward === 5 ? 1 : 2;
    for (let i = 0; i < misses; i++) {
      progress = recordQuizAnswer(progress, question.id, (question.correct + 1) % question.a.length);
    }
    progress = recordQuizAnswer(progress, question.id, question.correct);
    target -= reward;
  }
  return progress;
}

for (const [xp, stars] of [[0, 1], [55, 1], [59, 1], [60, 2], [85, 2], [89, 2], [90, 3], [100, 3]]) {
  test(`${xp} out of 100 XP gives ${stars} performance stars`, () => {
    assert.equal(getQuizStars(xp, 100), stars);
  });
}

test('results stay ineligible until every question is correctly completed', () => {
  let progress = emptyProgress();
  for (const question of QUESTIONS.slice(0, -1)) progress = recordQuizAnswer(progress, question.id, question.correct);
  const result = derive(progress);
  assert.equal(result.quizXp, 90);
  assert.equal(result.quizCorrectCount, 9);
  assert.equal(result.completed[2], false);
  assert.equal(result.badges[2], false);
  assert.equal(result.quizStars, 0);
});

test('a zero-XP completion still qualifies for victory, the badge and one star', () => {
  const progress = finishWithXp(0);
  const result = derive(progress);
  assert.equal(result.quizXp, 0);
  assert.equal(result.quizMaxXp, 100);
  assert.equal(result.quizCorrectCount, 10);
  assert.equal(result.quizAttempts, 30);
  assert.equal(result.completed[2], true);
  assert.equal(result.badges[2], true);
  assert.equal(result.quizStars, 1);
});

test('stars use quiz XP rather than XP earned from other missions', () => {
  const progress = { ...finishWithXp(55), done: { intro: true, risks: true }, opened: [0, 1, 2, 3] };
  const result = derive(progress);
  assert.equal(result.xp, 95);
  assert.equal(result.quizXp, 55);
  assert.equal(result.quizStars, 1);
});

test('reopening results and reviewing completed answers never changes XP or badge state', () => {
  const progress = finishWithXp(85);
  const before = structuredClone(progress);
  for (let i = 0; i < 10; i++) {
    const result = derive(progress);
    assert.equal(result.quizXp, 85);
    assert.equal(result.quizStars, 2);
    assert.equal(result.badges.filter(Boolean).length, 1);
    for (const question of QUESTIONS) assert.strictEqual(recordQuizAnswer(progress, question.id, question.correct), progress);
  }
  assert.deepEqual(progress, before);
});
