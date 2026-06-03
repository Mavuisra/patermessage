import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { publicApi, type PlatformProfile } from "../api/client";
import {
  BookingFormFooter,
  BookingFormMessages,
  BookingFormProvider,
} from "../components/BookingForm";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatLayout } from "../components/chat/ChatLayout";
import {
  MessageFormChips,
  MessageFormFooter,
  MessageFormMessages,
  MessageFormProvider,
} from "../components/MessageForm";

type Section = "message" | "call";

export function PublicPage() {
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [section, setSection] = useState<Section>("message");
  const [toast, setToast] = useState<string | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    publicApi.getProfile().then(setProfile).catch(console.error);
  }, []);

  useEffect(() => {
    const payment = params.get("payment");
    const messageId = params.get("message");
    const bookingId = params.get("booking");
    if (payment === "success") {
      if (messageId) {
        publicApi.mockConfirm({ message_id: Number(messageId) }).then(() =>
          setToast("Paiement confirmé ✓")
        );
      } else if (bookingId) {
        publicApi.mockConfirm({ booking_id: Number(bookingId) }).then(() =>
          setToast("Appel réservé ✓")
        );
      }
    }
  }, [params]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const displayName = profile?.display_name ?? "Black Panther";

  const modeTabs = (
    <div className="chat-mode-tabs">
      <button
        type="button"
        className={`chat-mode-tab ${section === "message" ? "active" : ""}`}
        onClick={() => setSection("message")}
      >
        💬 Messages
      </button>
      <button
        type="button"
        className={`chat-mode-tab ${section === "call" ? "active" : ""}`}
        onClick={() => setSection("call")}
      >
        📞 Appel
      </button>
    </div>
  );

  if (!profile) {
    return (
      <ChatLayout
        header={<ChatHeader name={displayName} status="connexion…" />}
        modeTabs={modeTabs}
        messages={<div className="skeleton" style={{ height: 100, margin: "1rem" }} />}
      />
    );
  }

  if (section === "message") {
    return (
      <>
        <MessageFormProvider profile={profile} onSuccess={setToast}>
          <ChatLayout
            header={<ChatHeader name={displayName} status={profile.tagline} />}
            modeTabs={modeTabs}
            messages={<MessageFormMessages />}
            chips={<MessageFormChips />}
            footer={<MessageFormFooter />}
          />
        </MessageFormProvider>
        {toast && <div className="toast toast--chat">{toast}</div>}
      </>
    );
  }

  return (
    <>
      <BookingFormProvider profile={profile} onSuccess={setToast}>
        <ChatLayout
          header={<ChatHeader name={displayName} status="appels privés" />}
          modeTabs={modeTabs}
          messages={<BookingFormMessages />}
          footer={<BookingFormFooter />}
        />
      </BookingFormProvider>
      {toast && <div className="toast toast--chat">{toast}</div>}
    </>
  );
}
