import { useState, type ReactNode } from "react";
import { getVisitor, type VisitorProfile } from "../../lib/visitor";
import {
  visitorLogin,
  visitorRegister,
  visitorUpdateProfile,
} from "../../lib/visitorAuth";

export type VisitorAuthMode = "login" | "signup";

type Props = {
  compact?: boolean;
  mode?: VisitorAuthMode;
  onModeChange?: (mode: VisitorAuthMode) => void;
  onSaved?: () => void;
};

const emptyForm: VisitorProfile & { password: string } = {
  name: "",
  email: "",
  phone: "",
  occupation: "",
  password: "",
};

export function VisitorProfileForm({
  compact,
  mode = "login",
  onModeChange,
  onSaved,
}: Props) {
  const [form, setForm] = useState(() => {
    if (compact) {
      const v = getVisitor();
      return { ...emptyForm, ...v };
    }
    return { ...emptyForm };
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const field = (label: string, el: ReactNode) => (
    <label className="wa-profile-field">
      <span className="wa-profile-field__label">{label}</span>
      {el}
    </label>
  );

  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    setError("");
    try {
      await fn();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    await run(() => visitorLogin(email, password));
  };

  const signup = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.occupation.trim() ||
      !form.password
    ) {
      setError("Tous les champs obligatoires.");
      return;
    }
    if (form.password.length < 8) {
      setError("Mot de passe : 8 caractères minimum.");
      return;
    }
    await run(() =>
      visitorRegister({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        occupation: form.occupation.trim(),
      })
    );
  };

  const effectiveMode = compact ? "signup" : mode;
  const isLogin = effectiveMode === "login";
  const isSignup = effectiveMode === "signup";

  const passwordField = (autoComplete: string) =>
    field(
      "Mot de passe",
      <input
        type="password"
        placeholder={isSignup ? "8 caractères min." : "••••••••"}
        value={form.password}
        onChange={(e) => update({ password: e.target.value })}
        autoComplete={autoComplete}
      />
    );

  return (
    <div
      className={
        compact ? "wa-profile-form wa-profile-form--compact" : "wa-profile-form"
      }
    >
      {!compact && onModeChange && (
        <div className="wa-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`wa-auth-tabs__btn ${isLogin ? "wa-auth-tabs__btn--on" : ""}`}
            onClick={() => {
              setError("");
              setForm({ ...emptyForm });
              onModeChange("login");
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={`wa-auth-tabs__btn ${isSignup ? "wa-auth-tabs__btn--on" : ""}`}
            onClick={() => {
              setError("");
              setForm({ ...emptyForm });
              onModeChange("signup");
            }}
          >
            S&apos;inscrire
          </button>
        </div>
      )}

      {isLogin && (
        <>
          {field(
            "Email",
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              autoComplete="email"
            />
          )}
          {passwordField("current-password")}
          <button
            type="button"
            className="wa-btn-primary"
            disabled={loading}
            onClick={() => void login()}
          >
            {loading ? "…" : "Se connecter"}
          </button>
        </>
      )}

      {isSignup && (
        <>
          {field(
            "Nom complet",
            <input
              placeholder="Ex. Sarah Isaka"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              autoComplete="name"
            />
          )}
          {field(
            "Email",
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              autoComplete="email"
            />
          )}
          {passwordField("new-password")}
          {field(
            "Téléphone",
            <input
              type="tel"
              placeholder="Optionnel"
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
              autoComplete="tel"
            />
          )}
          {field(
            "Ce que vous faites dans la vie",
            <input
              placeholder="Ex. étudiant, entrepreneur…"
              value={form.occupation}
              onChange={(e) => update({ occupation: e.target.value })}
            />
          )}
          <button
            type="button"
            className="wa-btn-primary"
            disabled={loading}
            onClick={() => void signup()}
          >
            {loading ? "…" : "S'inscrire"}
          </button>
        </>
      )}

      {error && <p className="wa-profile-form__err">{error}</p>}
    </div>
  );
}

export function VisitorProfileEditForm({ onSaved }: { onSaved?: () => void }) {
  const [form, setForm] = useState<VisitorProfile>(getVisitor());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (patch: Partial<VisitorProfile>) =>
    setForm((f) => ({ ...f, ...patch }));

  const field = (label: string, el: ReactNode) => (
    <label className="wa-profile-field">
      <span className="wa-profile-field__label">{label}</span>
      {el}
    </label>
  );

  return (
    <div className="wa-profile-form">
      {field(
        "Email",
        <input type="email" value={form.email} readOnly disabled />
      )}
      {field(
        "Nom complet",
        <input
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          autoComplete="name"
        />
      )}
      {field(
        "Téléphone",
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update({ phone: e.target.value })}
          autoComplete="tel"
        />
      )}
      {field(
        "Activité",
        <input
          value={form.occupation}
          onChange={(e) => update({ occupation: e.target.value })}
        />
      )}
      <button
        type="button"
        className="wa-btn-primary"
        disabled={loading}
        onClick={async () => {
          if (!form.name.trim() || !form.occupation.trim()) {
            setError("Nom et activité requis.");
            return;
          }
          setLoading(true);
          setError("");
          try {
            await visitorUpdateProfile({
              name: form.name.trim(),
              phone: form.phone.trim(),
              occupation: form.occupation.trim(),
            });
            onSaved?.();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "…" : "Enregistrer"}
      </button>
      {error && <p className="wa-profile-form__err">{error}</p>}
    </div>
  );
}
