import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { formatPrice, publicApi, type PlatformProfile, type Slot } from "../api/client";
import { ChatBubble } from "./chat/ChatBubble";

interface BookingContextValue {
  profile: PlatformProfile;
  slots: Slot[];
  slotId: number | "";
  setSlotId: (id: number | "") => void;
  loading: boolean;
  form: { guest_name: string; guest_email: string; topic: string; notes: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ guest_name: string; guest_email: string; topic: string; notes: string }>
  >;
  handleSubmit: (e: FormEvent) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

function useBookingForm() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("BookingForm components must be inside BookingFormProvider");
  return ctx;
}

export function BookingFormProvider({
  profile,
  onSuccess,
  children,
}: {
  profile: PlatformProfile;
  onSuccess: (msg: string) => void;
  children: ReactNode;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotId, setSlotId] = useState<number | "">("");
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    topic: "",
    notes: "",
  });

  useEffect(() => {
    publicApi.getSlots().then(setSlots).catch(() => setSlots([]));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slotId) return;
    setLoading(true);
    try {
      const res = await publicApi.bookCall({ slot_id: Number(slotId), ...form });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      await publicApi.mockConfirm({ booking_id: res.booking.id });
      onSuccess("Appel réservé ✓");
      setForm({ guest_name: "", guest_email: "", topic: "", notes: "" });
      setSlotId("");
    } catch (err) {
      onSuccess(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookingContext.Provider
      value={{ profile, slots, slotId, setSlotId, loading, form, setForm, handleSubmit }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function BookingFormMessages() {
  const { profile, slots } = useBookingForm();
  return (
    <>
      <div className="chat-date-pill">Appel vocal</div>
      <ChatBubble direction="in">
        📞 Réserve un appel privé — <strong>{formatPrice(profile.call_price.cents)}</strong>
      </ChatBubble>
      {slots.length === 0 && (
        <ChatBubble direction="in">Aucun créneau disponible. Reviens bientôt !</ChatBubble>
      )}
    </>
  );
}

export function BookingFormFooter() {
  const { profile, slots, slotId, setSlotId, form, setForm, loading, handleSubmit } =
    useBookingForm();

  return (
    <div className="chat-composer-wrap">
      <form onSubmit={handleSubmit}>
        <div className="chat-composer__field" style={{ marginBottom: "0.5rem" }}>
          {slots.length > 0 && (
            <div>
              <label className="label">Créneau</label>
              <select
                className="input"
                required
                value={slotId}
                onChange={(e) => setSlotId(Number(e.target.value) || "")}
              >
                <option value="">Choisir…</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.start_at).toLocaleString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Nom</label>
            <input
              className="input"
              required
              value={form.guest_name}
              onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={form.guest_email}
              onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Sujet</label>
            <input
              className="input"
              required
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>
        </div>
        <button
          type="submit"
          className="chat-send"
          disabled={loading || slots.length === 0}
          style={{ width: "100%", borderRadius: 24, height: 48 }}
        >
          {loading ? "…" : `📞 Réserver · ${formatPrice(profile.call_price.cents)}`}
        </button>
      </form>
    </div>
  );
}
