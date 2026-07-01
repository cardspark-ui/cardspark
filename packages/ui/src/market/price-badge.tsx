export type PriceBadgeProps = {
  value: string;
  label: string;
  tone?: "neutral" | "positive" | "negative";
};

export function PriceBadge({ value, label, tone = "neutral" }: PriceBadgeProps) {
  return (
    <span className="cs-price-badge" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}
