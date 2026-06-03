export function paymentKindLabel(kind: string) {
  if (kind === "subscription") return "Abonnement";
  if (kind === "call_booking") return "Appel";
  return "Priorité";
}

export function paymentStatusLabel(status: string) {
  if (status === "succeeded") return "Payé";
  if (status === "pending") return "En attente";
  if (status === "failed") return "Échoué";
  return status;
}

export function formatPaymentDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
