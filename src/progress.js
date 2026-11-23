import { useEffect, useState } from 'react';
import { STORAGE_KEY, MAX_XP, QUESTIONS, PRACTICES, MISSIONS, ROLES, QUIZ_XP_BY_ATTEMPT, LEGACY_QUESTION_IDS } from './data.js';
import { restoreQuizChallenge, getQuizStars } from './quiz.js';
import { getLevelProgress } from './levels.js';

export const emptyProgress = () => ({
  role: null, done: {}, opened: [], correct: [], quizAttempts: {}, quizXp: {},
  quizAnswers: {}, quizChallenge: null,
});

const questionId = (id) => Object.hasOwn(LEGACY_QUESTION_IDS, id) ? LEGACY_QUESTION_IDS[id] : id;

function migrateQuizMap(saved) {
  const result = { ...saved };
  for (const [index, id] of Object.entries(LEGACY_QUESTION_IDS)) {
    if (Object.hasOwn(result, index)) {
      result[id] ??= result[index]; // A stable-ID entry is authoritative, including 0 XP.
      delete result[index];
    }
  }
  return result;
}

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const progress = {
      ...emptyProgress(), ...saved,
      correct: [...new Set((saved.correct ?? []).map(questionId))],
      quizAttempts: migrateQuizMap(saved.quizAttempts),
      quizXp: migrateQuizMap(saved.quizXp),
      quizAnswers: migrateQuizMap(saved.quizAnswers),
      quizChallenge: restoreQuizChallenge(saved.quizChallenge),
    };
    // Sprint 1 completions earned 10 XP; keep that reward under the same storage key.
    for (const q of progress.correct) {
      progress.quizAttempts[q] ??= 1;
      progress.quizXp[q] ??= QUIZ_XP_BY_ATTEMPT[0];
    }
    return progress;
  } catch {
    return emptyProgress();
  }
}

/** Record each submitted answer once; completed questions are locked. */
export function recordQuizAnswer(progress, id, optionIndex) {
  const question = QUESTIONS.find((q) => q.id === id);
  if (!question || !Number.isInteger(optionIndex) || !question.a[optionIndex]
    || progress.correct.includes(id)) return progress;

  const attempts = (progress.quizAttempts?.[id] ?? 0) + 1;
  const next = {
    ...progress,
    quizAttempts: { ...progress.quizAttempts, [id]: attempts },
    quizAnswers: { ...progress.quizAnswers, [id]: optionIndex },
  };
  if (optionIndex === question.correct) {
    next.correct = [...progress.correct, id];
    next.quizXp = { ...progress.quizXp, [id]: QUIZ_XP_BY_ATTEMPT[attempts - 1] ?? 0 };
  }
  return next;
}

export function moveQuizQuestion(progress, id) {
  const challenge = progress.quizChallenge;
  if (!challenge || !challenge.questionOrder.includes(id) || challenge.currentQuestionId === id) return progress;
  return { ...progress, quizChallenge: { ...challenge, currentQuestionId: id } };
}

/** Functional updates keep repeated/queued mission actions from granting extra XP. */
export function recordMissionCompletion(progress, key) {
  if (!['intro', 'risks'].includes(key) || progress.done[key]) return progress;
  return { ...progress, done: { ...progress.done, [key]: true } };
}

export function recordPracticeOpen(progress, index) {
  if (!Number.isInteger(index) || !PRACTICES[index] || progress.opened.includes(index)) return progress;
  return { ...progress, opened: [...progress.opened, index] };
}

/** Progress state, saved to localStorage on every change (US-13). */
export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    // localStorage can throw (private mode, storage full): progress just won't persist
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* ignore */
    }
  }, [progress]);

  return [progress, setProgress];
}

/** The saved role's entry in ROLES, or null (no role, or an unknown one). */
export const findRole = (id) => ROLES.find((r) => r.id === id) || null;

/** Mission indices in the order to show them: the role's route, or the default order. */
function missionOrder(role) {
  const all = MISSIONS.map((_, i) => i);
  if (!role) return all;
  const routed = role.route.map((page) => MISSIONS.findIndex((m) => m.page === page)).filter((i, k, arr) => i >= 0 && arr.indexOf(i) === k);
  return [...routed, ...all.filter((i) => !routed.includes(i))];
}

/** Everything that is calculated from the saved progress. */
export function derive(p) {
  const role = findRole(p.role);
  const order = missionOrder(role);
  const correct = new Set(p.correct.map(questionId));
  const solved = QUESTIONS.filter((q) => correct.has(q.id));
  const rewards = migrateQuizMap(p.quizXp);
  const quizXp = solved.reduce((total, q) => total + (rewards[q.id] ?? QUIZ_XP_BY_ATTEMPT[0]), 0);
  const quizMaxXp = QUESTIONS.length * QUIZ_XP_BY_ATTEMPT[0];
  const attempts = migrateQuizMap(p.quizAttempts);
  const xp = (p.done.intro ? 10 : 0) + (p.done.risks ? 10 : 0) + p.opened.length * 5 + quizXp;
  const completed = [!!p.done.intro, p.opened.length === PRACTICES.length, solved.length === QUESTIONS.length, !!p.done.risks];
  return {
    xp,
    quizXp,
    quizMaxXp,
    quizAttempts: QUESTIONS.reduce((total, q) => total + (attempts[q.id] ?? 0), 0),
    quizStars: completed[2] ? getQuizStars(quizXp, quizMaxXp) : 0,
    quizCorrectCount: solved.length,
    percent: Math.min(100, Math.round((xp / MAX_XP) * 100)),
    completed,
    badges: completed, // one badge per completed mission
    doneCount: completed.filter(Boolean).length,
    role, // ROLES entry or null
    order, // mission indices in display order (role route or default)
    nextIndex: order.find((i) => !completed[i]) ?? -1, // first unfinished mission on the route, -1 when all done
    ...getLevelProgress(xp),
    perMission: [
      p.done.intro ? 100 : 0,
      Math.round((p.opened.length / PRACTICES.length) * 100),
      Math.round((solved.length / QUESTIONS.length) * 100),
      p.done.risks ? 100 : 0,
    ],
  };
}
