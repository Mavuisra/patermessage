import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  if (compact) {
    return (
      <button
        type="button"
        className="chat-header__btn"
        onClick={toggle}
        aria-label="Changer le thème"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    );
  }
  return (
    <motion.button
      type="button"
      className="btn btn-ghost"
      onClick={toggle}
      whileTap={{ scale: 0.95 }}
      aria-label="Changer le thème"
      style={{ width: 44, height: 44, padding: 0, borderRadius: "50%" }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </motion.button>
  );
}
