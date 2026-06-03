import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ownerApi, type InboundMessage } from "../api/client";
import logo from "../assets/logo.png";
import { Icon } from "../components/icons/Icon";
import { VoiceMessageBubble } from "../components/wa/VoiceMessageBubble";
import { StatusBar } from "../components/wa/StatusBar";
import { useAuth } from "../context/AuthContext";
import {
  fetchOwnerThread,
  fetchVisitorSummary,
  latestInboundMessageId,
  type OwnerChatMsg,
} from "../lib/ownerThread";

export function OwnerChatPage() {
  const { visitorEmail: rawEmail } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authReady } = useAuth();
  const [visitor, setVisitor] = useState<InboundMessage | null>(null);
  const [messages, setMessages] = useState<OwnerChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  const visitorEmail = useMemo(() => {
    if (!rawEmail) return "";
    try {
      return decodeURIComponent(rawEmail).trim();
    } catch {
      return rawEmail.trim();
    }
  }, [rawEmail]);

  const load = useCallback(async () => {
    if (!visitorEmail) return;
    setLoading(true);
    try {
      if (/^\d+$/.test(visitorEmail)) {
        const m = await ownerApi.getMessage(Number(visitorEmail));
        navigate(`/owner/chat/${encodeURIComponent(m.sender_email)}`, {
          replace: true,
        });
        return;
      }
      const [thread, summary] = await Promise.all([
        fetchOwnerThread(visitorEmail),
        fetchVisitorSummary(visitorEmail),
      ]);
      setMessages(thread);
      setVisitor(summary);
    } catch (e) {
      console.error(e);
      setMessages([]);
      setVisitor(null);
    } finally {
      setLoading(false);
    }
  }, [visitorEmail, navigate]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      navigate("/adminpater", { replace: true });
      return;
    }
    void load();
  }, [authReady, isAuthenticated, load, navigate]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, text]);

  const sendReply = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const messageId = latestInboundMessageId(messages);
    if (!messageId) {
      alert("Aucun message visiteur auquel répondre.");
      return;
    }
    setSending(true);
    try {
      const reply = await ownerApi.sendReply(messageId, trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `owner-${reply.id}`,
          out: true,
          time: new Date(reply.created_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text: reply.body,
        },
      ]);
      setText("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  if (!authReady || !isAuthenticated) return null;

  if (loading) {
    return (
      <div className="wa-app wa-chat">
        <StatusBar />
        <p style={{ padding: "2rem", textAlign: "center" }}>Chargement…</p>
      </div>
    );
  }

  const displayName = visitor?.sender_name || visitorEmail || "Visiteur";

  return (
    <div className="wa-app wa-chat wa-chat--owner">
      <StatusBar />
      <header className="wa-chat-header">
        <Link to="/messages" className="wa-chat-header__back" aria-label="Retour">
          <Icon name="back" size={28} className="wa-icon--primary" />
        </Link>
        <img src={logo} alt="" className="wa-chat-header__avatar" />
        <div className="wa-chat-header__info">
          <div className="wa-chat-header__name">{displayName}</div>
          <div className="wa-chat-header__status">
            {visitor?.sender_occupation && <span>{visitor.sender_occupation}</span>}
            {visitor?.sender_occupation && " · "}
            {visitorEmail}
            {visitor?.sender_phone && ` · ${visitor.sender_phone}`}
          </div>
        </div>
        <button
          type="button"
          className="wa-chat-header__menu"
          aria-label="Supprimer ce visiteur"
          onClick={async () => {
            if (!confirm(`Supprimer ${displayName} et toutes ses données ?`)) return;
            try {
              await ownerApi.deleteVisitor(visitorEmail);
              navigate("/messages");
            } catch (e) {
              alert(e instanceof Error ? e.message : "Erreur");
            }
          }}
        >
          <Icon name="trash" size={22} className="wa-icon--muted" />
        </button>
      </header>

      {visitor?.analysis && (
        <div className="wa-owner-analysis">
          <span>
            Pertinence :{" "}
            <strong>{Math.round(visitor.analysis.relevance_score)}%</strong>
          </span>
          {visitor.analysis.summary && <span> — {visitor.analysis.summary}</span>}
        </div>
      )}

      <div className="wa-chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <p className="wa-pay-muted" style={{ padding: "1rem", textAlign: "center" }}>
            Aucun message pour ce visiteur.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`wa-bubble-row wa-bubble-row--${m.out ? "out" : "in"}`}
          >
            {m.voiceUrl ? (
              <VoiceMessageBubble
                src={m.voiceUrl}
                time={m.time}
                outgoing={m.out}
                priority={m.priority}
                avatarUrl={m.out ? logo : logo}
              />
            ) : (
              <div className="wa-bubble">
                {m.text}
                <div className="wa-bubble__meta">
                  {m.out && (
                    <Icon name="check-double" size={14} className="wa-icon--white" />
                  )}
                  <span>{m.time}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="wa-composer-wrap">
        <div className="wa-composer">
          <textarea
            className="wa-composer__input"
            rows={1}
            placeholder={`Répondre à ${displayName}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendReply();
              }
            }}
          />
          <button
            type="button"
            className="wa-composer__send"
            disabled={!text.trim() || sending}
            onClick={() => void sendReply()}
            aria-label="Envoyer la réponse"
          >
            <Icon name="send" size={20} className="wa-icon--white" />
          </button>
        </div>
        <p className="wa-owner-composer-hint">Vous répondez en tant que Black Pater</p>
      </div>
    </div>
  );
}
