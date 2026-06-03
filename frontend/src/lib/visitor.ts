export interface VisitorProfile {
  name: string;
  email: string;
  phone: string;
  occupation: string;
}

const KEY = "bp_visitor_profile";

const empty: VisitorProfile = {
  name: "",
  email: "",
  phone: "",
  occupation: "",
};

export function getVisitor(): VisitorProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<VisitorProfile>;
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      occupation: parsed.occupation || "",
    };
  } catch {
    const legacyName = localStorage.getItem("bp_visitor_name") || "";
    const legacyEmail = localStorage.getItem("bp_visitor_email") || "";
    return {
      name: legacyName,
      email: legacyEmail,
      phone: "",
      occupation: "",
    };
  }
}

export function setVisitor(profile: VisitorProfile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
  localStorage.setItem("bp_visitor_name", profile.name);
  localStorage.setItem("bp_visitor_email", profile.email);
}

export function hasVisitor() {
  const token = localStorage.getItem("bp_visitor_access");
  const v = getVisitor();
  return Boolean(
    token &&
      v.name.trim() &&
      v.email.trim() &&
      v.occupation.trim()
  );
}

export function clearVisitor() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("bp_visitor_name");
  localStorage.removeItem("bp_visitor_email");
  localStorage.removeItem("bp_visitor_access");
  localStorage.removeItem("bp_visitor_refresh");
  localStorage.removeItem("bp_sub_until");
}
