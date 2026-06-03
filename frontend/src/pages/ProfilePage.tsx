import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { BottomNav } from "../components/wa/BottomNav";
import { StatusBar } from "../components/wa/StatusBar";
import {
  VisitorProfileEditForm,
  VisitorProfileForm,
  type VisitorAuthMode,
} from "../components/wa/VisitorProfileForm";
import { useAuth } from "../context/AuthContext";
import { clearVisitorSession } from "../lib/voiceAccess";
import { clearVisitor, getVisitor, hasVisitor } from "../lib/visitor";

export function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [authMode, setAuthMode] = useState<VisitorAuthMode>("login");
  const [visitorKey, setVisitorKey] = useState(0);
  const [connected, setConnected] = useState(hasVisitor);
  const visitor = getVisitor();

  const handleVisitorLogout = () => {
    clearVisitor();
    clearVisitorSession();
    setConnected(false);
    setAuthMode("login");
    setVisitorKey((k) => k + 1);
  };

  return (
    <div className="wa-app wa-screen">
      <StatusBar />
      <h1 className="wa-screen__title">Profil</h1>
      <div className="wa-page-pad">
        {isAuthenticated && (
          <div className="wa-card wa-card--center wa-profile-owner">
            <img src={logo} alt="" className="wa-profile-logo" />
            <strong>{user?.display_name || "Black Pater"}</strong>
            <p className="wa-profile-role">Compte propriétaire</p>
            <Link
              to="/messages"
              className="wa-btn-outline wa-profile-owner__link"
            >
              Voir les messages reçus
            </Link>
            <button type="button" className="wa-btn-outline" onClick={logout}>
              Déconnexion propriétaire
            </button>
          </div>
        )}

        <div className="wa-card wa-visitor-connect">
          <div className="wa-visitor-connect__head wa-card--center">
            <img src={logo} alt="" className="wa-profile-logo" />
            {connected ? (
              <>
                <strong>{visitor.name}</strong>
                <p className="wa-profile-role">{visitor.email}</p>
              </>
            ) : (
              <p className="wa-profile-role">Accès visiteur</p>
            )}
          </div>

          {connected ? (
            <>
              <VisitorProfileEditForm
                key={visitorKey}
                onSaved={() => navigate("/chat")}
              />
              <Link
                to="/chat"
                className="wa-btn-outline wa-profile-owner__link"
                style={{ marginTop: "0.5rem" }}
              >
                Ouvrir le chat
              </Link>
              <button
                type="button"
                className="wa-btn-outline wa-profile-logout"
                onClick={handleVisitorLogout}
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <VisitorProfileForm
              key={`${visitorKey}-${authMode}`}
              mode={authMode}
              onModeChange={setAuthMode}
              onSaved={() => {
                setConnected(true);
                navigate("/chat");
              }}
            />
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
