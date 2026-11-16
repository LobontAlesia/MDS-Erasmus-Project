import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { STORAGE_KEY, MAX_XP, PRACTICES, QUESTIONS } from './data.js';
import { derive, emptyProgress, loadProgress, recordQuizAnswer, moveQuizQuestion } from './progress.js';
import { createQuizChallenge } from './quiz.js';

const [Q0, Q1, Q2] = QUESTIONS.map((q) => q.id);
const correct = (progress, q = 0) => recordQuizAnswer(progress, QUESTIONS[q].id, QUESTIONS[q].correct);
const wrong = (progress, q = 0) => recordQuizAnswer(progress, QUESTIONS[q].id, (QUESTIONS[q].correct + 1) % QUESTIONS[q].a.length);

// Exercise the same storage key and JSON format used by useProgress, without a browser dependency.
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
});
afterEach(() => { delete globalThis.localStorage; });

function reload(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return loadProgress();
}

test('first correct attempt earns 10 XP', () => {
  const progress = correct(emptyProgress());
  assert.equal(progress.quizAttempts[Q0], 1);
  assert.equal(progress.quizXp[Q0], 10);
  assert.deepEqual(progress.correct, [Q0]);
  assert.equal(derive(progress).xp, 10);
});

test('one wrong answer followed by a correct answer earns 5 XP', () => {
  const missed = wrong(emptyProgress());
  assert.equal(missed.quizAttempts[Q0], 1);
  assert.deepEqual(missed.correct, []);
  assert.deepEqual(missed.quizXp, {});
  assert.equal(derive(missed).xp, 0);
  const progress = correct(missed);
  assert.equal(progress.quizAttempts[Q0], 2);
  assert.equal(progress.quizXp[Q0], 5);
  assert.equal(derive(progress).xp, 5);
});

for (const misses of [2, 4]) {
  test(`${misses} wrong answers followed by a correct answer earns 0 XP and completes the question`, () => {
    let progress = emptyProgress();
    for (let i = 0; i < misses; i++) progress = wrong(progress);
    progress = correct(progress);
    assert.equal(progress.quizAttempts[Q0], misses + 1);
    assert.equal(progress.quizXp[Q0], 0);
    assert.deepEqual(progress.correct, [Q0]);
    assert.equal(derive(progress).xp, 0);
  });
}

test('reload after a wrong answer retains attempts and reduces the next reward', () => {
  const restored = reload(wrong(emptyProgress()));
  assert.equal(restored.quizAttempts[Q0], 1);
  assert.equal(derive(restored).xp, 0);
  assert.equal(correct(restored).quizXp[Q0], 5);
});

test('reload after a correct answer retains each possible reward, including zero', () => {
  for (const misses of [0, 1, 2]) {
    let progress = emptyProgress();
    for (let i = 0; i < misses; i++) progress = wrong(progress);
    progress = correct(progress);
    const restored = reload(progress);
    assert.deepEqual(restored, progress);
    assert.equal(derive(restored).xp, [10, 5, 0][misses]);
  }
});

test('revisiting and repeatedly submitting a completed question cannot change attempts or XP', () => {
  for (const misses of [0, 1, 2]) {
    let progress = emptyProgress();
    for (let i = 0; i < misses; i++) progress = wrong(progress);
    const completed = reload(correct(progress));
    for (let i = 0; i < 20; i++) {
      assert.strictEqual(correct(completed), completed);
      assert.strictEqual(wrong(completed), completed);
    }
  }
});

test('all questions complete the mission and badge even when every reward is zero', () => {
  let progress = emptyProgress();
  QUESTIONS.forEach((_, q) => {
    progress = correct(wrong(wrong(progress, q), q), q);
  });
  const d = derive(reload(progress));
  assert.equal(d.xp, 0);
  assert.equal(d.completed[2], true);
  assert.equal(d.badges[2], true);
  assert.equal(d.perMission[2], 100);
  assert.equal(d.doneCount, 1);
});

