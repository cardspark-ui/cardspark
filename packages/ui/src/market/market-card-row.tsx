import { CardRow } from "../core/card-row";
import { MarketSparkline } from "./sparkline";
import type { ReactNode } from "react";
import type { TradingCardData } from "../core/card-format";

export type MarketCardRowProps = {
  card?: TradingCardData;
  name?: string;
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  variant?: string;
  value?: string;
  price?: string;
  delta?: string;
  deltaPeriod?: string;
  chart?: ReactNode;
  chartValues?: number[];
  chartTone?: "positive" | "negative";
  chartBaselineValue?: number;
  chartMinValue?: number;
  chartMaxValue?: number;
  chartXPositions?: number[];
  imageUrl?: string;
  imageAlt?: string;
  active?: boolean;
  onClick?: () => void;
};

export function MarketCardRow({
  card,
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  variant,
  value,
  price,
  delta,
  deltaPeriod,
  chart,
  chartValues,
  chartTone,
  chartBaselineValue,
  chartMinValue,
  chartMaxValue,
  chartXPositions,
  imageUrl,
  imageAlt,
  active,
  onClick
}: MarketCardRowProps) {
  const resolvedChart =
    chart ??
    (chartValues?.length ? (
      <MarketSparkline
        values={chartValues}
        tone={chartTone}
        baselineValue={chartBaselineValue}
        minValue={chartMinValue}
        maxValue={chartMaxValue}
        xPositions={chartXPositions}
      />
    ) : null);

  return (
    <CardRow
      format="market"
      card={card}
      active={active}
      name={name}
      set={set}
      setCode={setCode}
      number={number}
      rarity={rarity}
      condition={condition}
      variant={variant}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      value={value}
      price={price}
      delta={delta}
      deltaPeriod={deltaPeriod}
      chart={resolvedChart}
      className="cs-market-card-row"
      onClick={onClick}
    />
  );
}
