import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatPrice, publicApi, type PlatformProfile, type Slot } from "../api/client";
import { FormHeader } from "../components/mockup/FormHeader";
import { Stepper } from "../components/mockup/Stepper";

export function CallBookingPage() {
  const [params] = useSearchParams();
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [slotId, setSlotId] = useState<number | "">("");
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    topic: "",
    notes: "",
  });

  useEffect(() => {
    publicApi.getProfile().then(setProfile).catch(console.error);
    publicApi.getSlots().then(setSlots).catch(() => setSlots([]));
  }, []);

  useEffect(() => {
    if (params.get("payment") === "success") setConfirmed(true);
  }, [params]);

  const price = profile ? formatPrice(profile.call_price.cents) : "—";

  const handleBook = async () => {
    if (!slotId) return;
    setLoading(true);
    try {
      const res = await publicApi.bookCall({ slot_id: Number(slotId), ...form });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      await publicApi.mockConfirm({ booking_id: res.booking.id });
      setConfirmed(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="bp-app bp-form-page">
        <FormHeader title="Réserver un appel" />
        <Stepper current="confirm" />
        <div className="bp-confirm">
          <div className="bp-confirm__icon">✓</div>
          <h2>Appel réservé</h2>
          <p>Votre créneau est confirmé. Vous recevrez les détails par email.</p>
          <Link to="/contact" className="bp-link-btn">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-app bp-form-page">
      <FormHeader title="Réserver un appel" />
      <Stepper current="write" />

      <div className="bp-form-content">
        {slots.length > 0 ? (
          <div className="bp-input-row">
            <label className="bp-field-label" htmlFor="slot">
              Créneau
            </label>
            <select
              id="slot"
              className="bp-input"
              value={slotId}
              onChange={(e) => setSlotId(Number(e.target.value) || "")}
            >
              <option value="">Choisir un horaire</option>
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
        ) : (
          <div className="bp-info-banner">
            <span>Aucun créneau disponible pour le moment.</span>
          </div>
        )}

        <div className="bp-input-row">
          <input
            className="bp-input"
            placeholder="Votre nom"
            required
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
          />
          <input
            className="bp-input"
            type="email"
            placeholder="Votre email"
            required
            value={form.guest_email}
            onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
          />
          <input
            className="bp-input"
            placeholder="Sujet de l'appel"
            required
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          />
        </div>

        <div className="bp-info-banner">
          <span className="bp-info-banner__icon">📞</span>
          <span>Échange privé avec Black Panther.</span>
        </div>

        <div className="bp-recap">
          <div className="bp-recap__title">Récapitulatif</div>
          <div className="bp-recap__row">
            <span>Appel privé</span>
            <span>{price}</span>
          </div>
          <div className="bp-recap__total">
            <span>Total</span>
            <span className="bp-recap__total-price">{price}</span>
          </div>
        </div>

        <button
          type="button"
          className="bp-btn-pay"
          disabled={loading || slots.length === 0 || !slotId}
          onClick={handleBook}
        >
          <span aria-hidden>🔒</span>
          {loading ? "TRAITEMENT…" : "PAYER ET RÉSERVER"}
        </button>

        <p className="bp-form-disclaimer">
          Paiement sécurisé. Confirmation immédiate après paiement.
        </p>
      </div>
    </div>
  );
}
