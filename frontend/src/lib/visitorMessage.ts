import { getVisitor } from "./visitor";

export function visitorMessageFields() {
  const v = getVisitor();
  return {
    sender_name: v.name,
    sender_email: v.email,
    sender_phone: v.phone || undefined,
    sender_occupation: v.occupation,
  };
}
