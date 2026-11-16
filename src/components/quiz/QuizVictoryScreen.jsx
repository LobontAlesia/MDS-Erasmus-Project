import { useEffect, useRef } from 'react';
import { BADGES, QUESTIONS } from '../../data.js';
import Icon from '../Icon.jsx';

const MESSAGES = {
  3: ['Outstanding quest!', 'You connected the ideas and made them count. Take that confidence into your next Sprint.'],
  2: ['Great momentum!', 'You learned, adapted and kept moving. That’s an Agile mindset in action.'],
  1: ['Every attempt counts.', 'You stayed curious and completed every challenge. Learning is the real achievement.'],
};
const CONFETTI_COLORS = ['#c6f17b', '#ffd180', '#79d5cb', '#cfb7ff'];

export default function QuizVictoryScreen({ results, go, onReview }) {
  const titleRef = useRef(null);
  const [title, message] = MESSAGES[results.quizStars];
  const badge = BADGES[2];
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <section className="quiz-victory" aria-labelledby="quiz-victory-title">
      <div className="quiz-confetti" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => <i key={i} style={{ '--x': `${5 + (i * 37) % 90}%`, '--delay': `${(i % 5) * 0.12}s`, '--turn': `${i % 2 ? 260 : -220}deg`, background: CONFETTI_COLORS[i % 4] }} />)}
      </div>
      <span className="quiz-kicker">Mission 03 · Complete</span>
      <div className="quiz-trophy" aria-hidden="true"><Icon name="trophy" /><span>✦</span><span>✧</span></div>
      <h1 id="quiz-victory-title" ref={titleRef} tabIndex={-1}>Challenge Completed!</h1>
      <p className="quiz-victory-intro">Ten challenges. A whole new way of thinking.</p>
      <div className="quiz-stars" role="img" aria-label={`${results.quizStars} out of 3 stars`}>
        {[1, 2, 3].map((star) => <span key={star} className={star <= results.quizStars ? 'is-earned' : ''} style={{ '--star-delay': `${star * 110}ms` }}><Icon name="star" /></span>)}
      </div>
      <h2>{title}</h2><p className="quiz-victory-message">{message}</p>
      <dl className="quiz-victory-stats">
        <div><dt>Quiz XP earned</dt><dd>{results.quizXp}<span> / {results.quizMaxXp} XP</span></dd></div>
        <div><dt>Questions completed</dt><dd>{results.quizCorrectCount}<span> / {QUESTIONS.length}</span></dd></div>
        <div><dt>Total attempts</dt><dd>{results.quizAttempts}<span> learning moments</span></dd></div>
      </dl>
      {results.badges[2] && <div className="quiz-victory-badge"><span aria-hidden="true"><Icon name={badge.icon} /></span>
        <div><small>Achievement unlocked</small><strong>{badge.name}</strong><p>{badge.text}</p></div><Icon name="check" /></div>}
      <p className="quiz-rating-note">Stars reflect quiz XP: 90+ earns 3, 60–89 earns 2, and below 60 earns 1. Stars add no extra XP.</p>
      <div className="quiz-victory-actions">
        <button type="button" className="quiz-button is-primary" onClick={() => go('dashboard')}>Go to Dashboard <span aria-hidden="true">↗</span></button>
        <button type="button" className="quiz-button is-light" onClick={() => go('missions')}>Explore other missions <span aria-hidden="true">→</span></button>
      </div>
      <button type="button" className="quiz-text-button" onClick={onReview}>Review your answers <span aria-hidden="true">↩</span></button>
    </section>
  );
}