test('Sprint 1 saves retain XP and other missions; the expanded quiz requires the new questions', () => {
  const old = { role: 'Scrum Master', done: { intro: true, risks: true }, opened: [0, 1, 2, 3], correct: [0, 1, 2] };
  const restored = reload(old);
  assert.equal(restored.role, old.role);
  assert.deepEqual(restored.done, old.done);
  assert.deepEqual(restored.quizXp, { [Q0]: 10, [Q1]: 10, [Q2]: 10 });
  assert.deepEqual(restored.quizAttempts, { [Q0]: 1, [Q1]: 1, [Q2]: 1 });
  assert.equal(derive(restored).xp, 70);
  assert.deepEqual(derive(restored).badges, [true, true, false, true]);
  assert.equal(derive(restored).perMission[2], 30);
  assert.equal(derive(old).xp, 70);
  assert.strictEqual(correct(restored), restored);
});

test('a partially completed Sprint 1 save gives new questions attempt-based rewards', () => {
  let progress = reload({ correct: [0] });
  progress = correct(wrong(progress, 1), 1);
  assert.deepEqual(progress.quizXp, { [Q0]: 10, [Q1]: 5 });
  assert.equal(derive(progress).xp, 15);
  assert.equal(derive(progress).completed[2], false);
});

test('reset clears stored attempts, rewards, XP and badges and starts the next question fresh', () => {
  reload({ ...correct(wrong(emptyProgress())), quizChallenge: createQuizChallenge() });
  const reset = reload(emptyProgress());
  assert.deepEqual(reset.quizAttempts, {});
  assert.deepEqual(reset.quizXp, {});
  assert.deepEqual(reset.correct, []);
  assert.deepEqual(reset.quizAnswers, {});
  assert.equal(reset.quizChallenge, null);
  assert.equal(derive(reset).xp, 0);
  assert.deepEqual(derive(reset).badges, [false, false, false, false]);
  assert.equal(correct(reset).quizXp[Q0], 10);
});

test('attempt counts remain independent across question navigation', () => {
  let progress = wrong(emptyProgress(), 0);
  progress = wrong(progress, 1);
  progress = wrong(progress, 1);
  progress = correct(progress, 2);
  progress = correct(progress, 0);
  progress = correct(progress, 1);
  assert.deepEqual(progress.quizAttempts, { [Q0]: 2, [Q1]: 3, [Q2]: 1 });
  assert.deepEqual(progress.quizXp, { [Q0]: 5, [Q1]: 0, [Q2]: 10 });
  assert.equal(derive(progress).xp, 15);
  assert.equal(derive(progress).completed[2], false);
});

test('sequential updates prevent extra rewards from queued repeated clicks', () => {
  const updates = [wrong, correct, correct, wrong, correct];
  const progress = updates.reduce((current, update) => update(current), emptyProgress());
  assert.equal(progress.quizAttempts[Q0], 2);
  assert.deepEqual(progress.correct, [Q0]);
  assert.equal(derive(progress).xp, 5);
});

test('maximum XP and existing mission progression remain consistent', () => {
  let progress = { ...emptyProgress(), done: { intro: true, risks: true }, opened: PRACTICES.map((_, i) => i) };
  QUESTIONS.forEach((_, q) => { progress = correct(progress, q); });
  const d = derive(progress);
  assert.equal(MAX_XP, 140);
  assert.equal(d.xp, MAX_XP);
  assert.equal(d.percent, 100);
  assert.equal(d.level, 2);
  assert.equal(d.levelTitle, 'Apprentice');
  assert.equal(d.doneCount, 4);
  assert.equal(d.nextIndex, -1);
  assert.deepEqual(d.perMission, [100, 100, 100, 100]);
});

test('answer updates do not mutate prior progress or unrelated missions', () => {
  const progress = emptyProgress();
  const before = structuredClone(progress);
  wrong(progress);
  correct(progress);
  assert.deepEqual(progress, before);
});

test('invalid question IDs or option indices cannot create attempts or XP', () => {
  const progress = emptyProgress();
  for (const [q, option] of [[-1, 0], [0, 1], ['0', 1], ['unknown', 0], [Q0, -1], [Q0, 99], [Q0, '1']]) {
    assert.strictEqual(recordQuizAnswer(progress, q, option), progress);
  }
});

test('missing, malformed or unavailable localStorage starts with empty progress', () => {
  assert.deepEqual(loadProgress(), emptyProgress());
  localStorage.setItem(STORAGE_KEY, '{invalid json');
  assert.deepEqual(loadProgress(), emptyProgress());
  localStorage.getItem = () => { throw new Error('Storage unavailable'); };
  assert.deepEqual(loadProgress(), emptyProgress());
});

