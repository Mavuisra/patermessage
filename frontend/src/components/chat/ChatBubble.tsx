import { motion } from "framer-motion";

interface ChatBubbleProps {
  direction: "in" | "out";
  children: React.ReactNode;
  time?: string;
  premium?: boolean;
}

export function ChatBubble({ direction, children, time, premium }: ChatBubbleProps) {
  const now =
    time ||
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      className={`bubble-row bubble-row--${direction}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
    >
      <div className={`bubble ${premium ? "bubble--premium" : ""}`}>
        {children}
        <span className="bubble__time">{now}</span>
      </div>
    </motion.div>
  );
}
