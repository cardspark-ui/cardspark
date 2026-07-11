"use client";

import { formatConditionLabel } from "../core/condition";
import { FilterBar } from "../core/filter-bar";
import { formatCurrency, formatDeltaFromReference, parseCurrencyLabel } from "../core/money";
import { getGradeOptionsForGrader } from "../market/grading";
import { isUngradedGrader, resolveMarketHistoryDataSet } from "../market/history-selection";
import { MarketSparkline } from "../market/sparkline";
import { CollectionValueContent } from "../market/value-panel-content";
import { useEffect, useMemo, useState } from "react";
import type { FilterBarItem, FilterOption } from "../core/filter-bar";
import type { MarketHistoryDataSet, MarketHistoryDimension } from "../market/history-selection";
import type { CollectionValueRangeData } from "../market/value-panel-content";
import type { CSSProperties } from "react";

export type CardDetailHistory = {
  values: number[];
  baselineValue?: number;
  range: string;
  ranges: string[];
  volume?: number[];
  highLabel?: string;
  lowLabel?: string;
  hoverLabels?: string[];
  chartRangeData?: Partial<Record<string, CollectionValueRangeData>>;
  dataSets?: MarketHistoryDataSet[];
  emptyLabel?: string;
};

export type CardDetailMarketSummary = {
  label: string;
  price: string;
  deltaToday: string;
};

type DetailDimension = MarketHistoryDimension;
type DetailDimensionValues = Record<string, string[]>;

export type PriceHistoryPanelProps = CardDetailHistory &
  CardDetailMarketSummary & {
    dimensions?: DetailDimension[];
    onDimensionChange?: (label: string, value: string) => void;
    onRangeChange?: (range: string) => void;
  };

function getDimensionDisplayText(dimensionLabel: string, option: string, variant: "compact" | "menu") {
  if (dimensionLabel !== "Condition") {
    return option;
  }

  return formatConditionLabel(option, variant === "compact" ? "code" : "code-label");
}

