import { useApp } from '../App.jsx';
import Icon from '../components/Icon.jsx';
import MissionList from '../components/MissionList.jsx';
import RouteNote from '../components/RouteNote.jsx';

export default function Missions() {
  const { d } = useApp();

  return (
    <section id="missions" className="page active" aria-labelledby="missions-title">
      <div className="section-head">
        <div>
          <h1 id="missions-title" className="page-title">Learning missions</h1>
          <p className="sub">
            Complete four missions, earn XP and unlock badges.
          </p>
        </div>
      </div>
      <RouteNote />
      <div className="side-grid">
        <MissionList id="missionList" headingLevel="h2" />
        <div className="card tracker">
          <strong>{d.role ? `${d.role.id} path` : 'Your learning path'}</strong>
          <div className="circle" style={{ '--angle': `${(d.doneCount / 4) * 360}deg` }}>
            <div><strong>{d.doneCount} / 4</strong><span className="small">Missions</span></div>
          </div>
          <div>
            {d.order.map((i) => {
              const done = d.completed[i];
              return (
              <p key={i} className={`small checklist-item ${done ? 'done' : ''}`}>
                <span className="dot" aria-hidden="true">{done && <Icon name="check" />}</span>
                Mission {i + 1}:{' '}
                {done
                  ? 'complete'
                  : d.perMission[i] > 0
                    ? `in progress (${d.perMission[i]}%)`
                    : i === d.nextIndex && d.role
                      ? 'recommended next'
                      : 'not started'}
              </p>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
