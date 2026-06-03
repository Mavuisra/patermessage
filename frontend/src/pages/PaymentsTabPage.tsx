import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/wa/BottomNav";
import { StatusBar } from "../components/wa/StatusBar";
import { Icon } from "../components/icons/Icon";
import { useAuth } from "../context/AuthContext";
import { ownerApi, publicApi, type Payment, type SubscriptionStatus } from "../api/client";
import {
  formatPaymentDate,
  paymentKindLabel,
  paymentStatusLabel,
} from "../lib/paymentLabels";
import { getVisitor, hasVisitor } from "../lib/visitor";
import { SUBSCRIPTION_LABEL } from "../lib/pricing";
import { refreshSubscription } from "../lib/subscription";

export function PaymentsTabPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const p = await ownerApi.getPayments();
        setPayments(p.results || []);
        setSub(null);
        return;
      }
      if (hasVisitor()) {
        const [status, pay] = await Promise.all([
          refreshSubscription(),
          publicApi.getMyPayments(),
        ]);
        setSub(status);
        setPayments(pay.items);
      } else {
        setPayments([]);
        setSub(null);
      }
    } catch {
      setPayments([]);
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const subscriptionPayment = payments.find(
    (p) => p.kind === "subscription" && p.status === "succeeded"
  );

  return (
    <div className="wa-app wa-screen">
      <StatusBar />
      <h1 className="wa-screen__title">Paiements</h1>
      <div className="wa-page-pad">
        {loading ? (
          <p className="wa-pay-muted">Chargement…</p>
        ) : isAuthenticated ? (
          payments.length === 0 ? (
            <p className="wa-pay-muted">Aucun paiement.</p>
          ) : (
            payments.map((p) => <PaymentBill key={p.id} payment={p} />)
          )
        ) : !hasVisitor() ? (
          <div className="wa-pay-cta">
            <p className="wa-pay-muted">Connectez-vous d&apos;abord.</p>
            <Link to="/profile" className="wa-btn-primary wa-pay-cta__btn">
              Profil
            </Link>
          </div>
        ) : (
          <>
            {sub?.active ? (
              <div className="wa-pay-active-card">
                <Icon name="star" size={22} className="wa-icon--primary" />
                <div>
                  <strong>Abonnement actif</strong>
                  <p className="wa-pay-muted">
                    Jusqu&apos;au{" "}
                    {sub.active_until
                      ? new Date(sub.active_until).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="wa-pay-cta">
                <p className="wa-pay-cta__title">{sub?.label || SUBSCRIPTION_LABEL}</p>
                <p className="wa-pay-muted">Priorité + messages vocaux</p>
                <button
                  type="button"
                  className="wa-btn-primary wa-pay-cta__btn"
                  onClick={() => navigate("/payment/methods")}
                >
                  S&apos;abonner
                </button>
              </div>
            )}

            {payments.length > 0 && (
              <>
                <p className="wa-pay-section">Reçus</p>
                {payments.map((p) => (
                  <PaymentBill key={p.id} payment={p} />
                ))}
              </>
            )}

            {sub?.active && !subscriptionPayment && payments.length === 0 && (
              <p className="wa-pay-muted">Reçu disponible après confirmation.</p>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function receiptHref(payment: Payment) {
  const base = payment.receipt_url || "";
  if (base.includes("email=")) return base;
  const email = payment.customer_email || getVisitor().email;
  const sep = base.includes("?") ? "&" : "?";
  return email ? `${base}${sep}email=${encodeURIComponent(email)}` : base;
}

function PaymentBill({ payment }: { payment: Payment }) {
  const date = formatPaymentDate(payment.paid_at || payment.created_at);
  const ok = payment.status === "succeeded";

  return (
    <div className="wa-pay-bill">
      <div className="wa-pay-bill__main">
        <strong>{payment.amount_display}</strong>
        <span className="wa-pay-bill__kind">{paymentKindLabel(payment.kind)}</span>
      </div>
      {payment.period_label && (
        <p className="wa-pay-bill__period">{payment.period_label}</p>
      )}
      <div className="wa-pay-bill__meta">
        <span>{date}</span>
        <span className={ok ? "wa-pay-bill__ok" : "wa-pay-bill__pending"}>
          {paymentStatusLabel(payment.status)}
        </span>
      </div>
      {ok && payment.receipt_url && (
        <a
          href={receiptHref(payment)}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-pay-receipt-link"
        >
          <Icon name="wallet" size={16} className="wa-icon--primary" />
          Voir le reçu (PDF)
        </a>
      )}
    </div>
  );
}
