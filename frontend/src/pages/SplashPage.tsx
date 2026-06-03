import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { StatusBar } from "../components/wa/StatusBar";

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/messages", { replace: true }), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="wa-app wa-splash" onClick={() => navigate("/messages", { replace: true })}>
      <StatusBar />
      <motion.img
        src={logo}
        alt="Black Pater"
        className="wa-splash__logo"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
      />
      <motion.p
        className="wa-splash__title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Black Pater
      </motion.p>
      <div className="wa-splash__dots" aria-hidden>
        <span className="wa-splash__dot" />
        <span className="wa-splash__dot wa-splash__dot--on" />
        <span className="wa-splash__dot" />
      </div>
    </div>
  );
}
