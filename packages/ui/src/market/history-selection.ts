import type { CollectionValueRangeData } from "./value-panel-content";

export type MarketHistoryDimension = {
  label: string;
  options: string[];
  activeOption: string;
};

export type MarketHistoryDataSet = {
  dimensions: Record<string, string>;
  price: string;
  deltaToday: string;
  values: number[];
  baselineValue?: number;
  range?: string;
  ranges?: string[];
  volume?: number[];
  highLabel?: string;
  lowLabel?: string;
  hoverLabels?: string[];
  chartRangeData?: Partial<Record<string, CollectionValueRangeData>>;
  emptyLabel?: string;
};

export type MarketHistorySelectionInput = {
  dataSets?: MarketHistoryDataSet[];
  dimensions?: MarketHistoryDimension[];
  selectedOptions: Record<string, string>;
  conditionDimensionLabel?: string;
  graderDimensionLabel?: string;
  ungradedGrader?: string;
};

const DEFAULT_CONDITION_DIMENSION_LABEL = "Condition";
const DEFAULT_GRADER_DIMENSION_LABEL = "Grader";
const DEFAULT_UNGRADED_GRADER = "Ungraded";

export function resolveMarketHistoryDataSet({
  dataSets,
  dimensions,
  selectedOptions,
  conditionDimensionLabel = DEFAULT_CONDITION_DIMENSION_LABEL,
  graderDimensionLabel = DEFAULT_GRADER_DIMENSION_LABEL,
  ungradedGrader = DEFAULT_UNGRADED_GRADER
}: MarketHistorySelectionInput) {
  return dataSets?.find((dataSet) =>
    dimensions?.every((dimension) => {
      if (dimension.label === conditionDimensionLabel && !isUngradedGrader(selectedOptions[graderDimensionLabel], ungradedGrader)) {
        return true;
      }

      if (dimension.label === graderDimensionLabel) {
        return getMarketHistoryGraderValues(
          selectedOptions[graderDimensionLabel],
          selectedOptions[conditionDimensionLabel],
          ungradedGrader
        ).includes(dataSet.dimensions[graderDimensionLabel]);
      }

      return dataSet.dimensions[dimension.label] === selectedOptions[dimension.label];
    })
  );
}

export function isUngradedGrader(grader: string | undefined, ungradedGrader = DEFAULT_UNGRADED_GRADER) {
  return !grader || grader === ungradedGrader;
}

export function getNumericGradeValue(grade: string | undefined) {
  return grade?.match(/(\d+(?:\.\d+)?)$/)?.[1];
}

export function getMarketHistoryGraderValue(
  grader: string | undefined,
  condition: string | undefined,
  ungradedGrader = DEFAULT_UNGRADED_GRADER
) {
  if (isUngradedGrader(grader, ungradedGrader)) {
    return ungradedGrader;
  }

  return condition ? `${grader} ${condition}` : grader;
}

export function getMarketHistoryGraderValues(
  grader: string | undefined,
  condition: string | undefined,
  ungradedGrader = DEFAULT_UNGRADED_GRADER
) {
  const graderValue = getMarketHistoryGraderValue(grader, condition, ungradedGrader);
  const numericGradeValue = getNumericGradeValue(condition);

  if (isUngradedGrader(grader, ungradedGrader) || !condition || !numericGradeValue || condition === numericGradeValue) {
    return [graderValue];
  }

  return [graderValue, `${grader} ${numericGradeValue}`];
}
