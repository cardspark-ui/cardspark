export type ConditionLabelMode = "code" | "label" | "code-label";

const CONDITION_CODES: Record<string, string> = {
  "Near Mint": "NM",
  "Lightly Played": "LP",
  "Moderately Played": "MP",
  "Heavily Played": "HP",
  Damaged: "DM",
  Mint: "MT",
  Poor: "PR"
};

const GRADE_TIER_CODES: Record<string, string> = {
  "BLACK LABEL": "BL",
  PRISTINE: "P"
};

const GRADER_PREFIX_PATTERN = /^(?:PSA|BGS|CGC|SGC|TAG|ACE)\s+\d+(?:\.\d+)?$/i;
const NUMERIC_GRADE_PATTERN = /^\d+(?:\.\d+)?$/;

export function formatConditionLabel(condition: string, mode: ConditionLabelMode = "code") {
  const label = condition.trim();
  const code = getConditionCode(label);

  switch (mode) {
    case "label":
      return label;
    case "code-label":
      return code === label ? label : `${code} - ${label}`;
    case "code":
    default:
      return code;
  }
}

export function getConditionAcronym(condition: string) {
  return getConditionCode(condition.trim());
}

function getConditionCode(condition: string) {
  if (isNumericGrade(condition) || isGraderGrade(condition)) {
    return condition;
  }

  return CONDITION_CODES[condition] ?? getGradeTierCode(condition) ?? getFallbackConditionCode(condition);
}

function getGradeTierCode(condition: string) {
  const match = condition.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);

  if (!match) return undefined;

  const [, tierLabel, grade] = match;
  const displayLabel = GRADE_TIER_CODES[tierLabel.toUpperCase()];

  return displayLabel ? `${displayLabel}${grade}` : undefined;
}

function getFallbackConditionCode(condition: string) {
  return condition
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function isNumericGrade(condition: string) {
  return NUMERIC_GRADE_PATTERN.test(condition);
}

function isGraderGrade(condition: string) {
  return GRADER_PREFIX_PATTERN.test(condition);
}
