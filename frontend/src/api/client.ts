const API_URL = import.meta.env.VITE_API_URL || "/api";

type RequestOptions = RequestInit & { auth?: boolean; visitor?: boolean };

function getToken(): string | null {
  return localStorage.getItem("bp_access");
}

function getVisitorToken(): string | null {
  return localStorage.getItem("bp_visitor_access");
}

function formatApiError(err: Record<string, unknown>, fallback: string): string {
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) return err.detail.map(String).join(", ");
  const parts: string[] = [];
  for (const [key, val] of Object.entries(err)) {
    if (key === "detail") continue;
    if (Array.isArray(val)) parts.push(...val.map(String));
    else if (typeof val === "string") parts.push(val);
  }
  return parts.join(" ") || fallback;
}

async function readResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) {
    return { detail: res.statusText || "Réponse vide du serveur" };
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      detail: res.ok
        ? "Réponse serveur invalide (JSON attendu)."
        : `Erreur ${res.status} — vérifiez que l'API est en ligne et DATABASE_URL configurée sur Render.`,
    };
  }
}

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.visitor) {
    const vToken = getVisitorToken();
    if (vToken) headers.Authorization = `Bearer ${vToken}`;
  } else if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Impossible de joindre l'API. Vérifiez votre connexion ou que le backend Render est actif."
    );
  }

  const body = await readResponseBody(res);

  if (!res.ok) {
    throw new Error(
      formatApiError(
        (body && typeof body === "object" ? body : {}) as Record<string, unknown>,
        res.statusText || "Erreur réseau"
      )
    );
  }

  if (res.status === 204) return undefined as T;
  return body as T;
}

export async function submitMessageMultipart(
  data: MessageSubmit,
  voice?: Blob | null
): Promise<MessageSubmitResponse> {
  const form = new FormData();
  form.append("sender_name", data.sender_name);
  form.append("sender_email", data.sender_email);
  if (data.sender_phone) form.append("sender_phone", data.sender_phone);
  if (data.sender_occupation) form.append("sender_occupation", data.sender_occupation);
  form.append("subject", data.subject);
  form.append("body", data.body);
  form.append("tier", data.tier);
  if (voice) {
    form.append("voice_note", voice, voice.type.includes("ogg") ? "voice.ogg" : "voice.webm");
  }

  const res = await fetch(`${API_URL}/messages/submit/`, {
    method: "POST",
    body: form,
  });

  const body = await readResponseBody(res);

  if (!res.ok) {
    throw new Error(
      formatApiError(
        (body && typeof body === "object" ? body : {}) as Record<string, unknown>,
        res.statusText || "Erreur réseau"
      )
    );
  }
  return body as MessageSubmitResponse;
}

export interface ThreadItem {
  kind: "visitor" | "owner";
  id: number;
  body: string;
  created_at: string;
  voice_note_url?: string | null;
  is_priority?: boolean;
  tier?: string;
}

export const publicApi = {
  getProfile: () => api<PlatformProfile>("/public/", { auth: false }),
  getThread: (email?: string) =>
    api<{ items: ThreadItem[] }>(
      email
        ? `/messages/thread/?email=${encodeURIComponent(email)}`
        : "/messages/thread/",
      { auth: false, visitor: true }
    ),
  submitMessage: (data: MessageSubmit) =>
    api<MessageSubmitResponse>("/messages/submit/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),
  submitMessageMultipart,
  getSlots: () =>
    api<Slot[]>("/bookings/slots/", { auth: false }),
  bookCall: (data: BookingSubmit) =>
    api<BookingSubmitResponse>("/bookings/book/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),
  mockConfirm: (payload: { message_id?: number; booking_id?: number }) =>
    api("/payments/mock-confirm/", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),
  getMyPayments: (email?: string) =>
    api<{ items: Payment[] }>(
      email
        ? `/payments/my/?email=${encodeURIComponent(email)}`
        : "/payments/my/",
      { auth: false, visitor: true }
    ),
  getSubscriptionStatus: () =>
    api<SubscriptionStatus>("/payments/subscription/status/", {
      auth: false,
      visitor: true,
    }),
  createSubscriptionCheckout: () =>
    api<{ url?: string | null; payment_id?: number; mock?: boolean }>(
      "/payments/subscription/checkout/",
      { method: "POST", auth: false, visitor: true }
    ),
  mockConfirmPayment: (payment_id: number) =>
    api("/payments/mock-confirm/", {
      method: "POST",
      body: JSON.stringify({ payment_id }),
      auth: false,
    }),
};

export interface SubscriptionStatus {
  active: boolean;
  active_until: string | null;
  can_subscribe: boolean;
  price_cents: number;
  currency: string;
  price_display: string;
  label: string;
}

export interface VisitorUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  phone: string;
  occupation: string;
  role: string;
}

export interface VisitorAuthResponse {
  access: string;
  refresh: string;
  user: VisitorUser;
}

export const visitorApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    occupation: string;
  }) =>
    api<VisitorAuthResponse>("/auth/visitor/register/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),
  login: (email: string, password: string) =>
    api<VisitorAuthResponse>("/auth/visitor/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
  me: () => api<VisitorUser>("/auth/visitor/me/", { auth: false, visitor: true }),
  updateMe: (data: { name?: string; phone?: string; occupation?: string }) =>
    api<VisitorUser>("/auth/visitor/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
      auth: false,
      visitor: true,
    }),
};

