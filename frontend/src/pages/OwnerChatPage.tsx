import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ownerApi,
  type InboundMessage,
  type OwnerReply,
} from "../api/client";
import logo from "../assets/logo.png";
import { Icon } from "../components/icons/Icon";
import { VoiceMessageBubble } from "../components/wa/VoiceMessageBubble";
import { StatusBar } from "../components/wa/StatusBar";
import { useAuth } from "../context/AuthContext";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OwnerChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [msg, setMsg] = useState<InboundMessage | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (id) ownerApi.getMessage(Number(id)).then(setMsg).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/adminpater", { replace: true });
      return;
    }
    load();
  }, [isAuthenticated, load, navigate]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msg, text]);

  const sendReply = async () => {
    const trimmed = text.trim();
    if (!trimmed || !msg) return;
    setSending(true);
    try {
      const reply = await ownerApi.sendReply(msg.id, trimmed);
      setMsg((m) =>
        m ? { ...m, replies: [...(m.replies || []), reply] } : m
      );
      setText("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) return null;

  if (!msg) {
    return (
      <div className="wa-app wa-chat">
        <StatusBar />
        <p style={{ padding: "2rem", textAlign: "center" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="wa-app wa-chat wa-chat--owner">
      <StatusBar />
      <header className="wa-chat-header">
        <Link to="/messages" className="wa-chat-header__back" aria-label="Retour">
          <Icon name="back" size={28} className="wa-icon--primary" />
        </Link>
        <img src={logo} alt="" className="wa-chat-header__avatar" />
        <div className="wa-chat-header__info">
          <div className="wa-chat-header__name">{msg.sender_name}</div>
          <div className="wa-chat-header__status">
            {msg.sender_occupation && <span>{msg.sender_occupation}</span>}
            {msg.sender_occupation && " · "}
            {msg.sender_email}
            {msg.sender_phone && ` · ${msg.sender_phone}`}
          </div>
        </div>
        <button
          type="button"
          className="wa-chat-header__menu"
          aria-label="Supprimer ce visiteur"
          onClick={async () => {
            if (
              !confirm(
                `Supprimer ${msg.sender_name} et toutes ses données ?`
              )
            ) {
              return;
            }
            try {
              await ownerApi.deleteVisitor(msg.sender_email);
              navigate("/messages");
            } catch (e) {
              alert(e instanceof Error ? e.message : "Erreur");
            }
          }}
        >
          <Icon name="trash" size={22} className="wa-icon--muted" />
        </button>
      </header>

      {msg.analysis && (
        <div className="wa-owner-analysis">
          <span>
            Pertinence : <strong>{Math.round(msg.analysis.relevance_score)}%</strong>
          </span>
          {msg.analysis.summary && <span> — {msg.analysis.summary}</span>}
        </div>
      )}

      <div className="wa-chat-body" ref={bodyRef}>
        {msg.voice_note_url && (
          <div className="wa-bubble-row wa-bubble-row--in">
            <VoiceMessageBubble
              src={msg.voice_note_url}
              outgoing={false}
              avatarUrl={logo}
            />
          </div>
        )}
        {msg.body && msg.body !== "Message vocal" && (
          <div className="wa-bubble-row wa-bubble-row--in">
            <div className="wa-bubble">
              {msg.body}
              <div className="wa-bubble__meta">
                <span>{formatTime(msg.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        {(msg.replies || []).map((r: OwnerReply) => (
          <div key={r.id} className="wa-bubble-row wa-bubble-row--out">
            <div className="wa-bubble">
              {r.body}
              <div className="wa-bubble__meta">
                <Icon name="check-double" size={14} className="wa-icon--white" />
                <span>{formatTime(r.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="wa-composer-wrap">
        <div className="wa-composer">
          <textarea
            className="wa-composer__input"
            rows={1}
            placeholder={`Répondre à ${msg.sender_name}…`}
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
