import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ownerApi,
  type DashboardStats,
  type InboundMessage,
  type Payment,
} from "../api/client";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { initFCM } from "../services/fcm";

type Tab = "messages" | "stats" | "payments";

export function DashboardPage() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("messages");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [messages, setMessages] = useState<InboundMessage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selected, setSelected] = useState<InboundMessage | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate("/adminpater", { replace: true });
  }, [isAuthenticated, navigate]);

  const load = useCallback(async () => {
    try {
      const [s, m, p] = await Promise.all([
        ownerApi.getStats(),
        ownerApi.getMessages(),
        ownerApi.getPayments(),
      ]);
      setStats(s);
      setMessages(m.results || []);
      setPayments(p.results || []);
    } catch {
      logout();
      navigate("/adminpater");
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
      initFCM(() => load());
    }
  }, [isAuthenticated, load]);

  if (!isAuthenticated) return null;

  if (selected) {
    return (
      <div className="bp-app bp-form-page">
        <header className="bp-form-header">
          <button type="button" className="bp-back-btn" onClick={() => setSelected(null)}>
            ←
          </button>
          <h1 className="bp-form-header__title">{selected.sender_name}</h1>
        </header>
        <div className="bp-form-content">
          <div className="bp-textarea-card">
            <p style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>{selected.body}</p>
          </div>
          {selected.analysis && (
            <>
              <div className="bp-info-banner">
                <span className="bp-info-banner__icon">★</span>
                <span>
                  Score {Math.round(selected.analysis.relevance_score)}/100 —{" "}
                  {selected.analysis.summary}
                </span>
              </div>
              {selected.analysis.opportunity_detected && (
                <div className="bp-info-banner" style={{ borderColor: "rgba(255,200,50,0.4)" }}>
                  🎯 {selected.analysis.opportunity_details}
                </div>
              )}
              <div className="bp-recap">
                <div className="bp-recap__title">Réponse suggérée</div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {selected.analysis.suggested_reply}
                </p>
              </div>
            </>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="bp-btn-pay"
              style={{ flex: 1 }}
              onClick={() => ownerApi.reanalyze(selected.id).then(load)}
            >
              Réanalyser
            </button>
            <button
              type="button"
              className="bp-back-btn"
              style={{ flex: 1, width: "auto", borderRadius: 14 }}
              onClick={() => ownerApi.archive(selected.id).then(() => { setSelected(null); load(); })}
            >
              Archiver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-app bp-select" style={{ minHeight: "100dvh" }}>
      <div className="bp-select__gradient" aria-hidden />
      <header className="bp-select__header" style={{ marginBottom: "1rem" }}>
        <img src={logo} alt="" style={{ width: 56, borderRadius: 14, marginBottom: "0.75rem" }} />
        <div className="bp-bp-logo">BP</div>
        <h1 className="bp-select__title" style={{ fontSize: "1.1rem" }}>
          {user?.display_name || "Dashboard"}
        </h1>
      </header>

      <div className="bp-option-list" style={{ marginBottom: "1rem" }}>
        {(["messages", "stats", "payments"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`bp-option ${tab === t ? "bp-option--active" : ""}`}
            style={tab === t ? { borderColor: "rgba(2,93,204,0.5)" } : undefined}
            onClick={() => setTab(t)}
          >
            <span>
              {t === "messages" && "💬 Messages"}
              {t === "stats" && "📊 Statistiques"}
              {t === "payments" && "💳 Paiements"}
            </span>
          </button>
        ))}
        <button type="button" className="bp-option" onClick={logout}>
          Déconnexion
        </button>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {tab === "messages" &&
          messages.map((msg) => (
            <button
              key={msg.id}
              type="button"
              className="bp-option"
              style={{ marginBottom: "0.75rem" }}
              onClick={() => setSelected(msg)}
            >
              <img src={logo} alt="" className="bp-option__icon" style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div className="bp-option__body">
                <div className="bp-option__name">
                  {msg.sender_name}
                  {msg.is_priority && " ⭐"}
                </div>
                <p className="bp-option__desc">
                  {msg.analysis?.summary || msg.body.slice(0, 60)}
                </p>
              </div>
              {msg.analysis && (
                <span className="bp-option__price">{Math.round(msg.analysis.relevance_score)}</span>
              )}
            </button>
          ))}

        {tab === "stats" && stats && (
          <div className="bp-option" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <p className="bp-option__desc" style={{ marginBottom: "0.75rem" }}>
              {stats.totals.messages} messages · {stats.totals.revenue_display}
            </p>
            <p className="bp-option__price">
              {stats.totals.opportunities} opportunités · score {stats.totals.avg_relevance_score}
            </p>
          </div>
        )}

        {tab === "payments" &&
          payments.map((p) => (
            <div key={p.id} className="bp-option" style={{ marginBottom: "0.75rem" }}>
              <div className="bp-option__body">
                <div className="bp-option__name">{p.amount_display}</div>
                <p className="bp-option__desc">{p.customer_name || p.customer_email}</p>
              </div>
              <span className="bp-option__price">{p.status}</span>
            </div>
          ))}
      </div>

      <Link to="/" className="bp-select__admin">
        Page publique
      </Link>
    </div>
  );
}
