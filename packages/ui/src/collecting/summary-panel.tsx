import { CardImageTilt } from "../core/card-image-tilt";
import { DeltaValue } from "../core/delta-value";
import { CollectionValuePanel } from "./value-panel";
import type { CollectionValueFooterMetric, CollectionValueRangeData } from "../market/value-panel-content";
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
  }>;
};

export type CollectionSummaryPanelProps = {
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
  previousCloseValue?: number;
  footerMetrics?: CollectionValueFooterMetric[];
  metrics: CollectionSummaryMetric[];
};

export function CollectionSummaryPanel({
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
  activeRange,
  previousCloseValue,
  footerMetrics,
  metrics
}: CollectionSummaryPanelProps) {
  return (
    <section className="cs-collection-summary-panel">
      <div className="cs-collection-summary-chart">
        <CollectionValuePanel
          title={title}
          value={value}
          delta={delta}
          deltaDetail={deltaDetail}
          description={description}
          chart={chart}
          chartRangeData={chartRangeData}
          chartValues={chartValues}
          valueSeries={valueSeries}
          deltaSeries={deltaSeries}
          ranges={ranges}
          activeRange={activeRange}
          previousCloseValue={previousCloseValue}
          footerMetrics={footerMetrics}
        />
      </div>
      <dl className="cs-collection-summary-metrics" aria-label={`${title} summary`}>
        {metrics.map((metric) => (
          <div
            className="cs-collection-summary-metric"
            data-variant={metric.thumbnails?.length ? "thumbnails" : undefined}
            key={metric.label}
          >
            <dt>
              {metric.label}
              {metric.description ? <small>{metric.description}</small> : null}
            </dt>
            <dd>
              {metric.thumbnails?.length ? (
                <div className="cs-collection-summary-thumbnail-stack" aria-label={`${metric.label} cards`}>
                  {metric.thumbnails.slice(0, 7).map((thumbnail) => (
                    <div
                      className="cs-metadata-tooltip-trigger cs-collection-summary-thumbnail-tooltip"
                      data-tooltip="true"
                      aria-label={thumbnail.name}
                      key={thumbnail.name}
                    >
                      <CardImageTilt
                        src={thumbnail.imageUrl}
                        alt={thumbnail.imageAlt ?? `${thumbnail.name} trading card`}
                        fallbackLabel={thumbnail.name}
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
        ))}
      </dl>
    </section>
  );
}
