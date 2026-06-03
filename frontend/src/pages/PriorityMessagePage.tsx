import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatPrice, publicApi, type PlatformProfile } from "../api/client";
import { FormHeader } from "../components/mockup/FormHeader";
import { Stepper } from "../components/mockup/Stepper";

const MAX_CHARS = 1000;
const PLACEHOLDER =
  "Bonjour Black Panther, Je souhaiterais vous proposer une opportunité de partenariat qui pourrait vous intéresser...";

type Step = "write" | "payment" | "confirm";

export function PriorityMessagePage() {
  const [params] = useSearchParams();
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [step, setStep] = useState<Step>("write");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    body: "",
  });

  useEffect(() => {
    publicApi.getProfile().then(setProfile).catch(console.error);
  }, []);

  useEffect(() => {
    if (params.get("payment") === "success") {
      setStep("confirm");
    }
  }, [params]);

  const price = profile ? formatPrice(profile.premium_message_price.cents) : "—";

  const handlePayAndSend = async () => {
    if (!form.sender_name.trim() || !form.sender_email.trim() || !form.body.trim()) return;
    setLoading(true);
    try {
      const res = await publicApi.submitMessage({
        ...form,
        subject: "",
        tier: "premium",
      });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      await publicApi.mockConfirm({ message_id: res.message.id });
      setStep("confirm");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (step === "confirm") {
    return (
      <div className="bp-app bp-form-page">
        <FormHeader title="Message prioritaire" />
        <Stepper current="confirm" />
        <div className="bp-confirm">
          <div className="bp-confirm__icon">✓</div>
          <h2>Message envoyé</h2>
          <p>Votre message prioritaire a été transmis. Vous serez notifié de la réponse.</p>
          <Link to="/contact" className="bp-link-btn">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-app bp-form-page">
      <FormHeader title="Message prioritaire" />
      <Stepper current="write" />

      <div className="bp-form-content">
        <label className="bp-field-label" htmlFor="msg-body">
          Votre message
        </label>
        <div className="bp-textarea-card">
          <textarea
            id="msg-body"
            className="bp-textarea"
            maxLength={MAX_CHARS}
            placeholder={PLACEHOLDER}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <div className="bp-char-count">
            {form.body.length}/{MAX_CHARS}
          </div>
        </div>

        <div className="bp-input-row">
          <input
            className="bp-input"
            placeholder="Votre nom"
            required
            value={form.sender_name}
            onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
          />
          <input
            className="bp-input"
            type="email"
            placeholder="Votre email"
            required
            value={form.sender_email}
            onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
          />
        </div>

        <div className="bp-info-banner">
          <span className="bp-info-banner__icon">★</span>
          <span>
            Votre message sera placé en priorité et vous serez notifié de la réponse.
          </span>
        </div>

        <div className="bp-recap">
          <div className="bp-recap__title">Récapitulatif</div>
          <div className="bp-recap__row">
            <span>Message prioritaire</span>
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
          disabled={loading}
          onClick={handlePayAndSend}
        >
          <span aria-hidden>🔒</span>
          {loading ? "TRAITEMENT…" : "PAYER ET ENVOYER"}
        </button>

        <p className="bp-form-disclaimer">
          Paiement sécurisé. Votre message sera envoyé immédiatement après paiement.
        </p>
      </div>
    </div>
  );
}
