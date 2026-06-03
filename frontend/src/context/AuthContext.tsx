import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ownerApi, type LoginResponse } from "../api/client";

interface AuthContextValue {
  user: LoginResponse["user"] | null;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): LoginResponse["user"] | null {
  try {
    const raw = localStorage.getItem("bp_user");
    return raw ? (JSON.parse(raw) as LoginResponse["user"]) : null;
  } catch {
    return null;
  }
}

function hasOwnerToken(): boolean {
  return Boolean(localStorage.getItem("bp_access"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse["user"] | null>(() =>
    hasOwnerToken() ? readStoredUser() : null
  );
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!hasOwnerToken()) {
      setUser(null);
    } else {
      setUser(readStoredUser());
    }
    setAuthReady(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await ownerApi.login(username, password);
    localStorage.setItem("bp_access", res.access);
    localStorage.setItem("bp_refresh", res.refresh);
    localStorage.setItem("bp_user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bp_access");
    localStorage.removeItem("bp_refresh");
    localStorage.removeItem("bp_user");
    setUser(null);
  }, []);

  const isAuthenticated = hasOwnerToken() && !!user;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, authReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
