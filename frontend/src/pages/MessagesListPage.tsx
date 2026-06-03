import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { Icon } from "../components/icons/Icon";
import { BottomNav } from "../components/wa/BottomNav";
import { StatusBar } from "../components/wa/StatusBar";
import { useAuth } from "../context/AuthContext";
import { hasVisitor } from "../lib/visitor";
import { ownerApi, type InboundMessage, type OwnerMessageFilters } from "../api/client";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function VerifiedName({ children }: { children: ReactNode }) {
  return (
    <span className="wa-convo-item__name">
      {children}
      <Icon name="verified" size={16} className="wa-verified" />
    </span>
  );
}

function latestPerVisitor(messages: InboundMessage[]): InboundMessage[] {
  const map = new Map<string, InboundMessage>();
  for (const m of messages) {
    const key = m.sender_email.toLowerCase();
    const prev = map.get(key);
    if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
      map.set(key, m);
    }
  }
  return Array.from(map.values());
}

export function MessagesListPage() {
  const { isAuthenticated, authReady } = useAuth();
  const [ownerMessages, setOwnerMessages] = useState<InboundMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minRelevance, setMinRelevance] = useState("");
  const [order, setOrder] = useState<OwnerMessageFilters["order"]>("-date");
  const [showFilters, setShowFilters] = useState(false);

  const filters: OwnerMessageFilters = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      min_relevance: minRelevance !== "" ? Number(minRelevance) : undefined,
      order,
      search: search.trim() || undefined,
    }),
    [dateFrom, dateTo, minRelevance, order, search]
  );

  const load = useCallback(async () => {
    if (!authReady || !isAuthenticated) return;
    setLoading(true);
    try {
      const m = await ownerApi.getMessages(filters);
      setOwnerMessages(m.results || []);
    } catch {
      setOwnerMessages([]);
    } finally {
      setLoading(false);
    }
  }, [authReady, isAuthenticated, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => {
      if (isAuthenticated) void load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated, load]);

  const visitors = useMemo(
    () => latestPerVisitor(ownerMessages),
    [ownerMessages]
  );

  const deleteVisitor = async (email: string, name: string) => {
    if (
      !confirm(
        `Supprimer ${name} et toutes ses données (messages, paiements, compte) ?`
      )
    ) {
      return;
    }
    try {
      await ownerApi.deleteVisitor(email);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Suppression impossible");
    }
  };

  return (
    <div className="wa-app wa-screen">
      <StatusBar />
      <h1 className="wa-screen__title">Messages</h1>

      {isAuthenticated && (
        <>
          <div className="wa-search">
            <Icon name="search" size={18} className="wa-icon--muted" />
            <input
              type="search"
              placeholder="Rechercher"
              aria-label="Rechercher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="wa-owner-filter-toggle"
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Filtres"
            >
              <Icon name="menu" size={20} className="wa-icon--primary" />
            </button>
          </div>

          {showFilters && (
            <div className="wa-owner-filters">
              <label className="wa-owner-filters__field">
                <span>Du</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="wa-owner-filters__field">
                <span>Au</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
              <label className="wa-owner-filters__field">
                <span>Pertinence min. (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={minRelevance}
                  onChange={(e) => setMinRelevance(e.target.value)}
                />
              </label>
              <label className="wa-owner-filters__field">
                <span>Tri</span>
                <select
                  value={order}
                  onChange={(e) =>
                    setOrder(e.target.value as OwnerMessageFilters["order"])
                  }
                >
                  <option value="-date">Date ↓ récent</option>
                  <option value="date">Date ↑ ancien</option>
                  <option value="relevance">Pertinence ↓</option>
                  <option value="-relevance">Pertinence ↑</option>
                </select>
              </label>
            </div>
          )}
        </>
      )}

      {!isAuthenticated && !hasVisitor() && (
        <Link to="/profile" className="wa-visitor-login-banner">
          <span>Se connecter pour discuter</span>
          <Icon name="user" size={20} className="wa-icon--primary" />
        </Link>
      )}

      {isAuthenticated && loading && (
        <p className="wa-pay-muted" style={{ padding: "1rem" }}>
          Chargement…
        </p>
      )}

      {isAuthenticated && !loading && visitors.length > 0 ? (
        visitors.map((msg) => (
          <div key={msg.sender_email} className="wa-convo-item-wrap">
            <Link
              to={`/owner/chat/${encodeURIComponent(msg.sender_email)}`}
              className="wa-convo-item"
            >
              <img src={logo} alt="" className="wa-avatar" />
              <div className="wa-convo-item__body">
                <div className="wa-convo-item__row">
                  <span className="wa-convo-item__name">
                    {msg.sender_name}
                    {msg.is_priority && (
                      <Icon
                        name="star"
                        size={14}
                        className="wa-icon--primary"
                        style={{ marginLeft: 4, fill: "currentColor" }}
                      />
                    )}
                  </span>
                  <span className="wa-convo-item__time">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
                <p className="wa-convo-item__preview">
                  {msg.analysis?.summary || msg.body.slice(0, 50)}
                </p>
                {msg.analysis && (
                  <span className="wa-convo-item__score">
                    {Math.round(msg.analysis.relevance_score)}% pertinent
                  </span>
                )}
              </div>
            </Link>
            <button
              type="button"
              className="wa-convo-item__delete"
              aria-label={`Supprimer ${msg.sender_name}`}
              onClick={(e) => {
                e.preventDefault();
                void deleteVisitor(msg.sender_email, msg.sender_name);
              }}
            >
              <Icon name="trash" size={18} className="wa-icon--muted" />
            </button>
          </div>
        ))
      ) : isAuthenticated && !loading ? (
        <p className="wa-pay-muted" style={{ padding: "1rem" }}>
          Aucun message pour ces filtres.
        </p>
      ) : !isAuthenticated ? (
        <Link to="/chat" className="wa-convo-item">
          <img src={logo} alt="" className="wa-avatar" />
          <div className="wa-convo-item__body">
            <div className="wa-convo-item__row">
              <VerifiedName>Black Pater</VerifiedName>
              <span className="wa-convo-item__time">09:41</span>
            </div>
            <p className="wa-convo-item__preview">Commencez votre conversation…</p>
          </div>
        </Link>
      ) : null}

      <BottomNav />
    </div>
  );
}
