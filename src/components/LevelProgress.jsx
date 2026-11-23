/** The same next-level progress and maximum-level state on Home and Dashboard. */
export default function LevelProgress({ progress: d }) {
  const label = d.isMaxLevel
    ? 'Maximum level reached'
    : `${d.xpToNextLevel} XP to Level ${d.nextLevel.level} · ${d.nextLevel.title}`;

  return (
    <div className="level-progress">
      <span className="small">{label}</span>
      <div className="bar" role="progressbar" aria-label="Level progress"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(d.levelPercent)}
        aria-valuetext={label}>
        <span style={{ width: `${d.levelPercent}%` }} />
      </div>
    </div>
  );
}
