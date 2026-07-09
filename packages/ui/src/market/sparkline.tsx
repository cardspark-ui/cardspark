type SparklineTone = "positive" | "negative";

const EDGE_FADE_WIDTH = 2.5;

function getSparklineStableId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return `cs-sparkline-${hash.toString(36)}`;
}

export function MarketSparkline({
  values,
  tone = "positive",
  baselineValue,
  minValue,
  maxValue,
  xPositions
}: {
  values: number[];
  tone?: "positive" | "negative";
  baselineValue?: number;
  minValue?: number;
  maxValue?: number;
  xPositions?: number[];
}) {
  const width = 112;
  const height = 34;
  const domainValues = typeof baselineValue === "number" ? [...values, baselineValue] : values;
  const min = typeof minValue === "number" ? Math.min(minValue, ...domainValues) : Math.min(...domainValues);
  const max = typeof maxValue === "number" ? Math.max(maxValue, ...domainValues) : Math.max(...domainValues);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const providedX = xPositions?.[index];
    const progress =
      typeof providedX === "number" && Number.isFinite(providedX)
        ? Math.min(Math.max(providedX, 0), 1)
        : index / Math.max(values.length - 1, 1);
    const x = progress * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return { value, x, y };
  });
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const stableId = getSparklineStableId([pointString, tone, baselineValue, minValue, maxValue, xPositions?.join(",")].join("|"));
  const edgeFadeGradientId = `${stableId}-edge-gradient`;
  const edgeFadeMaskId = `${stableId}-edge-mask`;
  const edgeFadeOffset = (EDGE_FADE_WIDTH / width) * 100;

  function getToneSegments() {
    if (typeof baselineValue !== "number" || points.length < 2) {
      return null;
    }

    const baselineY = height - ((baselineValue - min) / range) * (height - 4) - 2;
    const segments: Record<SparklineTone, string[][]> = {
      positive: [],
      negative: []
    };
    let currentTone: SparklineTone = points[0].value >= baselineValue ? "positive" : "negative";
    let currentSegment = [`${points[0].x},${points[0].y}`];

    for (let index = 1; index < points.length; index += 1) {
      const previousPoint = points[index - 1];
      const nextPoint = points[index];
      const nextTone: SparklineTone = nextPoint.value >= baselineValue ? "positive" : "negative";

      if (nextTone === currentTone || nextPoint.value === previousPoint.value) {
        currentSegment.push(`${nextPoint.x},${nextPoint.y}`);
        continue;
      }

      const crossingProgress = (baselineValue - previousPoint.value) / (nextPoint.value - previousPoint.value);
      const crossingX = previousPoint.x + (nextPoint.x - previousPoint.x) * crossingProgress;
      const crossingPoint = `${crossingX},${baselineY}`;
      currentSegment.push(crossingPoint);
      segments[currentTone].push(currentSegment);

      currentTone = nextTone;
      currentSegment = [crossingPoint, `${nextPoint.x},${nextPoint.y}`];
    }

    segments[currentTone].push(currentSegment);

    return segments;
  }

  const toneSegments = getToneSegments();

  return (
    <svg className="cs-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Price trend">
      <defs>
        <linearGradient id={edgeFadeGradientId} x1="0" x2={width} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset={`${edgeFadeOffset}%`} stopColor="white" stopOpacity="1" />
          <stop offset={`${100 - edgeFadeOffset}%`} stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={edgeFadeMaskId} x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width={width} height={height} fill={`url(#${edgeFadeGradientId})`} />
        </mask>
      </defs>
      <g className="cs-sparkline-line" mask={`url(#${edgeFadeMaskId})`}>
        {toneSegments ? (
          <>
            {toneSegments.negative.map((segment, index) => (
              <polyline key={`negative-${index}`} data-tone="negative" points={segment.join(" ")} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {toneSegments.positive.map((segment, index) => (
              <polyline key={`positive-${index}`} data-tone="positive" points={segment.join(" ")} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </>
        ) : (
          <polyline data-tone={tone} points={pointString} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </svg>
  );
}
