import { QUESTIONS } from './data.js';

/** Performance feedback only; stars never grant XP or badges. */
export function getQuizStars(xp, maxXp) {
  const ratio = maxXp > 0 ? xp / maxXp : 0;
  return ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
}

/** Fisher-Yates shuffle. Copy the input so the question bank never changes. */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuizChallenge(random = Math.random) {
  const questionOrder = shuffle(QUESTIONS.map((q) => q.id), random);
  const answerOrder = Object.fromEntries(QUESTIONS.map((q) => [q.id, shuffle(q.a.map((_, i) => i), random)]));
  return { questionOrder, answerOrder, currentQuestionId: questionOrder[0] };
}

/** Keep saved order; repair missing/invalid entries without touching earned rewards. */
export function restoreQuizChallenge(saved, random = Math.random) {
  if (!saved || !Array.isArray(saved.questionOrder)) return null;

  const ids = QUESTIONS.map((q) => q.id);
  const kept = [...new Set(saved.questionOrder.filter((id) => ids.includes(id)))];
  const questionOrder = [...kept, ...shuffle(ids.filter((id) => !kept.includes(id)), random)];
  const answerOrder = Object.fromEntries(QUESTIONS.map((q) => {
    const order = saved.answerOrder?.[q.id];
    const valid = Array.isArray(order) && order.length === q.a.length
      && new Set(order).size === q.a.length
      && order.every((i) => Number.isInteger(i) && i >= 0 && i < q.a.length);
    return [q.id, valid ? [...order] : shuffle(q.a.map((_, i) => i), random)];
  }));
  const currentQuestionId = questionOrder.includes(saved.currentQuestionId) ? saved.currentQuestionId : questionOrder[0];
  return { questionOrder, answerOrder, currentQuestionId };
}
