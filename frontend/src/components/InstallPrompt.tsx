import { useEffect, useState } from "react";
import { Icon } from "./icons/Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("bp_install_dismissed") === "1"
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setDeferred(null);
    setDismissed(true);
    localStorage.setItem("bp_install_dismissed", "1");
  };

  return (
    <div className="toast toast--chat" style={{ display: "flex", gap: "0.75rem", alignItems: "center", maxWidth: "90%" }}>
      <Icon name="install" size={20} className="wa-icon--white" />
      <span>Installer Black Panther</span>
      <button
        type="button"
        className="wa-btn-primary"
        onClick={install}
        style={{ flexShrink: 0, width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
      >
        Installer
      </button>
      <button
        type="button"
        className="wa-chat-header__btn"
        onClick={() => {
          setDismissed(true);
          localStorage.setItem("bp_install_dismissed", "1");
        }}
        style={{ width: 32, height: 32, background: "rgba(255,255,255,0.2)", border: "none" }}
        aria-label="Fermer"
      >
        <Icon name="close" size={18} className="wa-icon--white" />
      </button>
    </div>
  );
}
