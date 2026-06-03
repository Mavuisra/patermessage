import { useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../api/client";
import { FormHeader } from "../components/mockup/FormHeader";

const MAX_CHARS = 1000;

export function FreeMessagePage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    body: "",
  });

  const handleSubmit = async () => {
    if (!form.sender_name.trim() || !form.sender_email.trim() || !form.body.trim()) return;
    setLoading(true);
    try {
      await publicApi.submitMessage({ ...form, subject: "", tier: "free" });
      setSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bp-app bp-form-page">
        <FormHeader title="Message gratuit" />
        <div className="bp-confirm">
          <div className="bp-confirm__icon">✓</div>
          <h2>Message envoyé</h2>
          <p>Votre message sera analysé par notre IA pour en évaluer la pertinence.</p>
          <Link to="/contact" className="bp-link-btn">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-app bp-form-page">
      <FormHeader title="Message gratuit" />

      <div className="bp-form-content">
        <label className="bp-field-label" htmlFor="free-body">
          Votre message
        </label>
        <div className="bp-textarea-card">
          <textarea
            id="free-body"
            className="bp-textarea"
            maxLength={MAX_CHARS}
            placeholder="Décrivez votre demande…"
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
          <span className="bp-info-banner__icon">💬</span>
          <span>
            Votre message sera analysé par notre IA afin d&apos;identifier sa pertinence.
          </span>
        </div>

        <button type="button" className="bp-btn-pay" disabled={loading} onClick={handleSubmit}>
          {loading ? "ENVOI…" : "ENVOYER"}
        </button>

        <p className="bp-form-disclaimer">Analyse IA gratuite · Réponse selon pertinence</p>
      </div>
    </div>
  );
}
