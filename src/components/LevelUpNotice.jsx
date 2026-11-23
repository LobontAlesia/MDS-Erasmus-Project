import { useEffect, useRef, useState } from 'react';

/** Only announce increases during this session, not restored progress or resets. */
export default function LevelUpNotice({ level, title }) {
  const previousLevel = useRef(level);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (level > previousLevel.current) setMessage(`Level up! You reached Level ${level} · ${title}.`);
    else if (level < previousLevel.current) setMessage('');
    previousLevel.current = level;
  }, [level, title]);

  return (
    <div className={`level-up-notice${message ? ' is-visible' : ''}`}>
      <div role="status" aria-live="polite" aria-atomic="true">{message}</div>
      {message && <button type="button" className="button ghost" onClick={() => setMessage('')}
        aria-label="Dismiss level-up message">Dismiss</button>}
    </div>
  );
}
