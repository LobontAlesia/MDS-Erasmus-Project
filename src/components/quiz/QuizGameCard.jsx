import { QUIZ_XP_BY_ATTEMPT } from '../../data.js';
import Icon from '../Icon.jsx';
import XPReward from './XPReward.jsx';

export default function QuizGameCard({ question, order, number, total, attempts, answered, selected,
  earnedXp, celebrate, onChoose, headingRef }) {
  const nextXp = QUIZ_XP_BY_ATTEMPT[attempts] ?? 0;
  const wrong = !answered && selected !== undefined;
  return (
    <article className="quiz-game-card" aria-labelledby="quiz-question">
      <div className="quiz-card-topline">
        <span className="quiz-question-number">Challenge {String(number).padStart(2, '0')} <span>/ {total}</span></span>
        <span className={`quiz-attempt-pill ${answered ? 'is-complete' : ''}`}>
          {answered ? <><Icon name="check" /> Completed</> : <>Attempt {attempts + 1} · {nextXp} XP available</>}
        </span>
      </div>
      <h2 id="quiz-question" ref={headingRef} tabIndex={-1}>{question.q}</h2>
      <p className="quiz-card-hint">Choose the best answer. Every attempt is a chance to learn.</p>
      <div className="quiz-answers" role="group" aria-labelledby="quiz-question">
        {order.map((option, position) => {
          const isCorrect = answered && option === question.correct;
          const isWrong = wrong && option === selected;
          const state = isCorrect ? 'is-correct' : isWrong ? 'is-wrong' : '';
          return (
            <button type="button" key={option} className={`quiz-answer ${state}`} disabled={answered}
              data-feedback-phase={isWrong ? attempts % 2 : undefined} onClick={() => onChoose(option)}>
              <span className="quiz-answer-letter" aria-hidden="true">{String.fromCharCode(65 + position)}</span>
              <span className="quiz-answer-text">{question.a[option]}</span>
              <span className="quiz-answer-mark" aria-hidden="true">{isCorrect ? <Icon name="check" /> : isWrong ? '×' : '↗'}</span>
              {isCorrect && <span className="sr-only">Correct answer</span>}
              {isWrong && <span className="sr-only">Incorrect answer</span>}
            </button>
          );
        })}
      </div>
      <div className="quiz-feedback-slot" aria-live="polite" aria-atomic="true">
        {answered && (
          <div className="quiz-answer-feedback is-success">
            <span className="quiz-feedback-icon" aria-hidden="true"><Icon name="check" /></span>
            <div><strong>Correct! +{earnedXp} XP{earnedXp === 0 ? ' — Keep learning!' : ' earned.'}</strong>
              <p>{question.why}</p><small>Question completed. Your XP is saved; revisiting won’t award it again.</small></div>
          </div>
        )}
        {wrong && (
          <div className="quiz-answer-feedback is-retry" key={attempts}>
            <span className="quiz-feedback-icon" aria-hidden="true">↻</span>
            <div><strong>Not quite. You’ve got another shot.</strong><p>That answer was incorrect. Take another look and try again.</p>
              <small>{attempts} {attempts === 1 ? 'attempt' : 'attempts'} made · {nextXp > 0 ? `${nextXp} XP available on your next correct answer.` : 'You can still complete this question and earn your badge.'}</small></div>
          </div>
        )}
      </div>
      {celebrate && <XPReward xp={earnedXp} />}
    </article>
  );
}
