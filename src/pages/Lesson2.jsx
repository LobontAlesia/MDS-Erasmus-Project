import { useState } from 'react';
import { PRACTICES } from '../data.js';
import { useApp } from '../App.jsx';
import LessonHeader from '../components/LessonHeader.jsx';

export default function Lesson2() {
  const { go, progress, actions } = useApp();
  const [expanded, setExpanded] = useState([]); // indexes of cards that are open right now

  const toggle = (i) => {
    const isOpen = expanded.includes(i);
    setExpanded(isOpen ? expanded.filter((x) => x !== i) : [...expanded, i]);
    if (!isOpen) actions.openPractice(i); // ignores repeats, so XP is given only once
  };

  return (
    <section id="lesson2" className="page active" aria-labelledby="lesson2-title">
      <LessonHeader id="lesson2-title" label="mission 2" title="Gamified practices to try in your next sprint" />
      <p className="sub">Open each practice card to learn how it works. Every new card earns +5 XP.</p>
      <div className="practice-grid">
        {PRACTICES.map((p, i) => {
          const opened = progress.opened.includes(i);
          const isOpen = expanded.includes(i);
          const detailsId = `practice-details-${i}`;
          return (
            <div key={p.title} className={`practice ${opened ? 'opened' : ''} ${isOpen ? 'expanded' : ''}`}>
              <button type="button" className="practice-toggle" aria-expanded={isOpen} aria-controls={detailsId} onClick={() => toggle(i)}>
                <span className="tag">{p.tag}</span>
                <span className="title">{p.title}</span>
                <span className="text">{p.text}</span>
                <span className="cta">
                  {isOpen ? 'Close card ↑' : opened ? 'Explored · +5 XP' : 'Open card, +5 XP →'}
                </span>
              </button>
              <div id={detailsId} className="practice-details" hidden={!isOpen}>
                <strong className="practice-label">How it works</strong>
                <p>{p.how}</p>
                <strong className="practice-label">{p.sources.length > 1 ? 'Sources' : 'Source'}</strong>
                <ul className="practice-sources">
                  {p.sources.map((s) => (
                    <li key={s.text}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.text}<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        s.text
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      <div className="buttonrow">
        <button className="button" onClick={() => go('quiz')}>Continue to quiz <span className="arrow" aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}
