import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { publicApi } from "../api/client";
import { SUBSCRIPTION_LABEL } from "../lib/pricing";
import { refreshSubscription } from "../lib/subscription";
import { Icon } from "../components/icons/Icon";
import { StatusBar } from "../components/wa/StatusBar";

export function PaymentSuccessPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const paymentId = params.get("payment");
    const isSub = params.get("subscription") === "1";
    if (paymentId) {
      publicApi
        .mockConfirmPayment(Number(paymentId))
        .then(() => refreshSubscription())
        .catch(console.error);
    } else if (isSub) {
      refreshSubscription().catch(console.error);
    }
  }, [params]);

  return (
    <div className="wa-app wa-success">
      <StatusBar />
      <div className="wa-success__circle">
        <Icon name="check" size={44} strokeWidth={3} className="wa-icon--primary" />
      </div>
      <h1>Abonnement activé</h1>
      <p>{SUBSCRIPTION_LABEL} — priorité et messages vocaux débloqués.</p>
      <Link to="/payments" className="wa-btn-white" style={{ marginBottom: "0.5rem" }}>
        Voir mon reçu PDF
      </Link>
      <Link to="/chat" className="wa-btn-white">
        Retour au chat
      </Link>
    </div>
  );
}