function getDetailDimensionId(dimensionLabel: string) {
  return dimensionLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getDetailDimensionLabelFromId(dimensions: DetailDimension[], id: string) {
  return dimensions.find((dimension) => getDetailDimensionId(dimension.label) === id)?.label;
}

function createDetailDimensionOption(dimensionLabel: string, option: string): string | FilterOption {
  if (dimensionLabel !== "Condition") {
    return option;
  }

  return {
    value: option,
    label: getDimensionDisplayText(dimensionLabel, option, "menu"),
    compactLabel: getDimensionDisplayText(dimensionLabel, option, "compact")
  };
}

function createDetailFilterItems(
  dimensions: DetailDimension[],
  selectedOptions: Record<string, string>,
  selectedValues: DetailDimensionValues
) {
  return dimensions.map((dimension) => {
    const selectedOption = selectedOptions[dimension.label] ?? dimension.activeOption;
    const values = selectedValues[dimension.label] ?? [selectedOption];

    const baseItem = {
      id: getDetailDimensionId(dimension.label),
      label: dimension.label,
      options: dimension.options.map((option) => createDetailDimensionOption(dimension.label, option)),
      compact: dimension.label === "Condition"
    };

    if (dimension.label !== "Grader" && dimension.label !== "Grade" && dimension.options.length > 2) {
      return {
        ...baseItem,
        multiple: true,
        values
      } satisfies FilterBarItem;
    }

    return {
      ...baseItem,
      value: selectedOption
    } satisfies FilterBarItem;
  });
}

function getSingleSelectionFromValues(values: string[], fallback: string) {
  return values[0] ?? fallback;
}

function getInitialDetailDimensionValues(dimensions: DetailDimension[] | undefined) {
  return Object.fromEntries(dimensions?.map((dimension) => [dimension.label, [dimension.activeOption]]) ?? []);
}

function DetailDimensionControls({
  dimensions,
  selectedOptions,
  selectedValues,
  onOptionChange,
  onOptionMultiChange,
  ariaLabel = "Data dimensions"
}: {
  dimensions: DetailDimension[];
  selectedOptions: Record<string, string>;
  selectedValues: DetailDimensionValues;
  onOptionChange: (label: string, value: string) => void;
  onOptionMultiChange: (label: string, values: string[]) => void;
  ariaLabel?: string;
}) {
  return (
    <FilterBar
      ariaLabel={ariaLabel}
      className="cs-detail-dimensions"
      filters={createDetailFilterItems(dimensions, selectedOptions, selectedValues)}
      onChange={(id, selection) => {
        const label = getDetailDimensionLabelFromId(dimensions, id);

        if (label && typeof selection === "string") {
          onOptionChange(label, selection);
        } else if (label) {
          onOptionMultiChange(label, selection as string[]);
        }
      }}
    />
  );
}

export function PriceHistoryPanel({
  values,
  baselineValue,
  range,
  ranges,
  volume = [],
  highLabel,
  lowLabel,
  hoverLabels: providedHoverLabels,
  chartRangeData,
  dataSets,
  emptyLabel,
  label,
  price,
  deltaToday,
  dimensions,
  onDimensionChange,
  onRangeChange
}: PriceHistoryPanelProps) {
  const dimensionDefaultsKey =
    dimensions
      ?.map((dimension) => `${dimension.label}:${dimension.activeOption}:${dimension.options.join(",")}`)
      .join("|") ?? "";
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(dimensions?.map((dimension) => [dimension.label, dimension.activeOption]) ?? [])
  );
  const [selectedOptionValues, setSelectedOptionValues] = useState<DetailDimensionValues>(() =>
    getInitialDetailDimensionValues(dimensions)
  );

  useEffect(() => {
    setSelectedOptions(
      Object.fromEntries(dimensions?.map((dimension) => [dimension.label, dimension.activeOption]) ?? [])
    );
    setSelectedOptionValues(getInitialDetailDimensionValues(dimensions));
  }, [dimensionDefaultsKey]);

  const rawGradeOptions = dimensions?.find((dimension) => dimension.label === "Grade")?.options ?? [];
  const dynamicDimensions = useMemo(() => {
    return dimensions?.map((dimension) => {
      if (dimension.label === "Condition") {
        return {
          ...dimension,
          options: isUngradedGrader(selectedOptions.Grader) ? dimension.options : []
        };
      }

      if (dimension.label !== "Grade") {
        return dimension;
      }

      const options = isUngradedGrader(selectedOptions.Grader)
        ? []
        : getGradeOptionsForGrader(selectedOptions.Grader, rawGradeOptions, dataSets);

      return {
        ...dimension,
        options,
        activeOption: options.includes(selectedOptions.Grade)
          ? selectedOptions.Grade
          : options[0] ?? dimension.activeOption
      };
    });
  }, [dataSets, dimensions, rawGradeOptions, selectedOptions.Grade, selectedOptions.Grader]);
  const visibleDimensions = useMemo(
    () => (dynamicDimensions ?? dimensions)?.filter((dimension) => dimension.options.length > 0),
    [dimensions, dynamicDimensions]
  );

  useEffect(() => {
    const gradeDimension = dynamicDimensions?.find((dimension) => dimension.label === "Grade");

    if (!gradeDimension?.options.length || gradeDimension.options.includes(selectedOptions.Grade)) {
      return;
    }

    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      Grade: gradeDimension.options[0]
    }));
    setSelectedOptionValues((currentValues) => ({
      ...currentValues,
      Grade: [gradeDimension.options[0]]
    }));
  }, [dynamicDimensions, selectedOptions.Grade]);

  const selectedDataSet = useMemo(
    () =>
      resolveMarketHistoryDataSet({
        dataSets,
        dimensions: visibleDimensions,
        selectedOptions,
        selectedValues: selectedOptionValues,
        allowMissingDimensions: true
      }),
    [dataSets, selectedOptions, selectedOptionValues, visibleDimensions]
  );
  const selectedValues = selectedDataSet?.values ?? (dataSets ? [] : values);
  const selectedVolume = selectedDataSet?.volume ?? (dataSets ? [] : volume);
  const selectedBaselineValue = selectedDataSet?.baselineValue ?? baselineValue;
  const selectedRange = selectedDataSet?.range ?? range;
  const selectedRanges = selectedDataSet?.ranges ?? ranges;
  const selectedHighLabel =
    selectedDataSet?.highLabel ??
    highLabel ??
    (selectedValues.length ? formatCurrency(Math.max(...selectedValues)) : undefined);
  const selectedLowLabel =
    selectedDataSet?.lowLabel ??
    lowLabel ??
    (selectedValues.length ? formatCurrency(Math.min(...selectedValues)) : undefined);
  const selectedChartRangeData = selectedDataSet?.chartRangeData ?? chartRangeData;
  const selectedEmptyLabel = selectedDataSet?.emptyLabel ?? emptyLabel ?? "No sales data for this selection";
  const referenceValue = selectedBaselineValue ?? selectedValues[0] ?? 0;
  const valueSeries = selectedValues.map((value) => formatCurrency(value));
  const deltaSeries = selectedValues.map((value) => formatDeltaFromReference(value, referenceValue));
  const hoverLabels =
    selectedDataSet?.hoverLabels ??
    providedHoverLabels ??
    selectedValues.map((_, index) => `${selectedRange} point ${index + 1}`);
  const minValue = selectedLowLabel ? parseCurrencyLabel(selectedLowLabel) : undefined;
  const maxValue = selectedHighLabel ? parseCurrencyLabel(selectedHighLabel) : undefined;
  const pointXPositions = getVolumeAlignedPointXPositions(selectedValues.length);
  const chartKey =
    dimensions
      ?.map(
        (dimension) =>
          `${dimension.label}:${(
            selectedOptionValues[dimension.label] ?? [selectedOptions[dimension.label]]
          ).join(",")}`
      )
      .join("|") ?? "default";

  function handleOptionChange(dimensionLabel: string, value: string) {
    const graderGradeOptions =
      dimensionLabel === "Grader"
        ? isUngradedGrader(value)
          ? []
          : getGradeOptionsForGrader(value, rawGradeOptions, dataSets)
        : undefined;
    const nextGrade = graderGradeOptions
      ? graderGradeOptions.includes(selectedOptions.Grade)
        ? selectedOptions.Grade
        : graderGradeOptions[0] ?? selectedOptions.Grade
      : undefined;

    onDimensionChange?.(dimensionLabel, value);

    if (nextGrade && nextGrade !== selectedOptions.Grade) {
      onDimensionChange?.("Grade", nextGrade);
    }

    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      [dimensionLabel]: value,
      ...(dimensionLabel === "Grader" && nextGrade ? { Grade: nextGrade } : {})
    }));
    setSelectedOptionValues((currentValues) => ({
      ...currentValues,
      [dimensionLabel]: [value],
      ...(dimensionLabel === "Grader" && nextGrade ? { Grade: [nextGrade] } : {})
    }));
  }

  function handleOptionMultiChange(dimensionLabel: string, values: string[]) {
    const fallback =
      selectedOptions[dimensionLabel] ??
      dimensions?.find((dimension) => dimension.label === dimensionLabel)?.activeOption ??
      values[0];
    const nextValue = getSingleSelectionFromValues(values, fallback);

    onDimensionChange?.(dimensionLabel, nextValue);
    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      [dimensionLabel]: nextValue
    }));
    setSelectedOptionValues((currentValues) => ({
      ...currentValues,
      [dimensionLabel]: values
    }));
  }

  return (
    <section className="cs-price-history-panel">
      <header className="cs-price-history-panel-heading">
        <h3>Market Price</h3>
        {visibleDimensions?.length ? (
          <DetailDimensionControls
            dimensions={visibleDimensions}
            selectedOptions={selectedOptions}
            selectedValues={selectedOptionValues}
            onOptionChange={handleOptionChange}
            onOptionMultiChange={handleOptionMultiChange}
          />
        ) : null}
      </header>
      <article className="cs-price-history-panel-body cs-value-panel">
        <CollectionValueContent
          key={chartKey}
          title={label}
          value={selectedDataSet?.price ?? price}
          delta={selectedDataSet?.deltaToday ?? deltaToday}
          deltaPeriod="Today"
          values={selectedValues}
          valueSeries={valueSeries}
          deltaSeries={deltaSeries}
          hoverLabels={hoverLabels}
          previousCloseValue={selectedBaselineValue}
          minValue={minValue}
          maxValue={maxValue}
          pointXPositions={pointXPositions}
          chartRangeData={selectedChartRangeData}
          ranges={selectedRanges}
          activeRange={selectedRange}
          onRangeChange={onRangeChange}
          emptyLabel={selectedEmptyLabel}
          hideSummaryTitle
          renderChart={({
            values: renderedValues = [],
            previousCloseValue,
            minValue: renderedMinValue,
            maxValue: renderedMaxValue,
            pointXPositions: renderedPointXPositions,
            rangeData
          }) => (
            <PriceHistoryChart
              values={renderedValues}
              baselineValue={previousCloseValue}
              volume={rangeData?.volume ?? selectedVolume}
              minValue={renderedMinValue}
              maxValue={renderedMaxValue}
              pointXPositions={renderedPointXPositions}
            />
          )}
        >
          <PriceHistoryChart
            values={selectedValues}
            baselineValue={selectedBaselineValue}
            volume={selectedVolume}
            minValue={minValue}
            maxValue={maxValue}
            pointXPositions={pointXPositions}
          />
        </CollectionValueContent>
      </article>
    </section>
  );
}

function PriceHistoryChart({
  values,
  baselineValue,
  volume,
  minValue,
  maxValue,
  pointXPositions
}: {
  values: number[];
  baselineValue?: number;
  volume: number[];
  minValue?: number;
  maxValue?: number;
  pointXPositions?: number[];
}) {
  const maxVolume = Math.max(...volume, 1);

  return (
    <div className="cs-price-history-chart">
      <div className="cs-price-history-volume" aria-hidden="true">
        {volume.map((item, index) => (
          <span
            key={`${item}-${index}`}
            style={{ height: `${Math.max(8, (item / maxVolume) * 100)}%` } as CSSProperties}
          />
        ))}
      </div>
      <MarketSparkline
        values={values}
        baselineValue={baselineValue}
        minValue={minValue}
        maxValue={maxValue}
        xPositions={pointXPositions}
      />
    </div>
  );
}

function getVolumeAlignedPointXPositions(count: number) {
  if (count <= 0) return undefined;
  if (count === 1) return [0.5];

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return 0;
    if (index === count - 1) return 1;
    return (index + 0.5) / count;
  });
}
