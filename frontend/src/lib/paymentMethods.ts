export type PayMethodId = "mpesa" | "orange" | "airtel" | "card";

export type PayMethodConfig = {
  id: PayMethodId;
  title: string;
  subtitle?: string;
  logoSrc: string;
  section: "mobile" | "card";
  phonePrefix?: string;
  phonePlaceholder?: string;
};

export const PAY_METHODS: PayMethodConfig[] = [
  {
    id: "mpesa",
    title: "M-Pesa",
    subtitle: "Safaricom · Vodacom",
    logoSrc: "/payments/mpesa.svg",
    section: "mobile",
    phonePrefix: "+254",
    phonePlaceholder: "7XX XXX XXX",
  },
  {
    id: "orange",
    title: "Orange Money",
    logoSrc: "/payments/orange-money.svg",
    section: "mobile",
    phonePrefix: "+243",
    phonePlaceholder: "8XX XXX XXX",
  },
  {
    id: "airtel",
    title: "Airtel Money",
    logoSrc: "/payments/airtel-money.svg",
    section: "mobile",
    phonePrefix: "+243",
    phonePlaceholder: "9XX XXX XXX",
  },
  {
    id: "card",
    title: "Carte bancaire",
    subtitle: "VISA · Mastercard",
    logoSrc: "/payments/visa-mastercard.svg",
    section: "card",
  },
];

export function getPayMethod(id: string | null): PayMethodConfig | undefined {
  return PAY_METHODS.find((m) => m.id === id);
}
