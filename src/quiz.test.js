import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QUESTIONS, MISSIONS, MAX_XP } from './data.js';
import { shuffle, createQuizChallenge, restoreQuizChallenge } from './quiz.js';
import { derive, emptyProgress, recordQuizAnswer } from './progress.js';

const ids = QUESTIONS.map((q) => q.id);
const sorted = (items) => [...items].sort();

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('the question bank has ten unique IDs, valid answers and educational explanations', () => {
  assert.equal(QUESTIONS.length, 10);
  assert.equal(new Set(ids).size, 10);
  for (const q of QUESTIONS) {
    assert.equal(typeof q.id, 'string');
    assert.ok(q.id && q.q && q.why);
    assert.ok(q.a.length === 3 || q.a.length === 4);
    assert.equal(new Set(q.a).size, q.a.length);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.a.length);
  }
  assert.equal(MISSIONS[2].xp, 100);
  assert.ok(MISSIONS[2].desc.includes('10'));
  assert.equal(MAX_XP, 140);
});

test('Fisher-Yates swaps from the end without mutating the input', () => {
  const input = [1, 2, 3];
  let calls = 0;
  assert.deepEqual(shuffle(input, () => { calls++; return 0; }), [2, 3, 1]);
  assert.equal(calls, 2);
  assert.deepEqual(input, [1, 2, 3]);
  const never = () => { throw new Error('No randomness needed'); };
  assert.deepEqual(shuffle([], never), []);
  assert.deepEqual(shuffle([1], never), [1]);
});

test('each challenge contains every question and every answer exactly once across 100 seeds', () => {
  const bank = structuredClone(QUESTIONS);
  for (let seed = 0; seed < 100; seed++) {
    const challenge = createQuizChallenge(seededRandom(seed));
    assert.deepEqual(sorted(challenge.questionOrder), sorted(ids));
    assert.equal(new Set(challenge.questionOrder).size, 10);
    assert.equal(challenge.currentQuestionId, challenge.questionOrder[0]);
    for (const q of QUESTIONS) {
      assert.deepEqual(sorted(challenge.answerOrder[q.id]), q.a.map((_, i) => i));
    }
  }
  assert.deepEqual(QUESTIONS, bank);
});

test('different random seeds produce different question and answer orders', () => {
  const first = createQuizChallenge(seededRandom(1));
  const second = createQuizChallenge(seededRandom(2));
  assert.notDeepEqual(first.questionOrder, second.questionOrder);
  assert.notDeepEqual(first.answerOrder, second.answerOrder);
});

test('displayed answer positions map back to the correct canonical answer', () => {
  const challenge = createQuizChallenge(() => 0);
  let progress = { ...emptyProgress(), quizChallenge: challenge };
  let movedAnswers = 0;
  for (const id of challenge.questionOrder) {
    const q = QUESTIONS.find((question) => question.id === id);
    const displayPosition = challenge.answerOrder[id].indexOf(q.correct);
    if (displayPosition !== q.correct) movedAnswers++;
    const submittedOption = challenge.answerOrder[id][displayPosition];
    progress = recordQuizAnswer(progress, id, submittedOption);
    assert.equal(progress.quizXp[id], 10);
    assert.equal(progress.quizAttempts[id], 1);
  }
  assert.ok(movedAnswers > 0);
  assert.equal(derive(progress).xp, 100);
  assert.equal(derive(progress).completed[2], true);
});

test('a valid saved challenge restores exactly without drawing any randomness', () => {
  const challenge = createQuizChallenge(seededRandom(42));
  challenge.currentQuestionId = challenge.questionOrder[7];
  const restored = restoreQuizChallenge(JSON.parse(JSON.stringify(challenge)), () => {
    throw new Error('Valid saved orders must never shuffle again');
  });
  assert.deepEqual(restored, challenge);
  assert.notStrictEqual(restored.questionOrder, challenge.questionOrder);
});

test('incomplete or invalid saved orders are repaired while keeping valid order and position', () => {
  const [first, second] = QUESTIONS;
  const saved = {
    questionOrder: [second.id, first.id, second.id, 'unknown'],
    answerOrder: { [first.id]: [2, 1, 0], [second.id]: [0, 0, 2] },
    currentQuestionId: first.id,
  };
  const restored = restoreQuizChallenge(saved, () => 0);
  assert.deepEqual(restored.questionOrder.slice(0, 2), [second.id, first.id]);
  assert.deepEqual(sorted(restored.questionOrder), sorted(ids));
  assert.deepEqual(restored.answerOrder[first.id], [2, 1, 0]);
  assert.deepEqual(sorted(restored.answerOrder[second.id]), [0, 1, 2]);
  assert.equal(restored.currentQuestionId, first.id);
  assert.equal(new Set(restored.questionOrder).size, 10);
});

test('missing challenge state stays unstarted; invalid positions recover to the first question', () => {
  assert.equal(restoreQuizChallenge(null), null);
  assert.equal(restoreQuizChallenge({ questionOrder: 'invalid' }), null);
  const saved = { ...createQuizChallenge(), currentQuestionId: 'unknown' };
  assert.equal(restoreQuizChallenge(saved).currentQuestionId, saved.questionOrder[0]);
});