export const ownerApi = {
  login: (username: string, password: string) =>
    api<LoginResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      auth: false,
    }),
  getMessages: (params?: OwnerMessageFilters) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.date_from) sp.set("date_from", params.date_from);
      if (params.date_to) sp.set("date_to", params.date_to);
      if (params.min_relevance != null && params.min_relevance !== "")
        sp.set("min_relevance", String(params.min_relevance));
      if (params.max_relevance != null && params.max_relevance !== "")
        sp.set("max_relevance", String(params.max_relevance));
      if (params.order) sp.set("order", params.order);
      if (params.search) sp.set("search", params.search);
    }
    const q = sp.toString();
    return api<Paginated<InboundMessage>>(q ? `/messages/?${q}` : "/messages/");
  },
  deleteVisitor: (email: string) =>
    api<{ detail: string; deleted: { messages: number; payments: number; accounts: number } }>(
      `/owner/visitors/?email=${encodeURIComponent(email)}`,
      { method: "DELETE" }
    ),
  getMessage: (id: number) => api<InboundMessage>(`/messages/${id}/`),
  sendReply: (messageId: number, body: string) =>
    api<OwnerReply>(`/messages/${messageId}/reply/`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  reanalyze: (id: number) =>
    api(`/messages/${id}/reanalyze/`, { method: "POST" }),
  archive: (id: number) =>
    api<InboundMessage>(`/messages/${id}/archive/`, { method: "POST" }),
  getBookings: () => api<Paginated<CallBooking>>("/bookings/manage/"),
  getPayments: () => api<Paginated<Payment>>("/payments/history/"),
  getStats: () => api<DashboardStats>("/analytics/dashboard/"),
  registerDevice: (token: string) =>
    api("/notifications/register/", {
      method: "POST",
      body: JSON.stringify({ token, platform: "web" }),
    }),
  getFcmConfig: () => api<{ vapid_key: string; configured: boolean }>("/notifications/config/"),
};

export interface PlatformProfile {
  display_name: string;
  tagline: string;
  bio: string;
  avatar_url: string;
  premium_message_price: { cents: number; currency: string };
  call_price: { cents: number; currency: string };
  free_messages_per_day: number;
  social_links: Record<string, string>;
  stripe_publishable_key: string;
}

export interface MessageSubmit {
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_occupation?: string;
  subject: string;
  body: string;
  tier: "free" | "premium";
}

export interface MessageSubmitResponse {
  message: { id: number; tier: string; status: string };
  checkout_url?: string | null;
  session_id?: string;
}

export interface MessageAnalysis {
  summary: string;
  relevance_score: number;
  opportunity_detected: boolean;
  opportunity_details: string;
  suggested_reply: string;
  sentiment: string;
  tags: string[];
  analyzed_at: string;
}

export interface OwnerReply {
  id: number;
  body: string;
  created_at: string;
}

export interface InboundMessage {
  id: number;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_occupation?: string;
  subject: string;
  body: string;
  voice_note_url?: string | null;
  tier: string;
  status: string;
  is_priority: boolean;
  amount_cents: number;
  created_at: string;
  analysis?: MessageAnalysis;
  replies?: OwnerReply[];
}

export interface Slot {
  id: number;
  start_at: string;
  end_at: string;
  is_booked: boolean;
}

export interface BookingSubmit {
  slot_id: number;
  guest_name: string;
  guest_email: string;
  topic: string;
  notes?: string;
}

export interface BookingSubmitResponse {
  booking: CallBooking;
  checkout_url?: string | null;
}

export interface CallBooking {
  id: number;
  slot: Slot;
  guest_name: string;
  guest_email: string;
  topic: string;
  status: string;
  amount_cents: number;
  meeting_link: string;
  created_at: string;
}

export interface Payment {
  id: number;
  kind: string;
  status: string;
  amount_cents: number;
  amount_display: string;
  currency: string;
  customer_email: string;
  customer_name: string;
  receipt_number?: string | null;
  receipt_url?: string | null;
  period_label?: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: { id: number; username: string; display_name: string; role: string };
}

export interface DashboardStats {
  totals: {
    messages: number;
    free_messages: number;
    premium_messages: number;
    opportunities: number;
    bookings: number;
    revenue_cents: number;
    revenue_display: string;
    avg_relevance_score: number;
  };
  charts: {
    messages_by_day: { day: string; count: number }[];
    revenue_by_day: { day: string; total: number }[];
  };
  recent_high_value: {
    relevance_score: number;
    summary: string;
    message__sender_name: string;
    message__id: number;
  }[];
}

export interface Paginated<T> {
  count: number;
  results: T[];
}

export interface OwnerMessageFilters {
  date_from?: string;
  date_to?: string;
  min_relevance?: number | string;
  max_relevance?: number | string;
  order?: "relevance" | "-relevance" | "date" | "-date";
  search?: string;
}

export function formatPrice(
  cents: number,
  currency: string = "USD"
): string {
  const code = currency.toUpperCase() === "USD" ? "USD" : currency.toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
  }).format(cents / 100);
}
