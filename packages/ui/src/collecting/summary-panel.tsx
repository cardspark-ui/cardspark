"use client";

import { CardArt } from "../core/card-art";
import { DeltaValue } from "../core/delta-value";
import { useAdaptivePreviewCount } from "./adaptive-preview-count";
import { MarketSparkline } from "../market/sparkline";
import { CollectionValueContent, DEFAULT_VALUE_PANEL_RANGE, DEFAULT_VALUE_PANEL_RANGES } from "../market/value-panel-content";
import type { CollectionValueRangeData } from "../market/value-panel-content";
import type { ReactNode } from "react";

export type CollectionSummaryMetric = {
  label: string;
  value?: string;
  description?: string;
  delta?: string;
  showDeltaSymbol?: boolean;
  thumbnails?: Array<{
    name: string;
    price?: string;
    delta?: string;
    imageUrl?: string;
    imageAlt?: string;
    rarity?: string;
  }>;
};

export type CollectionSummaryProps = {
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
  emptyLabel?: string;
  onRangeChange?: (range: string) => void;
  metrics: CollectionSummaryMetric[];
};

const COLLECTION_SUMMARY_THUMBNAIL_LIMIT = 7;
const COLLECTION_SUMMARY_THUMBNAIL_FALLBACK_WIDTH = 22;
const COLLECTION_SUMMARY_THUMBNAIL_GAP_FALLBACK = 8;

export function CollectionSummary({
  title,
  value,
  delta,
  deltaDetail,
  description,
  chart,
  chartRangeData,
  chartValues,
  valueSeries,
  deltaSeries,
  ranges,
  activeRange = DEFAULT_VALUE_PANEL_RANGE,
  hoverLabel = "10:30 AM",
  hoverLabels,
  hoverPosition = 52,
  hoverValuePosition = 44,
  previousClosePosition = 58,
  previousCloseValue,
  emptyLabel,
  onRangeChange,
  metrics
}: CollectionSummaryProps) {
  const resolvedRanges = ranges ?? getCollectionSummaryRanges(chartRangeData);
  const resolvedActiveRange = getCollectionSummaryActiveRange(activeRange, resolvedRanges, chartRangeData, chartValues);
  const activeRangeData = chartRangeData?.[resolvedActiveRange];
  const selectedChartValues = activeRangeData?.values ?? chartValues;
  const selectedPreviousCloseValue = activeRangeData?.previousCloseValue ?? previousCloseValue;
  const renderedChart =
    chart ??
    (selectedChartValues?.length ? (
      <MarketSparkline values={selectedChartValues} baselineValue={selectedPreviousCloseValue} />
    ) : null);

  return (
    <section className="cs-collection-summary">
      <div className="cs-collection-summary-chart">
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
          ranges={resolvedRanges}
          activeRange={resolvedActiveRange}
          description={description}
          emptyLabel={activeRangeData?.emptyLabel ?? emptyLabel}
          onRangeChange={onRangeChange}
        >
          {renderedChart}
        </CollectionValueContent>
      </div>
      <dl className="cs-collection-summary-metrics" aria-label={`${title} summary`}>
        {metrics.map((metric) => (
          <CollectionSummaryMetricItem metric={metric} key={metric.label} />
        ))}
      </dl>
    </section>
  );
}

function getCollectionSummaryRanges(chartRangeData?: Partial<Record<string, CollectionValueRangeData>>) {
  const chartRanges = chartRangeData ? Object.keys(chartRangeData) : [];

  return chartRanges.length ? chartRanges : DEFAULT_VALUE_PANEL_RANGES;
}

function getCollectionSummaryActiveRange(
  activeRange: string,
  ranges: string[],
  chartRangeData?: Partial<Record<string, CollectionValueRangeData>>,
  chartValues?: number[]
) {
  if (!chartRangeData) {
    return activeRange;
  }

  if (chartRangeData[activeRange]?.values?.length || chartValues?.length) {
    return activeRange;
  }

  return ranges.find((range) => chartRangeData[range]?.values?.length) ?? activeRange;
}

