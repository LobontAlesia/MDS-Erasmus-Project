import Icon from '../Icon.jsx';

/** A visual echo of the saved reward. This component never updates progress. */
export default function XPReward({ xp }) {
  return (
    <span className="quiz-xp-pop" aria-hidden="true">
      <Icon name="star" /> +{xp} XP{xp === 0 && <small>Keep learning!</small>}
    </span>
  );
}
