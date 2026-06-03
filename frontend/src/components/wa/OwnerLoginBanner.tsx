import { Link } from "react-router-dom";
import { Icon } from "../icons/Icon";
import { useAuth } from "../../context/AuthContext";

export function OwnerLoginBanner() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="wa-owner-banner wa-owner-banner--on">
        <Icon name="shield" size={20} className="wa-icon--primary" />
        <span>
          Connecté en tant que <strong>{user?.display_name || "Black Panther"}</strong>
        </span>
      </div>
    );
  }

  return (
    <Link to="/login" className="wa-owner-banner">
      <Icon name="shield" size={20} className="wa-icon--primary" />
      <span>
        <strong>Espace Black Panther</strong>
        <br />
        <small>Connexion propriétaire pour lire les messages</small>
      </span>
      <Icon name="chevron-right" size={22} className="wa-icon--muted" />
    </Link>
  );
}
