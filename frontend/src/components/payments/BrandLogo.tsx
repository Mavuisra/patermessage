type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Logo marque (fichiers dans /public/payments/) */
export function BrandLogo({ src, alt, className = "" }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={`wa-pay-brand-logo ${className}`.trim()}
      loading="lazy"
      decoding="async"
    />
  );
}
