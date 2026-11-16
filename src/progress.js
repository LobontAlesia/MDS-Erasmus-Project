import { useEffect, useState } from 'react';
import { STORAGE_KEY, MAX_XP, QUESTIONS, PRACTICES, MISSIONS, ROLES } from './data.js';

export const emptyProgress = () => ({ role: null, done: {}, opened: [], correct: [] });

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return { ...emptyProgress(), ...saved };
  } catch {
    return emptyProgress();
  }
}

/** Progress state, saved to localStorage on every change (US-13). */
export function useProgress() {
  const [progress, setProgress] = useState(load);

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
  const xp = (p.done.intro ? 10 : 0) + (p.done.risks ? 10 : 0) + p.opened.length * 5 + p.correct.length * 10;
  const completed = [!!p.done.intro, p.opened.length === PRACTICES.length, p.correct.length === QUESTIONS.length, !!p.done.risks];
  const level = xp >= 40 ? 2 : 1;
  return {
    xp,
    percent: Math.min(100, Math.round((xp / MAX_XP) * 100)),
    completed,
    badges: completed, // one badge per completed mission
    doneCount: completed.filter(Boolean).length,
    role, // ROLES entry or null
    order, // mission indices in display order (role route or default)
    nextIndex: order.find((i) => !completed[i]) ?? -1, // first unfinished mission on the route, -1 when all done
    level,
    levelTitle: level === 1 ? 'Rookie' : 'Apprentice',
    perMission: [
      p.done.intro ? 100 : 0,
      Math.round((p.opened.length / PRACTICES.length) * 100),
      Math.round((p.correct.length / QUESTIONS.length) * 100),
      p.done.risks ? 100 : 0,
    ],
  };
}
