import { Battery, Signal, Wifi } from "lucide-react";

export function StatusBar() {
  const time = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="wa-status">
      <span>{time}</span>
      <span className="wa-status__icons" aria-hidden>
        <Signal size={14} strokeWidth={2.5} />
        <Wifi size={14} strokeWidth={2.5} />
        <Battery size={16} strokeWidth={2.5} />
      </span>
    </div>
  );
}
