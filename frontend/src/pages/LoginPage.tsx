import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { Icon } from "../components/icons/Icon";
import { StatusBar } from "../components/wa/StatusBar";
import { useAuth } from "../context/AuthContext";

export function LoginPage({ adminMode = false }: { adminMode?: boolean }) {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/messages", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate("/messages", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wa-app wa-login">
      <StatusBar />
      <img src={logo} alt="" className="wa-login__logo" />
      <h1 className="wa-login__h1">
        {adminMode ? "Administration Black Pater" : "Connexion"}
      </h1>
      <p className="wa-login__sub">
        Accès réservé au propriétaire — messages, vocaux et statistiques.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="wa-field">
          <span className="wa-field__icon">
            <Icon name="user" size={20} className="wa-icon--muted" />
          </span>
          <input
            type="text"
            placeholder="Nom d'utilisateur (ex. admin)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="wa-field">
          <span className="wa-field__icon">
            <Icon name="lock" size={20} className="wa-icon--muted" />
          </span>
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="wa-field__toggle"
            onClick={() => setShowPwd(!showPwd)}
            aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <Icon name={showPwd ? "eye-off" : "eye"} size={20} className="wa-icon--muted" />
          </button>
        </div>

        <Link to="/login" className="wa-link" onClick={(e) => e.preventDefault()}>
          Mot de passe oublié ?
        </Link>

        {error && <p className="wa-error">{error}</p>}

        <button type="submit" className="wa-btn-primary" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      {!adminMode && (
        <p className="wa-login__footer">
          <Link to="/messages">Retour aux messages</Link>
        </p>
      )}
    </div>
  );
}
