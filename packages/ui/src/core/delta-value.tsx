import { MetadataTooltip } from "./rarity";

export type DeltaFormat = "auto" | "percent" | "currency" | "dollar";
export type DeltaSecondaryDisplay = "inline" | "tooltip";
export type DeltaTrend = "positive" | "negative" | "neutral";

const POSITIVE_DELTA_SYMBOL = "▲";
const NEGATIVE_DELTA_SYMBOL = "▼";

export type DeltaValueProps = {
  value: string | number;
  format?: DeltaFormat;
  currency?: string;
  locale?: string;
  trend?: DeltaTrend;
  referenceValue?: string | number;
  periodLabel?: string;
  className?: string;
  secondaryDisplay?: DeltaSecondaryDisplay;
  showSymbol?: boolean;
};

type FormattedDeltaValue = {
  symbol: string;
  value: string;
  secondaryValue?: string;
};

function getDeltaTrend(value: string | number, trend?: DeltaTrend): DeltaTrend {
  if (trend) {
    return trend;
  }

  if (typeof value === "number") {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
  }

  const normalized = value.trim();
  if (normalized.startsWith("-") || normalized.startsWith(NEGATIVE_DELTA_SYMBOL)) return "negative";
  if (normalized.startsWith("+") || normalized.startsWith(POSITIVE_DELTA_SYMBOL)) return "positive";
  return "neutral";
}

function getDeltaSymbol(value: number) {
  if (value > 0) return POSITIVE_DELTA_SYMBOL;
  if (value < 0) return NEGATIVE_DELTA_SYMBOL;
  return "";
}

function normalizeDeltaSymbol(symbol = "") {
  if (symbol === "+") return POSITIVE_DELTA_SYMBOL;
  if (symbol === "-") return NEGATIVE_DELTA_SYMBOL;
  return symbol;
}

function splitDeltaString(value: string): FormattedDeltaValue {
  const normalizedValue = value.trim();

  if (/^-+$/.test(normalizedValue)) {
    return { symbol: "", value: normalizedValue };
  }

  const match = normalizedValue.match(/^([+-]|▲|▼)?\s*(.+?)(?:\s*\(([^)]+)\))?$/);

  if (!match) return { symbol: "", value };

  return {
    symbol: normalizeDeltaSymbol(match[1]),
    value: match[2],
    secondaryValue: match[3] ? `(${match[3]})` : undefined
  };
}

function formatDeltaValue({
  value,
  format = "auto",
  currency = "USD",
  locale = "en-US"
}: Pick<DeltaValueProps, "value" | "format" | "currency" | "locale">): FormattedDeltaValue {
  if (typeof value === "string") {
    return splitDeltaString(value);
  }

  const symbol = getDeltaSymbol(value);
  const magnitude = Math.abs(value);

  if (format === "currency" || format === "dollar") {
    return {
      symbol,
      value: new Intl.NumberFormat(locale, {
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: "currency"
      }).format(magnitude)
    };
  }

  if (format === "percent") {
    return {
      symbol,
      value: `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0
      }).format(magnitude)}%`
    };
  }

  return {
    symbol,
    value: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(magnitude)
  };
}

function stripParentheses(value: string) {
  return value.replace(/^\((.*)\)$/, "$1");
}

function getFormattedMagnitude(value: string) {
  const match = value.match(/[\d,]+(?:\.\d+)?/);

  return match ? Number(match[0].replace(/,/g, "")) : null;
}

function getFormattedSign(symbol: string, trend: DeltaTrend) {
  if (symbol === NEGATIVE_DELTA_SYMBOL || trend === "negative") return -1;
  if (symbol === POSITIVE_DELTA_SYMBOL || trend === "positive") return 1;
  return 0;
}

function getFormattedCurrencyMagnitude(value: string) {
  if (!/[$€£¥]/.test(value)) {
    return null;
  }

  return getFormattedMagnitude(value);
}

function getReferenceMagnitude(referenceValue?: string | number) {
  if (typeof referenceValue === "number") {
    return Number.isFinite(referenceValue) ? referenceValue : null;
  }

  if (!referenceValue) {
    return null;
  }

  return getFormattedMagnitude(referenceValue);
}

