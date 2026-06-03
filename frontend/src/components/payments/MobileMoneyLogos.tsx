/** Logos Mobile Money — couleurs de marque */

export function MpesaLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-label="M-Pesa" role="img">
      <rect width="48" height="48" rx="10" fill="#5CB85C" />
      <text
        x="24"
        y="21"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        M
      </text>
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fill="#fff"
        fontSize="8"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.5"
      >
        PESA
      </text>
    </svg>
  );
}

export function OrangeMoneyLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-label="Orange Money" role="img">
      <rect width="48" height="48" rx="10" fill="#FF7900" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fill="#fff"
        fontSize="7.5"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        orange
      </text>
      <text
        x="24"
        y="32"
        textAnchor="middle"
        fill="#fff"
        fontSize="8"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        money
      </text>
    </svg>
  );
}

export function AirtelMoneyLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-label="Airtel Money" role="img">
      <rect width="48" height="48" rx="10" fill="#E40000" />
      <text
        x="24"
        y="22"
        textAnchor="middle"
        fill="#fff"
        fontSize="9"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="-0.3"
      >
        airtel
      </text>
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fill="#fff"
        fontSize="7"
        fontWeight="600"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        money
      </text>
    </svg>
  );
}
