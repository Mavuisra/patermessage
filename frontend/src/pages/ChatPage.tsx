import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { publicApi, submitMessageMultipart } from "../api/client";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import logo from "../assets/logo.png";
import { Icon } from "../components/icons/Icon";
import { VoiceMessageBubble } from "../components/wa/VoiceMessageBubble";
import { StatusBar } from "../components/wa/StatusBar";
import { hasVoiceAccess } from "../lib/voiceAccess";
import { SUBSCRIPTION_LABEL } from "../lib/pricing";
import { refreshSubscription } from "../lib/subscription";
import { hasVisitor } from "../lib/visitor";
import { fetchVisitorThread } from "../lib/visitorThread";
import { visitorMessageFields } from "../lib/visitorMessage";
import { VisitorProfileForm } from "../components/wa/VisitorProfileForm";

type LocalMsg = {
  id: string;
  text?: string;
  out: boolean;
  time: string;
  priority?: boolean;
  voiceUrl?: string;
  voiceDuration?: number;
};

type Sheet = null | "priority1" | "priority2" | "identity" | "voicePay";

export function ChatPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<LocalMsg[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [pendingText, setPendingText] = useState("");
  const [pendingVoice, setPendingVoice] = useState<Blob | null>(null);
  const [systemBanner, setSystemBanner] = useState<"info" | "priority" | null>(null);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceRecorder();
  const [voicePreview, setVoicePreview] = useState<{ blob: Blob; duration: number } | null>(
    null
  );
  const draftVoiceIdRef = useRef<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!hasVisitor()) return;
    try {
      const items = await fetchVisitorThread();
      if (items.length) setMessages(items);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (hasVisitor()) refreshSubscription().catch(console.error);
  }, []);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (params.get("from") === "success") {
      void refreshSubscription();
      setSystemBanner("priority");
      sessionStorage.removeItem("bp_last_msg");
      sessionStorage.removeItem("bp_last_voice");
      sessionStorage.removeItem("bp_last_voice_dur");
      sessionStorage.removeItem("bp_voice_preview");
      void loadThread();
    }
  }, [params, loadThread]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sheet, systemBanner, voice.recording, voicePreview]);

  const removeDraftVoice = useCallback(() => {
    if (draftVoiceIdRef.current) {
      const id = draftVoiceIdRef.current;
      setMessages((m) => m.filter((msg) => msg.id !== id));
      draftVoiceIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!voice.blob || voice.recording) return;
    setVoicePreview({ blob: voice.blob, duration: voice.seconds });
    voice.reset();
  }, [voice.blob, voice.recording]);

  const stopRecording = () => {
    if (voice.recording) voice.stop();
  };

  const sendVoicePreview = async () => {
    if (!voicePreview) return;
    if (!hasVoiceAccess()) {
      setSheet("voicePay");
      return;
    }
    setLoading(true);
    const blob = voicePreview.blob;
    setVoicePreview(null);
    try {
      const payload = {
        ...visitorMessageFields(),
        subject: "",
        body: "Message vocal",
        tier: "premium" as const,
      };
      await submitMessageMultipart(payload, blob);
      await loadThread();
      setSystemBanner("priority");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const cancelVoice = () => {
    voice.cancel();
    setVoicePreview(null);
  };

  const handleSendTap = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPendingText(trimmed);
    setPendingVoice(null);
    if (!hasVisitor()) {
      setSheet("identity");
      return;
    }
    setSheet("priority1");
  };

  const bodyForSubmit = () =>
    pendingText.trim() || (pendingVoice ? "Message vocal" : "");

  const submitPremium = async () => {
    setLoading(true);
    try {
      const payload = {
        ...visitorMessageFields(),
        subject: "",
        body: bodyForSubmit(),
        tier: "premium" as const,
      };
      if (pendingVoice) {
        await submitMessageMultipart(payload, pendingVoice);
      } else {
        await publicApi.submitMessage(payload);
      }
      await loadThread();
      setText("");
      setPendingVoice(null);
      setSystemBanner("priority");
      setSheet(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const submitFree = async () => {
    if (pendingVoice) return;
    setLoading(true);
    try {
      const payload = {
        ...visitorMessageFields(),
        subject: "",
        body: bodyForSubmit(),
        tier: "free" as const,
      };
      if (pendingVoice) {
        await submitMessageMultipart(payload, pendingVoice);
      } else {
        await publicApi.submitMessage(payload);
      }
      await loadThread();
      setText("");
      setPendingVoice(null);
      draftVoiceIdRef.current = null;
      setSystemBanner("info");
      setSheet(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const closeSheet = () => {
    if (!loading && sheet) {
      if (pendingVoice) {
        removeDraftVoice();
        setPendingVoice(null);
      }
      setVoicePreview(null);
      setSheet(null);
    }
  };

  const tryStartVoice = () => {
    if (text.trim() || voice.recording || voicePreview) return;
    if (!hasVoiceAccess()) {
      if (!hasVisitor()) {
        sessionStorage.setItem("bp_voice_pending_unlock", "1");
        setSheet("identity");
        return;
      }
      setSheet("voicePay");
      return;
    }
    void voice.start();
  };

  const recActive = voice.recording || !!voicePreview;
  const recSeconds = voicePreview?.duration ?? voice.seconds;
  const hasText = !!text.trim();
  const visitorAvatar = logo;

  return (
    <div className="wa-app wa-chat">
      <StatusBar />
      <header className="wa-chat-header">
        <Link to="/messages" className="wa-chat-header__back" aria-label="Retour">
          <Icon name="back" size={28} className="wa-icon--primary" />
        </Link>
        <img src={logo} alt="" className="wa-chat-header__avatar" />
        <div className="wa-chat-header__info">
          <div className="wa-chat-header__name">
            Black Panther
            <Icon name="verified" size={16} className="wa-verified" />
          </div>
          <div className="wa-chat-header__status">En ligne</div>
        </div>
        <button type="button" className="wa-chat-header__menu" aria-label="Menu">
          <Icon name="menu" size={22} className="wa-icon--primary" />
        </button>
      </header>

      <div className="wa-chat-body" ref={bodyRef}>
        {messages.length === 0 && !systemBanner && !voice.recording && (
          <div className="wa-chat-empty">
            <Icon name="lock" size={32} className="wa-icon--muted" />
            <span>Les messages sont privés et sécurisés.</span>
          </div>
        )}

        {systemBanner === "info" && (
          <div className="wa-system-banner wa-system-banner--info">
            <Icon name="info" size={18} className="wa-icon--primary" />
            <span className="wa-system-banner__text">
              Votre message a été envoyé. Il sera analysé par notre IA.
            </span>
          </div>
        )}

        {systemBanner === "priority" && (
          <div className="wa-system-banner wa-system-banner--priority">
            <Icon name="star" size={18} style={{ fill: "currentColor", stroke: "currentColor" }} />
            <span className="wa-system-banner__text">
              Votre message a été envoyé en priorité et sera notifié immédiatement.
            </span>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`wa-bubble-row wa-bubble-row--${m.out ? "out" : "in"}`}>
            {m.voiceUrl ? (
              <VoiceMessageBubble
                src={m.voiceUrl}
                duration={m.voiceDuration}
                time={m.time}
                outgoing={m.out}
                priority={m.priority}
                avatarUrl={m.out ? visitorAvatar : logo}
              />
            ) : (
              <div className="wa-bubble">
                {m.text}
                {m.out && (
                  <div className="wa-bubble__meta">
                    {m.priority && (
                      <Icon name="check-double" size={14} className="wa-icon--white" />
                    )}
                    <span>{m.time}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="wa-composer-wrap">
        {recActive ? (
          <div className="wa-composer wa-composer--recording">
            <div className="wa-rec-bar">
              <button
                type="button"
                className="wa-rec-bar__btn-icon"
                onClick={cancelVoice}
                aria-label="Supprimer l'enregistrement"
              >
                <Icon name="trash" size={22} className="wa-icon--muted" />
              </button>
              {voice.recording && <span className="wa-rec-bar__dot" aria-hidden />}
              <span className="wa-rec-bar__time">{voice.formatSeconds(recSeconds)}</span>
              <div className="wa-rec-bar__waves" aria-hidden>
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    className={`wa-rec-bar__wave ${voice.recording ? "wa-rec-bar__wave--live" : ""}`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  />
                ))}
              </div>
              <div className="wa-rec-bar__actions">
                {voice.recording && (
                  <button
                    type="button"
                    className="wa-rec-bar__stop"
                    onClick={stopRecording}
                    aria-label="Arrêter l'enregistrement"
                  >
                    <Icon name="stop" size={16} className="wa-icon--muted" />
                    Arrêter
                  </button>
                )}
                {voicePreview && (
                  <button
                    type="button"
                    className="wa-rec-bar__send"
                    onClick={sendVoicePreview}
                    aria-label="Envoyer le message vocal"
                  >
                    <Icon name="send" size={18} className="wa-icon--white" />
                    Envoyer
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="wa-composer">
            <Link to="/messages" className="wa-composer__plus" aria-label="Retour aux discussions">
              <Icon name="plus" size={24} className="wa-icon--primary" />
            </Link>
            <textarea
              className="wa-composer__input"
              rows={1}
              placeholder="Message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTap();
                }
              }}
            />
            {hasText ? (
              <button
                type="button"
                className="wa-composer__send"
                onClick={handleSendTap}
                aria-label="Envoyer"
              >
                <Icon name="send" size={20} className="wa-icon--white" />
              </button>
            ) : (
              <button
                type="button"
                className={`wa-composer__mic ${!hasVoiceAccess() ? "wa-composer__mic--locked" : ""}`}
                aria-label={
                  hasVoiceAccess()
                    ? "Enregistrer un message vocal"
                    : "Message vocal réservé aux utilisateurs premium"
                }
                onClick={tryStartVoice}
              >
                <Icon
                  name={hasVoiceAccess() ? "mic" : "lock"}
                  size={22}
                  className="wa-icon--primary"
                />
              </button>
            )}
          </div>
        )}
        {voice.error && <p className="wa-composer-error">{voice.error}</p>}
      </div>

      <AnimatePresence>
        {sheet && sheet !== null && (
          <motion.div
            className="wa-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
          >
            <motion.div
              className="wa-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wa-sheet__handle" />

              {sheet === "identity" && (
                <>
                  <div className="wa-sheet__title">Votre profil</div>
                  <p className="wa-sheet__text">
                    Renseignez vos informations avant d&apos;envoyer votre message.
                  </p>
                  <VisitorProfileForm
                    compact
                    mode="signup"
                    onSaved={() => {
                      if (sessionStorage.getItem("bp_voice_pending_unlock")) {
                        sessionStorage.removeItem("bp_voice_pending_unlock");
                        setSheet("voicePay");
                      } else {
                        setSheet("priority1");
                      }
                    }}
                  />
                </>
              )}

              {sheet === "voicePay" && (
                <>
                  <div className="wa-sheet__icon">
                    <Icon name="mic" size={28} className="wa-icon--white" />
                  </div>
                  <h2 className="wa-sheet__title">Abonnement requis</h2>
                  <p className="wa-sheet__text">
                    Messages vocaux et priorité — {SUBSCRIPTION_LABEL}
                  </p>
                  <button
                    type="button"
                    className="wa-btn-primary"
                    disabled={loading}
                    onClick={() => navigate("/payment/methods")}
                  >
                    <Icon name="lock" size={18} className="wa-icon--white" style={{ marginRight: 6 }} />
                    S&apos;abonner — {SUBSCRIPTION_LABEL}
                  </button>
                  <button type="button" className="wa-btn-cancel" onClick={closeSheet}>
                    Annuler
                  </button>
                </>
              )}

              {sheet === "priority1" && (
                <>
                  <div className="wa-sheet__icon">
                    <Icon name="shield" size={28} className="wa-icon--white" />
                  </div>
                  <h2 className="wa-sheet__title">
                    Souhaitez-vous que votre message soit pris en priorité ?
                  </h2>
                  <p className="wa-sheet__text">
                    Abonnement {SUBSCRIPTION_LABEL} pour la priorité.
                  </p>
                  <button
                    type="button"
                    className="wa-btn-primary"
                    onClick={() =>
                      hasVoiceAccess() ? void submitPremium() : setSheet("priority2")
                    }
                  >
                    {hasVoiceAccess() ? "Envoyer en priorité" : "Voir l'abonnement"}
                  </button>
                  {!pendingVoice && (
                    <button
                      type="button"
                      className="wa-btn-outline"
                      disabled={loading}
                      onClick={submitFree}
                    >
                      Envoyer sans payer
                    </button>
                  )}
                  <button type="button" className="wa-btn-cancel" onClick={closeSheet}>
                    Annuler
                  </button>
                </>
              )}

              {sheet === "priority2" && (
                <>
                  <h2 className="wa-sheet__title">
                    {pendingVoice ? "Envoyer votre message vocal" : "Message prioritaire"}
                  </h2>
                  <div className="wa-sheet__feature">
                    <span className="wa-sheet__feature-icon">
                      <Icon name="bell" size={20} className="wa-icon--primary" />
                    </span>
                    Notification instantanée
                  </div>
                  <div className="wa-sheet__feature">
                    <span className="wa-sheet__feature-icon">
                      <Icon name="check-double" size={20} className="wa-icon--primary" />
                    </span>
                    Traitement en priorité
                  </div>
                  <div className="wa-sheet__price">{SUBSCRIPTION_LABEL}</div>
                  <button
                    type="button"
                    className="wa-btn-primary"
                    disabled={loading}
                    onClick={() => navigate("/payment/methods")}
                  >
                    <Icon name="lock" size={18} className="wa-icon--white" style={{ marginRight: 6 }} />
                    S&apos;abonner
                  </button>
                  <button
                    type="button"
                    className="wa-btn-cancel"
                    onClick={() => (pendingVoice ? closeSheet() : setSheet("priority1"))}
                  >
                    {pendingVoice ? "Annuler" : "Retour"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