function CollectionSummaryMetricItem({ metric }: { metric: CollectionSummaryMetric }) {
  const hasThumbnails = Boolean(metric.thumbnails?.length);

  return (
    <div
      className="cs-collection-summary-metric"
      data-variant={hasThumbnails ? "thumbnails" : undefined}
    >
      <dt>
        {metric.label}
        {metric.description ? <small>{metric.description}</small> : null}
      </dt>
      <dd>
        {hasThumbnails && metric.thumbnails ? (
          <CollectionSummaryThumbnailMetric label={metric.label} thumbnails={metric.thumbnails} />
        ) : (
          <>
            {metric.value ? <strong>{metric.value}</strong> : null}
            {metric.delta && metric.value ? (
              <DeltaValue value={metric.delta} referenceValue={metric.value} showSymbol={metric.showDeltaSymbol} />
            ) : null}
          </>
        )}
      </dd>
    </div>
  );
}

function CollectionSummaryThumbnailMetric({
  label,
  thumbnails
}: {
  label: string;
  thumbnails: NonNullable<CollectionSummaryMetric["thumbnails"]>;
}) {
  const maxPreviewCount = Math.min(thumbnails.length, COLLECTION_SUMMARY_THUMBNAIL_LIMIT);
  const {
    containerRef,
    countRef,
    visibleCount
  } = useAdaptivePreviewCount<HTMLDivElement>({
    maxCount: maxPreviewCount,
    limit: COLLECTION_SUMMARY_THUMBNAIL_LIMIT,
    railSelector: ".cs-collection-summary-thumbnail-stack",
    itemSelector: ".cs-collection-summary-thumbnail-tooltip",
    fallbackItemWidth: COLLECTION_SUMMARY_THUMBNAIL_FALLBACK_WIDTH,
    fallbackGap: COLLECTION_SUMMARY_THUMBNAIL_GAP_FALLBACK
  });
  const hiddenCount = Math.max(thumbnails.length - visibleCount, 0);

  return (
    <>
      <div
        className="cs-collection-summary-thumbnail-rail"
        ref={containerRef}
      >
        <div className="cs-collection-summary-thumbnail-stack" aria-label={`${label} cards`}>
          {thumbnails.slice(0, visibleCount).map((thumbnail) => (
            <div
              className="cs-metadata-tooltip-trigger cs-collection-summary-thumbnail-tooltip"
              data-tooltip="true"
              aria-label={thumbnail.name}
              key={thumbnail.name}
            >
              <CardArt
                src={thumbnail.imageUrl}
                alt={thumbnail.imageAlt ?? `${thumbnail.name} trading card`}
                fallbackLabel={thumbnail.name}
                rarity={thumbnail.rarity}
                className="cs-collection-summary-thumbnail"
                tiltMultiplier={4.5}
              />
              <span className="cs-metadata-tooltip cs-collection-summary-thumbnail-tip" aria-hidden="true">
                <span className="cs-collection-summary-thumbnail-tip-name">{thumbnail.name}</span>
                {thumbnail.price || thumbnail.delta ? (
                  <span>
                    {thumbnail.price ? <strong>{thumbnail.price}</strong> : null}
                    {thumbnail.price && thumbnail.delta ? (
                      <span className="cs-thumbnail-tooltip-separator" aria-hidden="true" />
                    ) : null}
                    {thumbnail.delta ? <DeltaValue value={thumbnail.delta} /> : null}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
        {hiddenCount > 0 ? (
          <strong
            ref={countRef}
            className="cs-collection-summary-thumbnail-count"
            aria-label={`${hiddenCount} more ${label.toLowerCase()} cards`}
          >
            +{hiddenCount}
          </strong>
        ) : null}
      </div>
    </>
  );
}
