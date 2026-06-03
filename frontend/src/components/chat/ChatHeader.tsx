import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import { ThemeToggle } from "../ThemeToggle";

interface ChatHeaderProps {
  name: string;
  status?: string;
  backTo?: string;
  onBack?: () => void;
  showPrivateLink?: boolean;
}

export function ChatHeader({
  name,
  status = "en ligne",
  backTo,
  onBack,
  showPrivateLink = true,
}: ChatHeaderProps) {
  return (
    <header className="chat-header">
      {onBack ? (
        <button type="button" className="chat-header__btn" onClick={onBack} aria-label="Retour">
          ←
        </button>
      ) : backTo ? (
        <Link to={backTo} className="chat-header__btn" aria-label="Retour">
          ←
        </Link>
      ) : null}
      <img src={logo} alt="" className="chat-header__avatar" />
      <div className="chat-header__info">
        <div className="chat-header__name">{name}</div>
        <div className="chat-header__status">{status}</div>
      </div>
      <div className="chat-header__actions">
        {showPrivateLink && (
          <Link to="/login" className="chat-header__btn" title="Espace privé">
            🔒
          </Link>
        )}
        <ThemeToggle compact />
      </div>
    </header>
  );
}
