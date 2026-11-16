import Icon from '../Icon.jsx';

export default function QuizProgress({ completed, total, xp, maxXp, totalXp }) {
  const percent = Math.round((completed / total) * 100);
  return (
    <div className="quiz-progress-panel">
      <div className="quiz-progress-copy">
        <span className="quiz-label">Your challenge progress</span>
        <strong>{completed}<span> / {total} completed</span></strong>
        <div className="quiz-progress-track" role="progressbar" aria-label="Questions completed"
          aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total} aria-valuetext={`${completed} of ${total} questions completed`}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className="quiz-progress-note">One good idea at a time.</span>
      </div>
      <div className="quiz-xp-counter">
        <span className="quiz-xp-symbol"><Icon name="star" /></span>
        <div><span className="quiz-label">Quiz XP earned</span><strong>{xp}<span> / {maxXp} XP</span></strong>
          <small>{totalXp} total Sprint Quest XP</small></div>
      </div>
    </div>
  );
}
