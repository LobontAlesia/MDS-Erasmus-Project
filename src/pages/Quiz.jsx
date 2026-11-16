import { useEffect, useRef, useState } from 'react';
import { QUESTIONS, QUIZ_XP_BY_ATTEMPT } from '../data.js';
import { useApp } from '../App.jsx';
import Icon from '../components/Icon.jsx';
import QuizProgress from '../components/quiz/QuizProgress.jsx';
import QuizGameCard from '../components/quiz/QuizGameCard.jsx';
import QuizVictoryScreen from '../components/quiz/QuizVictoryScreen.jsx';
import './Quiz.css';

export default function Quiz() {
  const { go, progress, d, actions } = useApp();
  const challenge = progress.quizChallenge;
  const { startQuiz } = actions;
  const complete = d.completed[2];
  const [victoryReady, setVictoryReady] = useState(complete);
  const [reviewing, setReviewing] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const headingRef = useRef(null);
  const nextRef = useRef(null);
  const id = challenge?.currentQuestionId;
  const q = QUESTIONS.find((question) => question.id === id);
  const answered = progress.correct.includes(id);
  const celebrate = answered && submittedId === id;
  const showVictory = complete && victoryReady && !reviewing;

  useEffect(() => { if (!challenge) startQuiz(); }, [challenge, startQuiz]);

  // Leave a moment to read the final answer before celebrating. No reward writes here.
  useEffect(() => {
    if (!complete || victoryReady) return;
    const timer = setTimeout(() => setVictoryReady(true), 1600);
    return () => clearTimeout(timer);
  }, [complete, victoryReady]);

  useEffect(() => {
    if (!celebrate) return;
    nextRef.current?.focus({ preventScroll: true });
    const timer = setTimeout(() => setSubmittedId(null), 1800);
    return () => clearTimeout(timer);
  }, [celebrate, id]);

  useEffect(() => {
    if (!showVictory) headingRef.current?.focus({ preventScroll: true });
  }, [id, showVictory]);

  const moveTo = (questionId) => {
    setSubmittedId(null);
    actions.moveQuizQuestion(questionId);
  };
  const viewResults = () => { setVictoryReady(true); setReviewing(false); };

  if (showVictory) {
    return <div id="quiz" className="quiz-game"><QuizVictoryScreen results={d} go={go} onReview={() => setReviewing(true)} /></div>;
  }

  if (!challenge || !q) {
    return <section id="quiz" className="quiz-game quiz-loading" aria-labelledby="quiz-title">
      <span className="quiz-kicker">Mission 03</span><h1 id="quiz-title">Quiz Challenge</h1><p role="status">Getting your challenge ready…</p>
    </section>;
  }

  const index = challenge.questionOrder.indexOf(id);
  const last = index === challenge.questionOrder.length - 1;
  const nextUnanswered = challenge.questionOrder.find((questionId) => !progress.correct.includes(questionId));
  const attempts = progress.quizAttempts[id] ?? 0;
  const finishBlocked = !complete && last && nextUnanswered === id;
  const advance = () => {
    if (complete) viewResults();
    else moveTo(last ? nextUnanswered : challenge.questionOrder[index + 1]);
  };

  return (
    <section id="quiz" className="quiz-game" aria-labelledby="quiz-title">
      <div className="quiz-topbar">
        <button type="button" className="quiz-back" onClick={() => go('missions')}><span aria-hidden="true">←</span> All missions</button>
        <span className="quiz-saved"><span aria-hidden="true" /> Your progress travels with you</span>
      </div>
      <header className="quiz-hero">
        <div><span className="quiz-kicker">Mission 03 · Play. Learn. Level up.</span><h1 id="quiz-title">Quiz Challenge<span>.</span></h1>
          <p>Big ideas. Small challenges. Let’s put your Agile instincts to the test.</p>
          <div className="quiz-hero-tags"><span><Icon name="target" /> {QUESTIONS.length} challenges</span><span><Icon name="star" /> Up to {d.quizMaxXp} XP</span><span><Icon name="cap" /> Quiz Master badge</span></div>
        </div>
        <div className="quiz-hero-art" aria-hidden="true"><span className="quiz-orbit" /><span className="quiz-art-icon"><Icon name="bulb" /></span><i>✦</i><b>+XP</b></div>
      </header>
      <QuizProgress completed={d.quizCorrectCount} total={QUESTIONS.length} xp={d.quizXp} maxXp={d.quizMaxXp} totalXp={d.xp} />
      <div className="quiz-play-layout">
        <div className="quiz-play-main">
          <QuizGameCard key={id} question={q} order={challenge.answerOrder[id]} number={index + 1} total={QUESTIONS.length}
            attempts={attempts} answered={answered} selected={progress.quizAnswers[id]} earnedXp={progress.quizXp[id] ?? 0}
            celebrate={celebrate} headingRef={headingRef} onChoose={(option) => {
              if (answered) return;
              setSubmittedId(id);
              actions.answerQuestion(id, option);
            }} />
          <div className="quiz-navigation">
            <button type="button" className="quiz-button is-ghost" disabled={index === 0} onClick={() => moveTo(challenge.questionOrder[index - 1])}><span aria-hidden="true">←</span> Previous</button>
            <button type="button" ref={nextRef} className={`quiz-button is-primary ${answered ? 'is-ready' : ''}`} disabled={finishBlocked} onClick={advance}>
              {complete ? 'See your results' : finishBlocked ? 'Answer to finish' : last ? 'Find next question' : 'Next challenge'} <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="quiz-navigation-note">Your pace. Your path. Use the challenge map to revisit any question.</p>
        </div>
        <aside className="quiz-sidebar" aria-label="Challenge guide">
          <div className="quiz-map-panel"><span className="quiz-label">Your challenge map</span><h2>Every step counts.</h2>
            <nav className="quiz-map" aria-label="Quiz questions">
              {challenge.questionOrder.map((questionId, position) => {
                const done = progress.correct.includes(questionId);
                return <button type="button" key={questionId} className={`quiz-map-step ${done ? 'is-done' : ''} ${id === questionId ? 'is-current' : ''}`}
                  aria-label={`Question ${position + 1}, ${done ? 'completed' : 'not completed'}`} aria-current={id === questionId ? 'step' : undefined}
                  onClick={() => moveTo(questionId)}><span>{String(position + 1).padStart(2, '0')}</span>{done && <Icon name="check" />}</button>;
              })}
            </nav>
            <div className="quiz-map-key"><span><i /> To explore</span><span><i /> Completed</span></div>
          </div>
          <div className="quiz-rewards-panel"><span className="quiz-label">The XP playbook</span><h2>Think it through.<br />Make it count.</h2>
            {[...QUIZ_XP_BY_ATTEMPT, 0].map((xp, attempt) => <div key={attempt} className={`quiz-reward-tier ${!answered && Math.min(attempts, 2) === attempt ? 'is-active' : ''}`}>
              <span>{attempt === 2 ? '3rd attempt onward' : `${attempt === 0 ? '1st' : '2nd'} attempt`}</span><strong>+{xp} <small>XP</small></strong></div>)}
            <p><Icon name="bulb" /> Zero XP still means progress. Get every answer right to complete the mission.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