function formatCurrencyAmount(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(Math.abs(value));
}

function formatPercentAmount(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  }).format(Math.abs(value))}%`;
}

function formatDeltaTooltipValue({
  formattedValue,
  format,
  currency,
  locale,
  referenceValue,
  trend
}: {
  formattedValue: FormattedDeltaValue;
  format: DeltaFormat;
  currency: string;
  locale: string;
  referenceValue?: string | number;
  trend: DeltaTrend;
}) {
  const prefix = formattedValue.symbol ? `${formattedValue.symbol} ` : "";

  if (formattedValue.secondaryValue) {
    return `${prefix}${stripParentheses(formattedValue.secondaryValue)}`;
  }

  const magnitude = getFormattedMagnitude(formattedValue.value);
  const referenceMagnitude = getReferenceMagnitude(referenceValue);
  const sign = getFormattedSign(formattedValue.symbol, trend);

  if (magnitude === null || referenceMagnitude === null || sign === 0) {
    return null;
  }

  const isPercent = format === "percent" || formattedValue.value.includes("%");
  const isCurrency =
    format === "currency" ||
    format === "dollar" ||
    getFormattedCurrencyMagnitude(formattedValue.value) !== null;

  if (isPercent) {
    const rate = (sign * magnitude) / 100;
    const previousValue = referenceMagnitude / (1 + rate);

    if (!Number.isFinite(previousValue)) {
      return null;
    }

    const deltaValue = referenceMagnitude - previousValue;

    return `${prefix}${formatCurrencyAmount(deltaValue, locale, currency)}`;
  }

  if (isCurrency) {
    const deltaValue = sign * magnitude;
    const previousValue = referenceMagnitude - deltaValue;

    if (!Number.isFinite(previousValue) || previousValue === 0) {
      return null;
    }

    return `${prefix}${formatPercentAmount((deltaValue / previousValue) * 100, locale)}`;
  }

  return null;
}

export function DeltaValue({
  value,
  format = "auto",
  currency = "USD",
  locale = "en-US",
  trend,
  referenceValue,
  periodLabel,
  className,
  secondaryDisplay = "inline",
  showSymbol = true
}: DeltaValueProps) {
  const resolvedTrend = getDeltaTrend(value, trend);
  const classes = ["cs-delta", className].filter(Boolean).join(" ");
  const formattedValue = formatDeltaValue({ value, format, currency, locale });
  const visibleFormattedValue = showSymbol ? formattedValue : { ...formattedValue, symbol: "" };
  const visiblePeriodLabel = formattedValue.secondaryValue ? undefined : periodLabel;
  const symbolGap = visibleFormattedValue.symbol || visiblePeriodLabel ? "value" : undefined;
  const showSecondaryValue = Boolean(formattedValue.secondaryValue && secondaryDisplay === "inline");
  const tooltipValue =
    formattedValue.secondaryValue && secondaryDisplay === "inline"
      ? null
      : formatDeltaTooltipValue({
          formattedValue: visibleFormattedValue,
          format,
          currency,
          locale,
          referenceValue,
          trend: resolvedTrend
        });

  const content = (
    <>
      {visibleFormattedValue.symbol ? (
        <span className="cs-delta-symbol">{visibleFormattedValue.symbol}</span>
      ) : null}
      <span className="cs-delta-value">{formattedValue.value}</span>
      {showSecondaryValue ? (
        <span className="cs-delta-secondary">{formattedValue.secondaryValue}</span>
      ) : null}
      {visiblePeriodLabel ? <span className="cs-delta-period">{visiblePeriodLabel}</span> : null}
    </>
  );

  if (!tooltipValue) {
    return (
      <span className={classes} data-format={format} data-symbol-gap={symbolGap} data-trend={resolvedTrend}>
        {content}
      </span>
    );
  }

  return (
    <MetadataTooltip
      label={tooltipValue}
      className={classes}
      data-format={format}
      data-symbol-gap={symbolGap}
      data-trend={resolvedTrend}
    >
      {content}
    </MetadataTooltip>
  );
}
