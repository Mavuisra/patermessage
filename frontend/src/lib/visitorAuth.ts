import { visitorApi, type VisitorAuthResponse } from "../api/client";
import { refreshSubscription } from "./subscription";
import { setVisitor, type VisitorProfile } from "./visitor";

const ACCESS = "bp_visitor_access";
const REFRESH = "bp_visitor_refresh";

export function getVisitorToken(): string | null {
  return localStorage.getItem(ACCESS);
}

export function userToProfile(user: VisitorAuthResponse["user"]): VisitorProfile {
  return {
    name: user.display_name || "",
    email: user.email || "",
    phone: user.phone || "",
    occupation: user.occupation || "",
  };
}

async function storeSession(res: VisitorAuthResponse) {
  localStorage.setItem(ACCESS, res.access);
  localStorage.setItem(REFRESH, res.refresh);
  setVisitor(userToProfile(res.user));
  try {
    await refreshSubscription();
  } catch {
    /* ignore */
  }
}

export async function visitorLogin(email: string, password: string) {
  const res = await visitorApi.login(email.trim(), password);
  await storeSession(res);
  return res;
}

export async function visitorRegister(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  occupation: string;
}) {
  const res = await visitorApi.register(data);
  await storeSession(res);
  return res;
}

export async function visitorUpdateProfile(data: {
  name?: string;
  phone?: string;
  occupation?: string;
}) {
  const user = await visitorApi.updateMe(data);
  setVisitor(userToProfile(user));
  return user;
}

export function clearVisitorAuth() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

export function isVisitorLoggedIn() {
  return Boolean(getVisitorToken());
}
