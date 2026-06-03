import {
  createContext,
  useContext,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { formatPrice, publicApi, type PlatformProfile } from "../api/client";
import { ChatBubble } from "./chat/ChatBubble";

interface MessageFormContextValue {
  profile: PlatformProfile;
  tier: "free" | "premium";
  setTier: (t: "free" | "premium") => void;
  sent: boolean;
  loading: boolean;
  form: { sender_name: string; sender_email: string; body: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ sender_name: string; sender_email: string; body: string }>
  >;
  handleSubmit: (e: FormEvent) => void;
}

const MessageFormContext = createContext<MessageFormContextValue | null>(null);

function useMessageForm() {
  const ctx = useContext(MessageFormContext);
  if (!ctx) throw new Error("MessageForm components must be inside MessageFormProvider");
  return ctx;
}

export function MessageFormProvider({
  profile,
  onSuccess,
  children,
}: {
  profile: PlatformProfile;
  onSuccess: (msg: string) => void;
  children: ReactNode;
}) {
  const [tier, setTier] = useState<"free" | "premium">("free");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ sender_name: "", sender_email: "", body: "" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await publicApi.submitMessage({
        ...form,
        subject: "",
        tier,
      });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      if (tier === "premium" && !res.checkout_url) {
        await publicApi.mockConfirm({ message_id: res.message.id });
      }
      setSent(true);
      onSuccess(tier === "premium" ? "Message premium envoyé ✓" : "Message envoyé ✓");
      setForm({ sender_name: "", sender_email: "", body: "" });
    } catch (err) {
      onSuccess(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MessageFormContext.Provider
      value={{ profile, tier, setTier, sent, loading, form, setForm, handleSubmit }}
    >
      {children}
    </MessageFormContext.Provider>
  );
}

export function MessageFormMessages() {
  const { profile, tier, sent } = useMessageForm();
  return (
    <>
      <div className="chat-date-pill">Aujourd&apos;hui</div>
      <ChatBubble direction="in">
        Salut 👋 Je suis <strong>{profile.display_name}</strong>. Envoie-moi un message — analyse
        IA incluse.
      </ChatBubble>
      <ChatBubble direction="in">
        <strong>Gratuit</strong> · analyse complète.
        <br />
        <strong>Premium {formatPrice(profile.premium_message_price.cents)}</strong> · priorité max.
      </ChatBubble>
      {tier === "premium" && (
        <ChatBubble direction="in" premium>
          Mode premium activé 🐆
        </ChatBubble>
      )}
      {sent && <ChatBubble direction="out">Message envoyé !</ChatBubble>}
    </>
  );
}

export function MessageFormChips() {
  const { profile, tier, setTier } = useMessageForm();
  return (
    <div className="chat-chips">
      <button
        type="button"
        className={`chat-chip ${tier === "free" ? "active" : ""}`}
        onClick={() => setTier("free")}
      >
        💬 Gratuit
      </button>
      <button
        type="button"
        className={`chat-chip chat-chip--gold ${tier === "premium" ? "active" : ""}`}
        onClick={() => setTier("premium")}
      >
        ⭐ Premium · {formatPrice(profile.premium_message_price.cents)}
      </button>
    </div>
  );
}

export function MessageFormFooter() {
  const { form, setForm, loading, handleSubmit } = useMessageForm();
  return (
    <div className="chat-composer-wrap">
      <form onSubmit={handleSubmit} className="chat-composer">
        <div className="chat-composer__field">
          <div>
            <label className="label">Ton nom</label>
            <input
              className="input"
              required
              placeholder="Prénom"
              value={form.sender_name}
              onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              placeholder="email@exemple.com"
              value={form.sender_email}
              onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="input"
              required
              rows={2}
              placeholder="Écris ton message…"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="chat-send" disabled={loading} aria-label="Envoyer">
          {loading ? "…" : "➤"}
        </button>
      </form>
    </div>
  );
}
