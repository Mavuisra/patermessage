import { NavLink } from "react-router-dom";
import { Icon } from "../icons/Icon";

function TabIcon({ name, active }: { name: "message" | "wallet" | "user"; active: boolean }) {
  return (
    <span className="wa-tab__icon">
      <Icon name={name} size={24} strokeWidth={active ? 2.5 : 2} className={active ? "wa-icon--primary" : "wa-icon--muted"} />
    </span>
  );
}

export function BottomNav() {
  return (
    <nav className="wa-tabbar">
      <NavLink to="/messages" className={({ isActive }) => `wa-tab ${isActive ? "wa-tab--active" : ""}`}>
        {({ isActive }) => (
          <>
            <TabIcon name="message" active={isActive} />
            Discussions
          </>
        )}
      </NavLink>
      <NavLink to="/payments" className={({ isActive }) => `wa-tab ${isActive ? "wa-tab--active" : ""}`}>
        {({ isActive }) => (
          <>
            <TabIcon name="wallet" active={isActive} />
            Paiements
          </>
        )}
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `wa-tab ${isActive ? "wa-tab--active" : ""}`}>
        {({ isActive }) => (
          <>
            <TabIcon name="user" active={isActive} />
            Profil
          </>
        )}
      </NavLink>
    </nav>
  );
}
