type StepId = "write" | "payment" | "confirm";

interface StepperProps {
  current: StepId;
}

const STEPS: { id: StepId; label: string; icon: string }[] = [
  { id: "write", label: "Rédiger", icon: "✎" },
  { id: "payment", label: "Paiement", icon: "💳" },
  { id: "confirm", label: "Confirmation", icon: "✓" },
];

export function Stepper({ current }: StepperProps) {
  const order: StepId[] = ["write", "payment", "confirm"];
  const currentIndex = order.indexOf(current);

  return (
    <div className="bp-stepper">
      {STEPS.map((step, i) => {
        const isActive = step.id === current;
        const isDone = i < currentIndex;
        return (
          <div
            key={step.id}
            className={`bp-step ${isActive ? "bp-step--active" : ""} ${isDone ? "bp-step--done" : ""}`}
          >
            <div className="bp-step__circle">{step.icon}</div>
            <span className="bp-step__label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
