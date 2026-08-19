interface BrandProps {
  compact?: boolean;
  onHome?: () => void;
}

export function Brand({ compact = false, onHome }: BrandProps) {
  return (
    <button className={`brand ${compact ? "brand--compact" : ""}`} onClick={onHome} type="button" aria-label="Aegis Pulse home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Aegis Pulse</span>
    </button>
  );
}
