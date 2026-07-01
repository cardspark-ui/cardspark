export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

export function parseCurrencyLabel(value: string) {
  const match = value.match(/-?[\d,]+(?:\.\d+)?/);

  return match ? Number(match[0].replace(/,/g, "")) : undefined;
}

export function formatDeltaFromReference(value: number, referenceValue: number) {
  const difference = value - referenceValue;
  const sign = difference >= 0 ? "+" : "-";
  const percentage = referenceValue === 0 ? 0 : (difference / referenceValue) * 100;

  return `${sign}${formatCurrency(Math.abs(difference))} (${Math.abs(percentage).toFixed(1)}%)`;
}