test('Task 1 migration keeps attempts, 10 / 5 / 0 rewards and unsolved questions without XP duplication', () => {
  let progress = reload({
    correct: [0, 1], quizAttempts: { 0: 2, 1: 3, 2: 2 }, quizXp: { 0: 5, 1: 0 },
    role: 'Developer', done: { intro: true }, opened: [0],
  });
  assert.deepEqual(progress.correct, [Q0, Q1]);
  assert.deepEqual(progress.quizAttempts, { [Q0]: 2, [Q1]: 3, [Q2]: 2 });
  assert.deepEqual(progress.quizXp, { [Q0]: 5, [Q1]: 0 });
  assert.equal(derive(progress).xp, 20);
  assert.strictEqual(correct(progress, 0), progress);
  assert.strictEqual(correct(progress, 1), progress);
  progress = correct(progress, 2);
  assert.equal(progress.quizXp[Q2], 0);
  assert.equal(progress.quizAttempts[Q2], 3);
  assert.equal(derive(progress).xp, 20);
  assert.deepEqual(reload(reload(progress)), progress);
});

test('migration deduplicates numeric and stable IDs and keeps an explicit zero reward', () => {
  const progress = reload({
    correct: [0, Q0, 1, 1],
    quizAttempts: { 0: 1, [Q0]: 3, 1: 1 },
    quizXp: { 0: 10, [Q0]: 0, 1: 10 },
  });
  assert.deepEqual(progress.correct, [Q0, Q1]);
  assert.deepEqual(progress.quizXp, { [Q0]: 0, [Q1]: 10 });
  assert.equal(progress.quizAttempts[Q0], 3);
  assert.equal(derive(progress).xp, 10);
  assert.deepEqual(reload(progress), progress);
});

test('all ten shuffled questions can be reached; navigation and reload retain order and gameplay', () => {
  const challenge = createQuizChallenge(() => 0);
  let progress = { ...emptyProgress(), quizChallenge: challenge };
  for (const id of challenge.questionOrder) {
    progress = moveQuizQuestion(progress, id);
    const q = QUESTIONS.find((question) => question.id === id);
    progress = recordQuizAnswer(progress, id, (q.correct + 1) % q.a.length);
    const restored = reload(progress);
    assert.equal(restored.quizChallenge.currentQuestionId, id);
    assert.deepEqual(restored.quizChallenge.questionOrder, challenge.questionOrder);
    assert.deepEqual(restored.quizChallenge.answerOrder, challenge.answerOrder);
    assert.equal(restored.quizAttempts[id], 1);
    assert.equal(restored.quizAnswers[id], (q.correct + 1) % q.a.length);
    progress = recordQuizAnswer(restored, id, q.correct);
  }
  assert.equal(progress.correct.length, 10);
  assert.equal(derive(progress).xp, 50);
  assert.equal(derive(progress).quizCorrectCount, 10);
  assert.equal(derive(progress).completed[2], true);
  assert.equal(derive(progress).badges[2], true);
  const firstId = challenge.questionOrder[0];
  progress = reload(moveQuizQuestion(progress, firstId));
  assert.equal(progress.quizChallenge.currentQuestionId, firstId);
  assert.strictEqual(recordQuizAnswer(progress, firstId, QUESTIONS.find((q) => q.id === firstId).correct), progress);
  assert.equal(derive(progress).xp, 50);
});

test('invalid navigation cannot corrupt the current question or create a challenge', () => {
  const empty = emptyProgress();
  assert.strictEqual(moveQuizQuestion(empty, Q0), empty);
  const started = { ...empty, quizChallenge: createQuizChallenge() };
  assert.strictEqual(moveQuizQuestion(started, 'unknown'), started);
  assert.strictEqual(moveQuizQuestion(started, started.quizChallenge.currentQuestionId), started);
});

test('question bank reordering cannot change stable-ID attempts, rewards or completions', () => {
  let progress = correct(wrong(emptyProgress()));
  const before = structuredClone(progress);
  QUESTIONS.reverse();
  try {
    progress = reload(progress);
    assert.deepEqual(progress, before);
    assert.equal(derive(progress).xp, 5);
    assert.strictEqual(recordQuizAnswer(progress, Q0, QUESTIONS.find((q) => q.id === Q0).correct), progress);
  } finally {
    QUESTIONS.reverse();
  }
});
