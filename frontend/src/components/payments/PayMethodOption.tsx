import type { ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { BrandLogo } from "./BrandLogo";

type Props = {
  title: string;
  subtitle?: ReactNode;
  logoSrc: string;
  logoAlt: string;
  onClick: () => void;
  disabled?: boolean;
};

export function PayMethodOption({
  title,
  subtitle,
  logoSrc,
  logoAlt,
  onClick,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      className="wa-pay-option"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="wa-pay-option__logo">
        <BrandLogo src={logoSrc} alt={logoAlt} />
      </span>
      <span className="wa-pay-option__text">
        <strong className="wa-pay-option__title">{title}</strong>
        {subtitle ? (
          <span className="wa-pay-option__sub">{subtitle}</span>
        ) : null}
      </span>
      <Icon
        name="chevron-right"
        size={22}
        className="wa-icon--muted wa-pay-option__chevron"
      />
    </button>
  );
}
