import { DeltaValue } from "../core/delta-value";
import { MarketSparkline } from "../market/sparkline";
import { CollectionValueContent } from "../market/value-panel-content";
import type { CollectionValueFooterMetric, CollectionValueRangeData } from "../market/value-panel-content";
import type { CSSProperties, ReactNode } from "react";

export type CollectionValuePanelProps = {
  title: string;
  value: string;
  delta: string;
  deltaDetail?: string;
  description?: string;
  chart?: ReactNode;
  chartRangeData?: Partial<Record<string, CollectionValueRangeData>>;
  chartValues?: number[];
  valueSeries?: string[];
  deltaSeries?: string[];
  ranges?: string[];
  activeRange?: string;
  hoverLabel?: string;
  hoverLabels?: string[];
  hoverPosition?: number;
  hoverValuePosition?: number;
  previousClosePosition?: number;
  previousCloseValue?: number;
  footerLabel?: string;
  footerValue?: string;
  footerMetrics?: CollectionValueFooterMetric[];
  emptyLabel?: string;
};

export function CollectionValuePanel({
  title,
  value,
  delta,
  deltaDetail = "Today",
  description,
  chart,
  chartRangeData,
  chartValues,
  valueSeries,
  deltaSeries,
  ranges = ["1W", "1M", "3M", "YTD", "1Y", "All"],
  activeRange = "1W",
  hoverLabel = "10:30 AM",
  hoverLabels,
  hoverPosition = 52,
  hoverValuePosition = 44,
  previousClosePosition = 58,
  previousCloseValue,
  footerLabel,
  footerValue,
  footerMetrics,
  emptyLabel
}: CollectionValuePanelProps) {
  const activeRangeData = chartRangeData?.[activeRange];
  const selectedChartValues = activeRangeData?.values ?? chartValues;
  const selectedPreviousCloseValue = activeRangeData?.previousCloseValue ?? previousCloseValue;
  const hasChartSurface = Boolean(chart) || Array.isArray(selectedChartValues);
  const renderedChart =
    chart ??
    (selectedChartValues?.length ? (
      <MarketSparkline values={selectedChartValues} baselineValue={selectedPreviousCloseValue} />
    ) : null);
  const footerMetricsStyle = footerMetrics?.length
    ? ({ "--cs-value-panel-footer-count": footerMetrics.length } as CSSProperties)
    : undefined;

  if (!hasChartSurface) {
    return (
      <article className="cs-value-panel">
        <header className="cs-value-panel-summary">
          <p>{title}</p>
          <strong>{value}</strong>
          <div className="cs-value-panel-change">
            <DeltaValue value={delta} referenceValue={value} periodLabel={deltaDetail} />
          </div>
        </header>
        {footerMetrics?.length ? (
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
        ) : footerLabel || footerValue || description ? (
          <div className="cs-value-panel-footer">
            <span>
              {footerLabel ?? description}
              {description && footerLabel ? <small>{description}</small> : null}
            </span>
            {footerValue ? <strong>{footerValue}</strong> : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="cs-value-panel">
      <CollectionValueContent
        title={title}
        value={value}
        delta={delta}
        deltaPeriod={deltaDetail}
        values={selectedChartValues}
        valueSeries={activeRangeData?.valueSeries ?? valueSeries}
        deltaSeries={activeRangeData?.deltaSeries ?? deltaSeries}
        hoverLabel={activeRangeData?.hoverLabel ?? hoverLabel}
        hoverLabels={activeRangeData?.hoverLabels ?? hoverLabels}
        hoverPosition={activeRangeData?.hoverPosition ?? hoverPosition}
        hoverValuePosition={activeRangeData?.hoverValuePosition ?? hoverValuePosition}
        previousClosePosition={activeRangeData?.previousClosePosition ?? previousClosePosition}
        previousCloseValue={selectedPreviousCloseValue}
        chartRangeData={chartRangeData}
        renderChartFromValues={!chart && Boolean(selectedChartValues)}
        ranges={ranges}
        activeRange={activeRange}
        description={description}
        footerLabel={footerLabel}
        footerValue={footerValue}
        footerMetrics={footerMetrics}
        emptyLabel={activeRangeData?.emptyLabel ?? emptyLabel}
      >
        {renderedChart}
      </CollectionValueContent>
    </article>
  );
}
