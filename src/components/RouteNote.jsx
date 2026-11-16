import { ROLES } from '../data.js';
import { useApp } from '../App.jsx';

/** One line explaining the chosen role's route, with buttons to switch or clear the role.
    Renders nothing when no role is chosen. */
export default function RouteNote() {
  const { d, actions } = useApp();
  if (!d.role) return null;
  const others = ROLES.filter((r) => r.id !== d.role.id);

  return (
    <div className="route-note">
      <p>
        <strong>{d.role.id} route:</strong> {d.role.why}
      </p>
      <div className="route-actions">
        {others.map((r) => (
          <button key={r.id} className="button ghost" onClick={() => actions.chooseRole(r.id)}>
            Switch to {r.id}
          </button>
        ))}
        <button className="button ghost" onClick={actions.clearRole}>Clear role</button>
      </div>
    </div>
  );
}
