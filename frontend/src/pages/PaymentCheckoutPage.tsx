import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { publicApi } from "../api/client";
import { BrandLogo } from "../components/payments/BrandLogo";
import { Icon } from "../components/icons/Icon";
import { StatusBar } from "../components/wa/StatusBar";
import { getPayMethod } from "../lib/paymentMethods";
import { SUBSCRIPTION_LABEL, SUBSCRIPTION_USD } from "../lib/pricing";
import { refreshSubscription } from "../lib/subscription";
import { getVisitor } from "../lib/visitor";

export function PaymentCheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const method = getPayMethod(params.get("method"));
  const [loading, setLoading] = useState(false);
  const visitor = getVisitor();
  const [phone, setPhone] = useState(visitor.phone || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  if (!method) {
    return (
      <div className="wa-app wa-pay-page">
        <StatusBar />
        <div className="wa-pay-content">
          <p className="wa-pay-muted">Méthode invalide.</p>
          <Link to="/payment/methods" className="wa-btn-primary">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  const isMobile = method.section === "mobile";

  const pay = async () => {
    if (isMobile && phone.replace(/\D/g, "").length < 8) {
      alert("Entrez un numéro valide.");
      return;
    }
    if (!isMobile && cardNumber.replace(/\s/g, "").length < 12) {
      alert("Entrez les informations de carte.");
      return;
    }
    setLoading(true);
    try {
      const checkout = await publicApi.createSubscriptionCheckout();
      if (checkout.url) {
        window.location.href = checkout.url;
        return;
      }
      if (checkout.payment_id) {
        await publicApi.mockConfirmPayment(checkout.payment_id);
        await refreshSubscription();
        navigate("/payment/success?subscription=1");
        return;
      }
      alert("Paiement indisponible.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wa-app wa-pay-page">
      <StatusBar />
      <header className="wa-pay-header">
        <Link
          to="/payment/methods"
          className="wa-pay-header__back"
          aria-label="Retour"
        >
          <Icon name="back" size={28} className="wa-icon--primary" />
        </Link>
        <h1 className="wa-pay-header__title">Checkout</h1>
        <span className="wa-pay-header__spacer" aria-hidden />
      </header>

      <div className="wa-pay-content">
        <div className="wa-checkout-hero">
          <BrandLogo
            src={method.logoSrc}
            alt={method.title}
            className="wa-checkout-hero__logo"
          />
          <p className="wa-checkout-hero__method">{method.title}</p>
        </div>

        <div className="wa-checkout-recap">
          <div className="wa-checkout-recap__row">
            <span>Abonnement premium</span>
            <strong>{SUBSCRIPTION_USD}</strong>
          </div>
          <div className="wa-checkout-recap__row wa-checkout-recap__row--muted">
            <span>{SUBSCRIPTION_LABEL}</span>
            <span>Priorité + vocal</span>
          </div>
        </div>

        <div className="wa-checkout-form">
          {isMobile ? (
            <>
              <label className="wa-checkout-field">
                <span>Numéro {method.title}</span>
                <div className="wa-checkout-phone">
                  <span className="wa-checkout-phone__prefix">
                    {method.phonePrefix}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder={method.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </label>
              <p className="wa-checkout-hint">
                Vous recevrez une demande de confirmation sur votre téléphone.
              </p>
            </>
          ) : (
            <>
              <label className="wa-checkout-field">
                <span>Numéro de carte</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  autoComplete="cc-number"
                />
              </label>
              <div className="wa-checkout-row-2">
                <label className="wa-checkout-field">
                  <span>Expiration</span>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    autoComplete="cc-exp"
                  />
                </label>
                <label className="wa-checkout-field">
                  <span>CVC</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    autoComplete="cc-csc"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className="wa-btn-primary wa-checkout-pay"
          disabled={loading}
          onClick={() => void pay()}
        >
          <Icon name="lock" size={18} className="wa-icon--white" />
          {loading ? "Traitement…" : `Payer ${SUBSCRIPTION_USD}`}
        </button>

        <p className="wa-pay-footer">
          <Icon
            name="lock"
            size={14}
            className="wa-icon--muted"
            style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}
          />
          Paiement sécurisé · renouvellement mensuel
        </p>
      </div>
    </div>
  );
}
