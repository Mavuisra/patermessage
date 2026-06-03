import { hasActiveSubscription } from "./subscription";

/** Accès vocal / priorité via abonnement actif */
export function hasVoiceAccess(): boolean {
  return hasActiveSubscription();
}

export function unlockVoice(): void {
  /* géré par refreshSubscription après paiement */
}

export function lockVoice(): void {
  /* géré par clearSubscriptionLocal */
}

import { clearSubscriptionLocal } from "./subscription";

export function clearVisitorSession(): void {
  clearSubscriptionLocal();
  sessionStorage.removeItem("bp_last_msg");
  sessionStorage.removeItem("bp_last_voice");
  sessionStorage.removeItem("bp_last_voice_dur");
  sessionStorage.removeItem("bp_voice_preview");
  sessionStorage.removeItem("bp_voice_pending_unlock");
}
