import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QUESTIONS, ROLES } from './data.js';
import { derive, emptyProgress, findRole, recordQuizAnswer } from './progress.js';

test('teammates’ role routes and recommended next missions remain intact', () => {
  const progress = { ...emptyProgress(), role: 'Scrum Master', done: { intro: true } };
  const result = derive(progress);
  assert.strictEqual(result.role, ROLES.find((role) => role.id === 'Scrum Master'));
  assert.deepEqual(result.order, [0, 3, 1, 2]);
  assert.equal(result.nextIndex, 3);
  assert.equal(result.xp, 10);
  const developer = derive({ ...progress, role: 'Developer' });
  assert.deepEqual(developer.order, [0, 1, 2, 3]);
  assert.equal(developer.nextIndex, 1);
});

test('cleared or unknown roles restore default routing without changing earned XP', () => {
  const q = QUESTIONS[0];
  const progress = recordQuizAnswer(emptyProgress(), q.id, q.correct);
  for (const role of [null, 'Unknown']) {
    const result = derive({ ...progress, role });
    assert.equal(result.role, null);
    assert.deepEqual(result.order, [0, 1, 2, 3]);
    assert.equal(result.xp, 10);
  }
  assert.equal(findRole('Unknown'), null);
});

test('zero-XP quiz answers still drive the existing in-progress mission tracker', () => {
  const q = QUESTIONS[0];
  let progress = { ...emptyProgress(), role: 'Scrum Master', done: { intro: true, risks: true }, opened: [0, 1, 2, 3] };
  for (let i = 0; i < 2; i++) progress = recordQuizAnswer(progress, q.id, (q.correct + 1) % q.a.length);
  progress = recordQuizAnswer(progress, q.id, q.correct);
  const result = derive(progress);
  assert.equal(result.quizXp, 0);
  assert.equal(result.perMission[2], 10);
  assert.equal(result.completed[2], false);
  assert.equal(result.nextIndex, 2);
  assert.equal(result.xp, 40);
});

test('all missions can complete in either role route with zero quiz XP', () => {
  let progress = { ...emptyProgress(), done: { intro: true, risks: true }, opened: [0, 1, 2, 3] };
  for (const q of QUESTIONS) {
    for (let i = 0; i < 2; i++) progress = recordQuizAnswer(progress, q.id, (q.correct + 1) % q.a.length);
    progress = recordQuizAnswer(progress, q.id, q.correct);
  }
  for (const { id } of ROLES) {
    const result = derive({ ...progress, role: id });
    assert.equal(result.doneCount, 4);
    assert.equal(result.nextIndex, -1);
    assert.deepEqual(result.badges, [true, true, true, true]);
    assert.equal(result.xp, 40);
  }
});
