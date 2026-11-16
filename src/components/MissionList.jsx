import { MISSIONS } from '../data.js';
import { useApp } from '../App.jsx';
import Icon from './Icon.jsx';

/** The four missions as sticky notes, in the chosen role's route order (default order without a role).
    `headingLevel` is h3 on Home (under an h2), h2 on the Missions page. */
export default function MissionList({ id, headingLevel = 'h2' }) {
  const { go, d } = useApp();
  const Heading = headingLevel;

  return (
    <div className="missions" id={id}>
      {d.order.map((i) => {
        const m = MISSIONS[i];
        const done = d.completed[i];
        const isNext = i === d.nextIndex;
        const recommended = isNext && !!d.role;
        const verb = done ? 'Review' : isNext ? 'Start' : 'Open';
        return (
          <div key={m.page} className={`mission c${i} ${done ? 'done' : ''} ${recommended ? 'recommended' : ''}`}>
            <div className="mission-top">
              <span className="number">#{i + 1}</span>
              <span className="reward"><Icon name="star" /> {m.xp} XP</span>
            </div>
            {recommended && <span className="next-tag">Recommended next</span>}
            <Heading>{m.title}</Heading>
            <p>{m.desc}</p>
            <button
              className={`button ${isNext ? '' : 'secondary'}`}
              onClick={() => go(m.page)}
              aria-label={`${verb} mission ${i + 1}: ${m.title}${done ? ' (completed)' : ''}${recommended ? ' (recommended next)' : ''}`}
            >
              {verb} <span className="arrow" aria-hidden="true">→</span>
            </button>
            {done && <span className="stamp" aria-hidden="true">done!</span>}
          </div>
        );
      })}
    </div>
  );
}
