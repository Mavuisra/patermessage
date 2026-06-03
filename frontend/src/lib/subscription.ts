import { publicApi, type SubscriptionStatus } from "../api/client";

const UNTIL_KEY = "bp_sub_until";

export function getSubscriptionUntil(): string | null {
  return localStorage.getItem(UNTIL_KEY);
}

export function syncSubscription(status: SubscriptionStatus) {
  if (status.active && status.active_until) {
    localStorage.setItem(UNTIL_KEY, status.active_until);
  } else {
    localStorage.removeItem(UNTIL_KEY);
  }
}

export function hasActiveSubscription(): boolean {
  const until = getSubscriptionUntil();
  if (!until) return false;
  return new Date(until) > new Date();
}

export async function refreshSubscription(): Promise<SubscriptionStatus> {
  const status = await publicApi.getSubscriptionStatus();
  syncSubscription(status);
  return status;
}

export function clearSubscriptionLocal() {
  localStorage.removeItem(UNTIL_KEY);
}
