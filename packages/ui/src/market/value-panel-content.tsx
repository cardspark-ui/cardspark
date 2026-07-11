"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeltaValue } from "../core/delta-value";
import { MarketSparkline } from "./sparkline";
import type { DeltaTrend } from "../core/delta-value";
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";

const SPARKLINE_WIDTH = 112;
const SPARKLINE_HEIGHT = 34;

function getSparklineDomain(values: number[], minValue?: number, maxValue?: number, extraValue?: number) {
  const domainValues = typeof extraValue === "number" ? [...values, extraValue] : values;

  return {
    min: typeof minValue === "number" ? Math.min(minValue, ...domainValues) : Math.min(...domainValues),
    max: typeof maxValue === "number" ? Math.max(maxValue, ...domainValues) : Math.max(...domainValues)
  };
}

function getSparklineXProgress(index: number, length: number, xPositions?: number[]) {
  const providedX = xPositions?.[index];

  if (typeof providedX === "number" && Number.isFinite(providedX)) {
    return Math.min(Math.max(providedX, 0), 1);
  }

  return length > 1 ? index / (length - 1) : 0;
}

function getClosestSparklineIndex(progress: number, length: number, xPositions?: number[]) {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < length; index += 1) {
    const distance = Math.abs(progress - getSparklineXProgress(index, length, xPositions));

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

function getSparklinePointAtIndex(values: number[], index: number, minValue?: number, maxValue?: number, extraValue?: number, xPositions?: number[]) {
  const { min, max } = getSparklineDomain(values, minValue, maxValue, extraValue);
  const range = max - min || 1;
  const clampedIndex = Math.min(Math.max(Math.round(index), 0), values.length - 1);
  const progress = getSparklineXProgress(clampedIndex, values.length, xPositions);
  const value = values[clampedIndex] ?? values[0] ?? 0;
  const x = progress * SPARKLINE_WIDTH;
  const y = SPARKLINE_HEIGHT - ((value - min) / range) * (SPARKLINE_HEIGHT - 4) - 2;

  return { value, x, y };
}

function getSparklineY(values: number[], value: number, minValue?: number, maxValue?: number) {
  const { min, max } = getSparklineDomain(values, minValue, maxValue, value);
  const range = max - min || 1;

  return SPARKLINE_HEIGHT - ((value - min) / range) * (SPARKLINE_HEIGHT - 4) - 2;
}

function getDeltaTrend(value: string): DeltaTrend {
  const normalized = value.trim();

  if (normalized.startsWith("-")) return "negative";
  if (normalized.startsWith("+")) return "positive";
  return "neutral";
}

function getNumericTrend(value: number): DeltaTrend {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

const RANGE_PERIOD_LABELS: Record<string, string> = {
  "1D": "today",
  DAILY: "today",
  TODAY: "today",
  "1W": "this week",
  WEEKLY: "this week",
  "7D": "last 7 days",
  "1M": "last 30 days",
  "30D": "last 30 days",
  "3M": "last 90 days",
  "90D": "last 90 days",
  "6M": "last 180 days",
  "180D": "last 180 days",
  YTD: "year to date",
  "1Y": "last 365 days",
  "12M": "last 365 days",
  ALL: "all time"
};

export const DEFAULT_VALUE_PANEL_RANGES = ["1D", "1W", "1M", "1Y", "ALL"];
export const DEFAULT_VALUE_PANEL_RANGE = DEFAULT_VALUE_PANEL_RANGES[0];

function getRangePeriodLabel(range: string) {
  return RANGE_PERIOD_LABELS[range.trim().toUpperCase()];
}

function parseFormattedNumber(value: string) {
  const match = value.match(/-?[\d,]+(?:\.\d+)?/);

  return match ? Number(match[0].replace(/,/g, "")) : null;
}

function parseDeltaAmount(value: string) {
  const match = value.match(/([+-])\s*\$?([\d,]+(?:\.\d+)?)/);

  if (!match) return null;

  const amount = Number(match[2].replace(/,/g, ""));
  return match[1] === "-" ? -amount : amount;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

function formatDerivedDelta(difference: number, previousValue: number, template: string) {
  const sign = difference >= 0 ? "+" : "-";
  const prefix = template.includes("$") ? "$" : "";
  const percentage = previousValue === 0 ? 0 : (difference / previousValue) * 100;

  return `${sign}${prefix}${Math.abs(difference).toFixed(2)} (${Math.abs(percentage).toFixed(1)}%)`;
}

function getDerivedMarketPoint({
  currentDelta,
  currentValue,
  latestPointValue,
  pointValue,
  previousPointValue
}: {
  currentDelta: string;
  currentValue: string;
  latestPointValue: number;
  pointValue: number;
  previousPointValue: number;
}) {
  const currentMarketValue = parseFormattedNumber(currentValue);
  const currentMarketDelta = parseDeltaAmount(currentDelta);
  const pointDelta = latestPointValue - previousPointValue;

  if (currentMarketValue === null || currentMarketDelta === null || pointDelta === 0) {
    return null;
  }

  const previousMarketValue = currentMarketValue - currentMarketDelta;
  const marketValue = previousMarketValue + (pointValue - previousPointValue) * (currentMarketDelta / pointDelta);
  const marketDelta = marketValue - previousMarketValue;

  return {
    delta: formatDerivedDelta(marketDelta, previousMarketValue, currentDelta),
    trend: getNumericTrend(marketDelta),
    value: formatCurrency(marketValue)
  };
}

function AnimatedValue({ value, isEmpty = false }: { value: string; isEmpty?: boolean }) {
  return (
    <strong className="cs-animated-value" data-empty={isEmpty ? "true" : undefined} aria-label={value} aria-live="polite">
      {Array.from(value).map((character, index) => {
        const isDigit = /\d/.test(character);

        return isDigit ? (
          <span key={index} className="cs-animated-value-digit" aria-hidden="true">
            <span className="cs-animated-value-wheel" style={{ "--cs-wheel-value": Number(character) } as CSSProperties}>
              {Array.from({ length: 10 }, (_, digit) => (
                <span key={digit}>{digit}</span>
              ))}
            </span>
          </span>
        ) : (
          <span
            key={`${index}-${character}-${value}`}
            className="cs-animated-value-char"
            aria-hidden="true"
          >
            {character}
          </span>
        );
      })}
    </strong>
  );
}

export type CollectionValueRangeData = {
  values: number[];
  valueSeries?: string[];
  deltaSeries?: string[];
  volume?: number[];
  emptyLabel?: string;
  periodLabel?: string;
  hoverLabels?: string[];
  hoverLabel?: string;
  hoverPosition?: number;
  hoverValuePosition?: number;
  previousClosePosition?: number;
  previousCloseValue?: number;
  minValue?: number;
  maxValue?: number;
  pointXPositions?: number[];
};

export type CollectionValueFooterMetric = {
  label: string;
  value: string;
  description?: string;
};

function CollectionValueEmptyState({ label }: { label: string }) {
  return (
    <div className="cs-value-panel-empty">
      <span>{label}</span>
    </div>
  );
}

export function CollectionValueContent({
  title,
  value,
  delta,
  deltaPeriod,
  children,
  values,
  valueSeries,
  deltaSeries,
  hoverLabel = "10:30 AM",
  hoverLabels,
  hoverPosition = 52,
  hoverValuePosition = 44,
  previousClosePosition = 58,
  previousCloseValue,
  minValue,
  maxValue,
  pointXPositions,
  chartRangeData,
  renderChartFromValues = false,
  ranges = DEFAULT_VALUE_PANEL_RANGES,
  activeRange = DEFAULT_VALUE_PANEL_RANGE,
  description,
  footerLabel,
  footerValue,
  footerMetrics,
  emptyLabel = "No chart data available",
  summaryAction,
  hideSummaryTitle = true,
  onRangeChange,
  onSettingsClick,
  renderChart
}: {
  title: string;
  value: string;
  delta: string;
  deltaPeriod?: string;
  children: ReactNode;
  values?: number[];
  valueSeries?: string[];
  deltaSeries?: string[];
  hoverLabel?: string;
  hoverLabels?: string[];
  hoverPosition?: number;
  hoverValuePosition?: number;
  previousClosePosition?: number;
  previousCloseValue?: number;
  minValue?: number;
  maxValue?: number;
  pointXPositions?: number[];
  chartRangeData?: Partial<Record<string, CollectionValueRangeData>>;
  renderChartFromValues?: boolean;
  ranges?: string[];
  activeRange?: string;
  description?: string;
  footerLabel?: string;
  footerValue?: string;
  footerMetrics?: CollectionValueFooterMetric[];
  emptyLabel?: string;
  summaryAction?: ReactNode;
  hideSummaryTitle?: boolean;
  onRangeChange?: (range: string) => void;
  onSettingsClick?: () => void;
  renderChart?: (data: {
    values?: number[];
    previousCloseValue?: number;
    minValue?: number;
    maxValue?: number;
    pointXPositions?: number[];
    rangeData?: CollectionValueRangeData;
    selectedRange: string;
  }) => ReactNode;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState(activeRange);
  const plotRef = useRef<HTMLDivElement>(null);
  const selectedRangeData = chartRangeData?.[selectedRange];
  const selectedValues = selectedRangeData?.values ?? values;
  const selectedValueSeries = selectedRangeData ? selectedRangeData.valueSeries : valueSeries;
  const selectedDeltaSeries = selectedRangeData ? selectedRangeData.deltaSeries : deltaSeries;
  const selectedDeltaPeriod = selectedRangeData?.periodLabel ?? getRangePeriodLabel(selectedRange) ?? deltaPeriod;
  const selectedHoverLabel = selectedRangeData?.hoverLabel ?? hoverLabel;
  const selectedHoverLabels = selectedRangeData?.hoverLabels ?? hoverLabels;
  const selectedHoverPosition = selectedRangeData?.hoverPosition ?? hoverPosition;
  const selectedHoverValuePosition = selectedRangeData?.hoverValuePosition ?? hoverValuePosition;
  const selectedPreviousClosePosition = selectedRangeData?.previousClosePosition ?? previousClosePosition;
  const selectedPreviousCloseValue = selectedRangeData?.previousCloseValue ?? previousCloseValue;
  const selectedMinValue = selectedRangeData?.minValue ?? minValue;
  const selectedMaxValue = selectedRangeData?.maxValue ?? maxValue;
  const selectedPointXPositions = selectedRangeData?.pointXPositions ?? pointXPositions;
  const hasValueSeries = Array.isArray(selectedValues);
  const hasSelectedData = hasValueSeries ? selectedValues.length > 0 : true;
  const hasInteractivePoints = Boolean(selectedValues?.length);
  const selectedEmptyLabel = selectedRangeData?.emptyLabel ?? emptyLabel;

  useEffect(() => {
    setSelectedRange(activeRange);
    setHoveredIndex(null);
  }, [activeRange]);

  const activePoint = useMemo(() => {
    if (!selectedValues?.length || hoveredIndex === null) {
      return null;
    }

    return getSparklinePointAtIndex(selectedValues, hoveredIndex, selectedMinValue, selectedMaxValue, selectedPreviousCloseValue, selectedPointXPositions);
  }, [hoveredIndex, selectedMaxValue, selectedMinValue, selectedPointXPositions, selectedPreviousCloseValue, selectedValues]);

  const previousCloseY =
    selectedValues?.length && typeof selectedPreviousCloseValue === "number"
      ? (getSparklineY(selectedValues, selectedPreviousCloseValue, selectedMinValue, selectedMaxValue) / SPARKLINE_HEIGHT) * 100
      : selectedPreviousClosePosition;
  const activeIndex = selectedValues?.length
    ? Math.min(hoveredIndex ?? selectedValues.length - 1, selectedValues.length - 1)
    : 0;

  useEffect(() => {
    const bars = plotRef.current?.querySelectorAll<HTMLSpanElement>(".cs-price-history-volume span");

    bars?.forEach((bar, index) => {
      if (hoveredIndex !== null && index === activeIndex) {
        bar.dataset.active = "true";
      } else {
        delete bar.dataset.active;
      }
    });
  }, [activeIndex, hoveredIndex, selectedRange]);

  const derivedMarketPoint =
    activePoint && selectedValues?.length && typeof selectedPreviousCloseValue === "number"
      ? getDerivedMarketPoint({
          currentDelta: delta,
          currentValue: value,
          latestPointValue: selectedValues[selectedValues.length - 1],
          pointValue: activePoint.value,
          previousPointValue: selectedPreviousCloseValue
        })
      : null;
  const activeValue = hasSelectedData
    ? hoveredIndex === null
      ? value
      : selectedValueSeries?.[activeIndex] ?? derivedMarketPoint?.value ?? value
    : "$-.--";
  const activeDelta = hasSelectedData
    ? hoveredIndex === null
      ? delta
      : selectedDeltaSeries?.[activeIndex] ?? derivedMarketPoint?.delta ?? delta
    : "--";
  const activeDeltaTrend =
    !hasSelectedData
      ? "neutral"
      : derivedMarketPoint
      ? derivedMarketPoint.trend
      : activePoint && typeof selectedPreviousCloseValue === "number"
        ? getNumericTrend(activePoint.value - selectedPreviousCloseValue)
      : getDeltaTrend(activeDelta);
  const chartStyle = {
    "--cs-chart-hover-x": activePoint ? `${(activePoint.x / SPARKLINE_WIDTH) * 100}%` : `${selectedHoverPosition}%`,
    "--cs-chart-hover-y": activePoint ? `${(activePoint.y / SPARKLINE_HEIGHT) * 100}%` : `${selectedHoverValuePosition}%`,
    "--cs-chart-previous-close-y": `${previousCloseY}%`
  } as CSSProperties;
  const chart = !hasSelectedData ? (
    <CollectionValueEmptyState label={selectedEmptyLabel} />
  ) : renderChart ? (
    renderChart({
      values: selectedValues,
      previousCloseValue: selectedPreviousCloseValue,
      minValue: selectedMinValue,
      maxValue: selectedMaxValue,
      pointXPositions: selectedPointXPositions,
      rangeData: selectedRangeData,
      selectedRange
    })
  ) : renderChartFromValues && selectedValues?.length ? (
      <MarketSparkline
        key={selectedRange}
        values={selectedValues}
        baselineValue={selectedPreviousCloseValue}
        minValue={selectedMinValue}
        maxValue={selectedMaxValue}
        xPositions={selectedPointXPositions}
      />
    ) : (
      children
    );
  const footerMetricsStyle = footerMetrics?.length
    ? ({ "--cs-value-panel-footer-count": footerMetrics.length } as CSSProperties)
    : undefined;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!selectedValues?.length) {
      return;
    }

    const rect = plotRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const progress = x / Math.max(rect.width, 1);
    const nextIndex = getClosestSparklineIndex(progress, selectedValues.length, selectedPointXPositions);
    setHoveredIndex(nextIndex);
  }

  function handlePointerOut(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setHoveredIndex(null);
    }
  }

  function handleChartKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!selectedValues?.length) {
      return;
    }

    const lastIndex = selectedValues.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextIndex = Math.max((hoveredIndex ?? lastIndex) - 1, 0);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextIndex = Math.min((hoveredIndex ?? lastIndex) + 1, lastIndex);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    setHoveredIndex(nextIndex);
  }

  return (
    <>
      <header className="cs-value-panel-summary" data-has-action={summaryAction ? "true" : "false"}>
        <div className="cs-value-panel-summary-copy">
          {hideSummaryTitle ? null : <p>{title}</p>}
          <AnimatedValue value={activeValue} isEmpty={!hasSelectedData} />
          <div className="cs-value-panel-change">
            <DeltaValue
              value={activeDelta}
              referenceValue={activeValue}
              trend={activeDeltaTrend}
              periodLabel={hasSelectedData && hoveredIndex === null ? selectedDeltaPeriod : undefined}
            />
          </div>
        </div>
        {summaryAction ? <div className="cs-value-panel-summary-action">{summaryAction}</div> : null}
      </header>
      <div
        className="cs-value-panel-chart"
        data-has-data={hasSelectedData}
        style={chartStyle}
        role={hasInteractivePoints ? "slider" : undefined}
        aria-label={hasInteractivePoints ? `${title} chart point` : undefined}
        aria-valuemin={hasInteractivePoints ? 0 : undefined}
        aria-valuemax={hasInteractivePoints ? selectedValues!.length - 1 : undefined}
        aria-valuenow={hasInteractivePoints ? activeIndex : undefined}
        aria-valuetext={
          hasInteractivePoints
            ? `${selectedHoverLabels?.[activeIndex] ?? selectedHoverLabel}: ${activeValue}, ${activeDelta}`
            : undefined
        }
        tabIndex={hasInteractivePoints ? 0 : undefined}
        onFocus={() => {
          if (selectedValues?.length) {
            setHoveredIndex(selectedValues.length - 1);
          }
        }}
        onBlur={() => {
          setHoveredIndex(null);
        }}
        onKeyDown={handleChartKeyDown}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerLeave={() => {
          setHoveredIndex(null);
        }}
      >
        <div className="cs-value-panel-plot" data-has-data={hasSelectedData} ref={plotRef}>
          {chart}
          {hasSelectedData ? (
            <>
              <span className="cs-value-panel-hover-label" aria-hidden="true">
                {selectedHoverLabels?.[activeIndex] ?? selectedHoverLabel}
              </span>
              <span className="cs-value-panel-hover-dot" aria-hidden="true" />
            </>
          ) : null}
        </div>
      </div>
      {hasSelectedData && ranges.length ? (
        <div className="cs-value-panel-ranges" aria-label={`${title} range`}>
          <div className="cs-value-panel-range-list">
            {ranges.map((range) => (
              <button
                key={range}
                className="cs-value-panel-range"
                type="button"
                aria-pressed={range === selectedRange}
                data-active={range === selectedRange}
                onClick={() => {
                  setSelectedRange(range);
                  setHoveredIndex(null);
                  onRangeChange?.(range);
                }}
              >
                {range}
              </button>
            ))}
          </div>
          {onSettingsClick ? (
            <button
              className="cs-value-panel-settings"
              type="button"
              aria-label={`${title} range settings`}
              onClick={onSettingsClick}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}
      {hasSelectedData && footerMetrics?.length ? (
        <dl className="cs-value-panel-footer cs-value-panel-footer-metrics" style={footerMetricsStyle}>
          {footerMetrics.map((metric) => (
            <div className="cs-value-panel-footer-metric" key={metric.label}>
              <dt>
                {metric.label}
                {metric.description ? <small>{metric.description}</small> : null}
              </dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : hasSelectedData && (footerLabel || footerValue || description) ? (
        <div className="cs-value-panel-footer">
          <span>
            {footerLabel ?? description}
            {description && footerLabel ? <small>{description}</small> : null}
          </span>
          {footerValue ? <strong>{footerValue}</strong> : null}
        </div>
      ) : null}
    </>
  );
}
