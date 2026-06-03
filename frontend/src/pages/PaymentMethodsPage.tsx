import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PayMethodOption } from "../components/payments/PayMethodOption";
import { Icon } from "../components/icons/Icon";
import { StatusBar } from "../components/wa/StatusBar";
import { hasVisitor } from "../lib/visitor";
import { refreshSubscription } from "../lib/subscription";
import type { SubscriptionStatus } from "../api/client";
import { PAY_METHODS } from "../lib/paymentMethods";
import { SUBSCRIPTION_LABEL, SUBSCRIPTION_USD } from "../lib/pricing";

export function PaymentMethodsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (!hasVisitor()) {
      navigate("/profile");
      return;
    }
    refreshSubscription()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [navigate]);

  const active = status?.active;
  const mobileMethods = PAY_METHODS.filter((m) => m.section === "mobile");
  const cardMethods = PAY_METHODS.filter((m) => m.section === "card");

  return (
    <div className="wa-app wa-pay-page">
      <StatusBar />
      <header className="wa-pay-header">
        <Link
          to="/payments"
          className="wa-pay-header__back"
          aria-label="Retour"
        >
          <Icon name="back" size={28} className="wa-icon--primary" />
        </Link>
        <h1 className="wa-pay-header__title">Abonnement</h1>
        <span className="wa-pay-header__spacer" aria-hidden />
      </header>

      <div className="wa-pay-content">
        {active ? (
          <div className="wa-pay-cta">
            <Icon name="check-double" size={32} className="wa-icon--primary" />
            <p className="wa-pay-cta__title">Abonnement actif</p>
            <p className="wa-pay-muted">
              Valide jusqu&apos;au{" "}
              {status?.active_until
                ? new Date(status.active_until).toLocaleDateString("fr-FR")
                : "—"}
            </p>
            <Link to="/payments" className="wa-btn-primary wa-pay-cta__btn">
              Voir mon reçu
            </Link>
          </div>
        ) : (
          <>
            <p className="wa-pay-plan">
              <strong>{status?.label || SUBSCRIPTION_LABEL}</strong>
              <span className="wa-pay-plan__sub">
                {" "}
                — priorité + messages vocaux
              </span>
            </p>

            <p className="wa-pay-section-label">Mobile Money</p>
            <div className="wa-pay-methods">
              {mobileMethods.map((m) => (
                <PayMethodOption
                  key={m.id}
                  title={m.title}
                  subtitle={m.subtitle}
                  logoSrc={m.logoSrc}
                  logoAlt={m.title}
                  onClick={() =>
                    navigate(`/payment/checkout?method=${m.id}`)
                  }
                />
              ))}
            </div>

            <p className="wa-pay-section-label">Cartes &amp; autres</p>
            <div className="wa-pay-methods">
              {cardMethods.map((m) => (
                <PayMethodOption
                  key={m.id}
                  title={m.title}
                  subtitle={m.subtitle}
                  logoSrc={m.logoSrc}
                  logoAlt={m.title}
                  onClick={() =>
                    navigate(`/payment/checkout?method=${m.id}`)
                  }
                />
              ))}
            </div>

            <p className="wa-pay-footer">
              Payer {status?.price_display || SUBSCRIPTION_USD} — renouvellement
              mensuel
            </p>
          </>
        )}
      </div>
    </div>
  );
}
