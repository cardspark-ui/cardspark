import { getNumericGradeValue } from "./history-selection";
import type { MarketHistoryDataSet } from "./history-selection";

export const UNGRADED_GRADER = "Ungraded";

const PSA_GRADES = [
  "10",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1"
];

const CGC_GRADES = [
  "Pristine 10",
  "10",
  "9.5",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1"
];

const BGS_GRADES = [
  "Black Label 10",
  "Pristine 10",
  "9.5",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1"
];

const GRADER_GRADE_OPTIONS: Record<string, string[]> = {
  BGS: BGS_GRADES,
  CGC: CGC_GRADES,
  PSA: PSA_GRADES
};

function getUniqueOptions(options: string[]) {
  return Array.from(new Set(options));
}

export function getGraderName(grader: string) {
  if (grader === UNGRADED_GRADER) return grader;

  const knownGrader = Object.keys(GRADER_GRADE_OPTIONS).find((graderName) => {
    const normalizedGrader = grader.toUpperCase();

    return normalizedGrader === graderName || normalizedGrader.startsWith(`${graderName} `);
  });

  if (knownGrader) return knownGrader;

  return grader.replace(/\s+\d+(?:\.\d+)?$/, "");
}

export function getGraderGrade(grader: string) {
  const graderName = getGraderName(grader);

  if (graderName !== grader && grader.toUpperCase().startsWith(`${graderName} `)) {
    return grader.slice(graderName.length).trim();
  }

  return grader.match(/\s+(\d+(?:\.\d+)?)$/)?.[1];
}

export function getGraderOptions(graders: string[]) {
  return getUniqueOptions(graders.map((grader) => getGraderName(grader)));
}

function getStandardGradeOptionsForGrader(grader: string) {
  return GRADER_GRADE_OPTIONS[grader.toUpperCase()] ?? [];
}

function isPlainNumericGrade(grade: string) {
  return /^\d+(?:\.\d+)?$/.test(grade);
}

export function getGradeOptionsForGrader(
  grader: string,
  providedGradeOptions: string[] = [],
  dataSets: MarketHistoryDataSet[] | undefined = undefined
) {
  const standardGradeOptions = getStandardGradeOptionsForGrader(grader);
  const dataGradeOptions = [
    ...providedGradeOptions,
    ...(dataSets ?? [])
      .filter((dataSet) => {
        const dataSetGrader = dataSet.dimensions.Grader;

        return dataSetGrader ? getGraderName(dataSetGrader) === grader : false;
      })
      .map((dataSet) => getGraderGrade(dataSet.dimensions.Grader))
      .filter((grade): grade is string => Boolean(grade))
  ];

  if (standardGradeOptions.length) {
    return getUniqueOptions([
      ...standardGradeOptions,
      ...dataGradeOptions.filter((grade) => {
        if (!isPlainNumericGrade(grade)) return true;

        return !standardGradeOptions.some((standardGrade) => getNumericGradeValue(standardGrade) === grade);
      })
    ]);
  }

  return getUniqueOptions(dataGradeOptions).sort(
    (a, b) => Number(getNumericGradeValue(b)) - Number(getNumericGradeValue(a))
  );
}
